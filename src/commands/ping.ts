import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandContext } from "@/utils/commandContext";
import fs from "fs";
import path from "path";

export const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot's latency and database stats.");

export const aliasData = new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Check the bot's latency and database stats.");

export const execute = async (ctx: CommandContext) => {
    // Capture start time to calculate API latency
    const start = Date.now();
    await ctx.deferReply();
    const apiLatency = Date.now() - start;

    const wsLatency = ctx.raw.client.ws.ping;

    let dbSizeStr = "Unknown";
    try {
        const dbPath = path.join(process.cwd(), "bot.db");
        const stats = fs.statSync(dbPath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        dbSizeStr = `${sizeInMB} MB`;
    } catch (e) {}

    const memory = process.memoryUsage();
    const memUsed = (memory.heapUsed / 1024 / 1024).toFixed(2);

    const embed = new EmbedBuilder()
        .setTitle("🏓 Pong! Bot Statistics")
        .setColor([22, 26, 28])
        .addFields(
            {
                name: "📡 WebSocket Ping",
                value: `${wsLatency}ms`,
                inline: true,
            },
            { name: "⏱️ API Latency", value: `${apiLatency}ms`, inline: true },
            { name: "\u200B", value: "\u200B", inline: true }, // Spacer
            { name: "💾 Database Size", value: dbSizeStr, inline: true },
            { name: "🧠 RAM Usage", value: `${memUsed} MB`, inline: true },
            { name: "\u200B", value: "\u200B", inline: true }, // Spacer
        );

    await ctx.editReply({ embeds: [embed] });
};
