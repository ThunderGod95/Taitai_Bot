import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandContext } from "@/utils/commandContext";
import { getSettings, getBoosterRolesQuery } from "@/db";

export const data = new SlashCommandBuilder()
    .setName("xpinfo")
    .setDescription("View the server's current XP rates and multipliers.");

export const aliasData = new SlashCommandBuilder()
    .setName("rates")
    .setDescription("View the server's current XP rates and multipliers.");

export const execute = async (ctx: CommandContext) => {
    await ctx.deferReply();

    const config = getSettings();
    const boosters = getBoosterRolesQuery.all();

    let boosterText = "No active booster roles.";
    if (boosters.length > 0) {
        boosterText = boosters
            .map((b) => `<@&${b.role_id}>: **${b.multiplier}x**`)
            .join("\n");
    }

    const embed = new EmbedBuilder()
        .setTitle("📊 Server XP Rates")
        .setColor([22, 26, 28])
        .addFields(
            {
                name: "💬 Text XP",
                value: config.text_xp_enabled
                    ? `${config.text_min_xp} - ${config.text_max_xp} XP`
                    : "Disabled",
                inline: true,
            },
            {
                name: "🎙️ Voice XP",
                value: config.voice_xp_enabled
                    ? `${config.voice_min_xp} - ${config.voice_max_xp} XP per minute\n*(Min ${config.voice_min_users} users)*`
                    : "Disabled",
                inline: true,
            },
            {
                name: "⭐ Reaction XP",
                value: config.reaction_xp_enabled
                    ? `${config.reaction_min_xp} - ${config.reaction_max_xp} XP\n*(Mode: ${config.reaction_xp_mode})*`
                    : "Disabled",
                inline: true,
            },
            {
                name: "⏱️ Cooldown",
                value: `${config.cooldown / 1000} seconds`,
                inline: true,
            },
            {
                name: "🚀 Role Multipliers",
                value: boosterText,
                inline: false,
            },
        );

    await ctx.editReply({ embeds: [embed] });
};
