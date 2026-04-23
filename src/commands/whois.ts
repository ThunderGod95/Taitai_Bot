import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandContext } from "@/utils/commandContext";
import { fetchUserRankData } from "@/services/dataService";
import { BOT_UNKNOWNS } from "@/services/xpService";

export const data = new SlashCommandBuilder()
    .setName("whois")
    .setDescription("View detailed server and XP information about a user.")
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user to inspect")
            .setRequired(false),
    );

export const aliasData = new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("View detailed server and XP information about a user.")
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user to inspect")
            .setRequired(false),
    );

export const execute = async (ctx: CommandContext) => {
    await ctx.deferReply();

    const targetUser = ctx.getTargetUser();
    const guild = ctx.raw.guild;
    if (!guild)
        return ctx.editReply("This command can only be used in a server.");

    const member =
        guild.members.cache.get(targetUser.id) ||
        (await guild.members.fetch(targetUser.id).catch(() => null));
    if (!member)
        return ctx.editReply("Could not find that user in the server.");

    const rankData = fetchUserRankData(targetUser.id);
    const roles =
        member.roles.cache
            .filter((r) => r.id !== guild.id)
            .sort((a, b) => b.position - a.position)
            .map((r) => `<@&${r.id}>`)
            .join(", ") || "None";

    const embed = new EmbedBuilder()
        .setAuthor({
            name: targetUser.tag,
            iconURL: targetUser.displayAvatarURL(),
        })
        .setColor(member.displayColor || [22, 26, 28])
        .setThumbnail(targetUser.displayAvatarURL({ size: 512 }))
        .addFields(
            {
                name: "Joined Server",
                value: member.joinedAt
                    ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`
                    : "Unknown",
                inline: true,
            },
            {
                name: "Account Created",
                value: `<t:${Math.floor(targetUser.createdAt.getTime() / 1000)}:R>`,
                inline: true,
            },
            { name: "\u200B", value: "\u200B", inline: true }, // Spacer
            {
                name: "Roles",
                value:
                    roles.length > 1024 ? "Too many roles to display" : roles,
                inline: false,
            },
        );

    if (rankData && !BOT_UNKNOWNS.includes(targetUser.id)) {
        embed.addFields(
            { name: "Level", value: `${rankData.level}`, inline: true },
            {
                name: "Total XP",
                value: `${rankData.lifetime_xp}`,
                inline: true,
            },
            { name: "Rank", value: `#${rankData.rank}`, inline: true },
        );
    }

    await ctx.editReply({ embeds: [embed] });
};
