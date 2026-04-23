import { dispatchLevelUpMessage } from "@/services/notificationService";
import { processRoleRewards } from "@/services/roleService";
import { modifyExactXp, BOT_UNKNOWNS } from "@/services/xpService";
import { logAuditAction } from "@/services/auditService";
import type { CommandContext } from "@/utils/commandContext";
import {
    getUserQuery,
    getWeeklyDonationsQuery,
    insertDonationQuery,
} from "@/db";
import { db } from "@/db/client";
import {
    ChatInputCommandInteraction,
    Message,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("xp")
    .setDescription("Manage or donate user XP")
    .addSubcommand((sub) =>
        sub
            .setName("add")
            .setDescription("Add XP to a user (Admin only)")
            .addUserOption((opt) =>
                opt
                    .setName("user")
                    .setDescription("The target user")
                    .setRequired(true),
            )
            .addIntegerOption((opt) =>
                opt
                    .setName("amount")
                    .setDescription("Amount to add")
                    .setRequired(true)
                    .setMinValue(1),
            ),
    )
    .addSubcommand((sub) =>
        sub
            .setName("remove")
            .setDescription("Remove XP from a user (Admin only)")
            .addUserOption((opt) =>
                opt
                    .setName("user")
                    .setDescription("The target user")
                    .setRequired(true),
            )
            .addIntegerOption((opt) =>
                opt
                    .setName("amount")
                    .setDescription("Amount to remove")
                    .setRequired(true)
                    .setMinValue(1),
            ),
    )
    .addSubcommand((sub) =>
        sub
            .setName("donate")
            .setDescription("Donate your own XP to another user")
            .addUserOption((opt) =>
                opt
                    .setName("user")
                    .setDescription("The user receiving the XP")
                    .setRequired(true),
            )
            .addIntegerOption((opt) =>
                opt
                    .setName("amount")
                    .setDescription("Amount to donate")
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(5000),
            ),
    );

export const execute = async (ctx: CommandContext) => {
    await ctx.deferReply();

    let action: "add" | "remove" | "donate";
    let amount: number;

    if (ctx.isInteraction) {
        const interaction = ctx.raw as ChatInputCommandInteraction;
        action = interaction.options.getSubcommand() as
            | "add"
            | "remove"
            | "donate";
        amount = interaction.options.getInteger("amount", true);
    } else {
        const args = (ctx.raw as Message).content.split(/ +/).slice(1);
        action = args[0]?.toLowerCase() as "add" | "remove" | "donate";

        if (!["add", "remove", "donate"].includes(action)) {
            return ctx.editReply(
                "Invalid syntax. Usage: `.xp <add|remove|donate> @user <amount>`",
            );
        }

        const numArg = args.find(
            (a) => !isNaN(parseInt(a, 10)) && !a.startsWith("<@"),
        );
        if (!numArg)
            return ctx.editReply("Please provide a valid numeric amount.");
        amount = parseInt(numArg, 10);
    }

    if (action === "add" || action === "remove") {
        const member = ctx.isInteraction
            ? (ctx.raw.member as any)
            : (ctx.raw as Message).member;
        if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
            return ctx.editReply(
                "You must be an Administrator to use this specific subcommand.",
            );
        }
    }

    const targetUser = ctx.getTargetUser();

    if (
        BOT_UNKNOWNS.includes(targetUser.id) ||
        BOT_UNKNOWNS.includes(ctx.user.id)
    ) {
        return ctx.editReply("We dare not measure the heavens.");
    }

    if (action === "donate") {
        if (ctx.user.id === targetUser.id)
            return ctx.editReply("You cannot donate XP to yourself.");

        const donorData = getUserQuery.get({ $id: ctx.user.id });
        if (!donorData || donorData.lifetime_xp < amount) {
            return ctx.editReply(
                `Donation failed: You only have **${donorData?.lifetime_xp || 0}** total XP available.`,
            );
        }

        // Limits (7 days rolling window)
        const date = new Date();
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Calculate Monday
        date.setDate(diff);
        date.setHours(0, 0, 0, 0);

        const since = date.toISOString().replace("T", " ").split(".")[0];

        const weeklyDonations = getWeeklyDonationsQuery.all({
            $donor_id: ctx.user.id,
            $since: since!,
        });

        const totalDonated = weeklyDonations.reduce(
            (sum, d) => sum + d.amount,
            0,
        );
        const uniqueRecipients = new Set(
            weeklyDonations.map((d) => d.recipient_id),
        );

        if (totalDonated + amount > 5000) {
            return ctx.editReply(
                `Donation failed: You can only donate up to 5,000 XP per week. You have **${5000 - totalDonated}** XP remaining to donate this week.`,
            );
        }

        if (
            uniqueRecipients.size >= 3 &&
            !uniqueRecipients.has(targetUser.id)
        ) {
            return ctx.editReply(
                "Donation failed: You can only donate to a maximum of **3 unique users** per week.",
            );
        }

        const processTransfer = db.transaction(() => {
            const donorRes = modifyExactXp(
                ctx.user.id,
                ctx.user.username,
                ctx.user.displayAvatarURL({ extension: "png", size: 256 }),
                -amount,
                "xp_donate_sent",
            );

            const recipientRes = modifyExactXp(
                targetUser.id,
                targetUser.username,
                targetUser.displayAvatarURL({ extension: "png", size: 256 }),
                amount,
                "xp_donate_received",
            );

            insertDonationQuery.run({
                $donor_id: ctx.user.id,
                $recipient_id: targetUser.id,
                $amount: amount,
            });

            return { donorRes, recipientRes };
        });

        const { recipientRes } = processTransfer();

        logAuditAction(ctx.user.id, "XP_DONATE", targetUser.id, {
            amount,
            recipient_new_total: recipientRes?.xp,
        });

        await ctx.editReply(
            `Successfully donated **${amount} XP** to <@${targetUser.id}>!`,
        );

        if (recipientRes?.leveledUp && ctx.raw.guild) {
            const member =
                ctx.raw.guild.members.cache.get(targetUser.id) ||
                (await ctx.raw.guild.members
                    .fetch(targetUser.id)
                    .catch(() => null));
            if (member) {
                const earnedRole = await processRoleRewards(
                    member,
                    recipientRes.newLevel,
                );
                await dispatchLevelUpMessage(
                    member,
                    recipientRes.newLevel,
                    recipientRes.xp,
                    earnedRole,
                );
            }
        }
        return;
    }

    // ADD / REMOVE
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
