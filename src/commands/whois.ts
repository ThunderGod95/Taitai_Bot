import {
    SlashCommandBuilder,
    EmbedBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    SeparatorBuilder,
} from "discord.js";
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

    const joinedTimestamp = member.joinedAt
        ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`
        : "Unknown";
    const createdTimestamp = `<t:${Math.floor(targetUser.createdAt.getTime() / 1000)}:R>`;
    const boostingTimestamp = member.premiumSince
        ? `<t:${Math.floor(member.premiumSince.getTime() / 1000)}:R>`
        : "Not boosting";

    const displayName =
        member.nickname || targetUser.globalName || targetUser.username;
    const isBot = targetUser.bot ? "🤖 **Bot**" : "👤 **User**";
    const highestRole =
        member.roles.highest.id !== guild.id
            ? `<@&${member.roles.highest.id}>`
            : "None";

    const container = new ContainerBuilder()
        .setAccentColor(member.displayColor || [22, 26, 28])
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder({
                        content: `## ${displayName}\n**Tag:** ${targetUser.tag}  •  **ID:** ${targetUser.id}  •  ${isBot}`,
                    }),
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder({
                        description: "user avatar",
                        media: {
                            url: targetUser.displayAvatarURL(),
                        },
                    }),
                ),
        )
        .addSeparatorComponents(new SeparatorBuilder())

        .addTextDisplayComponents(
            new TextDisplayBuilder({
                content: `### Account Details\n**Joined Server:** ${joinedTimestamp}\n**Account Created:** ${createdTimestamp}\n**Server Booster:** ${boostingTimestamp}\n`,
            }),
        )
        .addSeparatorComponents(new SeparatorBuilder())

        .addTextDisplayComponents(
            new TextDisplayBuilder({
                content: `### Roles\n**Lineage:** ${highestRole}\n\n**All Roles:**\n${roles.length > 2000 ? "Too many roles to display" : roles}\n`,
            }),
        );

    if (rankData && !BOT_UNKNOWNS.includes(targetUser.id)) {
        container
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(
                new TextDisplayBuilder({
                    content: `### Server Stats\n**Level:** ${rankData.level}  •  **Total XP:** ${rankData.lifetime_xp}  •  **Rank:** #${rankData.rank}\n`,
                }),
            );
    }

    await ctx.editReply({
        flags: ["IsComponentsV2"] as const,
        components: [container],
        allowedMentions: {
            parse: [],
            repliedUser: true,
        },
    });
};
