import { SlashCommandBuilder, EmbedBuilder, Role } from "discord.js";
import type { CommandContext } from "@/utils/commandContext";
import { getLineageManifest } from "@/services/cultivationService";

export const data = new SlashCommandBuilder()
    .setName("lineage")
    .setDescription("View the prominent cultivators of a specific Dao lineage.")
    .addRoleOption((opt) =>
        opt
            .setName("role")
            .setDescription("The Dao lineage role")
            .setRequired(true),
    );

export const execute = async (ctx: CommandContext) => {
    await ctx.deferReply();
    const guild = ctx.raw.guild;
    if (!guild)
        return ctx.editReply("This command can only be used in a server.");

    const lineageRole = ctx.isInteraction
        ? ((ctx.raw as any).options.getRole("role") as Role)
        : null;
    if (!lineageRole)
        return ctx.editReply("Please provide a valid lineage role.");

    const result = await getLineageManifest(guild, lineageRole);
    if (!result) return ctx.editReply("Failed to fetch lineage data.");

    const formatMentions = (ids: string[]) =>
        ids.length > 0 ? ids.map((id) => `<@${id}>`).join(", ") : "None";

    const embed = new EmbedBuilder()
        .setTitle(`📜 Dao Lineage: ${lineageRole.name}`)
        .setColor(lineageRole.color || [22, 26, 28])
        .setDescription(
            `**Total Cultivators:** ${result.total}\n\n*Listed by highest cultivation realm.*`,
        );

    for (const realm of result.realms) {
        const realmData = result.manifest[realm.role_id];

        // Explicitly check for undefined to satisfy noUncheckedIndexedAccess
        if (!realmData) continue;

        const hasAnyMembers = Object.values(realmData).some(
            (arr) => arr.length > 0,
        );
        if (!hasAnyMembers) continue;

        if (
            realmData.fruition.length > 0 ||
            realmData.surplus.length > 0 ||
            realmData.intercalary.length > 0 ||
            realmData.unassigned.length > 0
        ) {
            if (realmData.fruition.length > 0)
                embed.addFields({
                    name: `👑 ${realm.name} - Fruition`,
                    value: formatMentions(realmData.fruition),
                });
            if (realmData.surplus.length > 0)
                embed.addFields({
                    name: `🟡 ${realm.name} - Surplus`,
                    value: formatMentions(realmData.surplus),
                });
            if (realmData.intercalary.length > 0)
                embed.addFields({
                    name: `☯️ ${realm.name} - Intercalary`,
                    value: formatMentions(realmData.intercalary),
                });
            if (realmData.unassigned.length > 0)
                embed.addFields({
                    name: `⚠️ ${realm.name} - Unassigned`,
                    value: formatMentions(realmData.unassigned),
                });
        } else {
            embed.addFields({
                name: `✨ ${realm.name}`,
                value: formatMentions(realmData.default),
            });
        }
    }

    if (embed.data.fields?.length === 0) {
        embed.addFields({
            name: "Notice",
            value: "No prominent cultivators found in recorded realms.",
        });
    }

    await ctx.editReply({ embeds: [embed] });
};
