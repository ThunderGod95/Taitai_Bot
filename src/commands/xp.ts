import { dispatchLevelUpMessage } from "@/services/notificationService";
import { processRoleRewards } from "@/services/roleService";
import { modifyExactXp } from "@/services/xpService";
import { logAuditAction } from "@/services/auditService";
import type { CommandContext } from "@/utils/commandContext";
import {
    ChatInputCommandInteraction,
    Message,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("xp")
    .setDescription("Manage user XP (Admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
        sub
            .setName("add")
            .setDescription("Add XP to a user")
            .addUserOption((opt) =>
                opt
                    .setName("user")
                    .setDescription("The target user")
                    .setRequired(true),
            )
            .addIntegerOption((opt) =>
                opt
                    .setName("amount")
                    .setDescription("Amount of XP to add")
                    .setRequired(true),
            ),
    )
    .addSubcommand((sub) =>
        sub
            .setName("remove")
            .setDescription("Remove XP from a user")
            .addUserOption((opt) =>
                opt
                    .setName("user")
                    .setDescription("The target user")
                    .setRequired(true),
            )
            .addIntegerOption((opt) =>
                opt
                    .setName("amount")
                    .setDescription("Amount of XP to remove")
                    .setRequired(true),
            ),
    );

export const execute = async (ctx: CommandContext) => {
    await ctx.deferReply();

    if (!ctx.isInteraction) {
        const member = (ctx.raw as Message).member;
        if (!member?.permissions.has("Administrator")) {
            return ctx.editReply(
                "You must be an Administrator to use this command.",
            );
        }
    }

    // Parse Arguments
    let action: "add" | "remove";
    let amount: number;

    if (ctx.isInteraction) {
        const interaction = ctx.raw as ChatInputCommandInteraction;
        action = interaction.options.getSubcommand() as "add" | "remove";
        amount = interaction.options.getInteger("amount", true);
    } else {
        const args = (ctx.raw as Message).content.split(/ +/).slice(1);
        action = args[0]?.toLowerCase() as "add" | "remove";

        if (action !== "add" && action !== "remove") {
            return ctx.editReply(
                "Invalid syntax. Usage: `.xp <add|remove> @user <amount>`",
            );
        }

        const numArg = args.find(
            (a) => !isNaN(parseInt(a, 10)) && !a.startsWith("<@"),
        );
        if (!numArg) {
            return ctx.editReply("Please provide a valid numeric amount.");
        }
        amount = parseInt(numArg, 10);
    }

    const targetUser = ctx.getTargetUser();
    const finalAmount = action === "add" ? Math.abs(amount) : -Math.abs(amount);

    const result = modifyExactXp(
        targetUser.id,
        targetUser.username,
        targetUser.displayAvatarURL({ extension: "png", size: 256 }),
        finalAmount,
        `manual_${action}`,
    );

    if (!result) return ctx.editReply("An error occurred while modifying XP.");

    await ctx.editReply(
        `Successfully **${action === "add" ? "added" : "removed"}** ${Math.abs(amount)} XP for <@${targetUser.id}>. They are now Level ${result.newLevel}.`,
    );

    logAuditAction(ctx.user.id, "XP_MANUAL_MOD", targetUser.id, {
        action,
        amount: finalAmount,
        new_total: result.xp,
        source: "discord_command",
    });

    if (result.leveledUp && ctx.raw.guild) {
        const member =
            ctx.raw.guild.members.cache.get(targetUser.id) ||
            (await ctx.raw.guild.members
                .fetch(targetUser.id)
                .catch(() => null));

        if (member) {
            const earnedRole = await processRoleRewards(
                member,
                result.newLevel,
            );
            await dispatchLevelUpMessage(
                member,
                result.newLevel,
                result.xp,
                earnedRole,
            );
        }
    }
};
