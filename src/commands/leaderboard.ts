import {
    SlashCommandBuilder,
    AttachmentBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType,
} from "discord.js";
import { fetchLeaderboardData } from "@/services/dataService";
import { generateLeaderboardImage } from "@/services/imageService";
import { CommandContext } from "@/utils/commandContext";

const leaderboardCache = new Map<
    string,
    { buffer: Buffer; expiresAt: number }
>();

export const data = new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the top users ranked by XP.");

export const aliasData = new SlashCommandBuilder()
    .setName("lb")
    .setDescription("View the top users ranked by XP.");

export const execute = async (ctx: CommandContext) => {
    await ctx.deferReply();

    const generatePayload = async (timeframe: string) => {
        const data = fetchLeaderboardData(10, timeframe);
        if (!data || data.length === 0) return null;

        const cacheKey = `lb_${timeframe}`;
        const cached = leaderboardCache.get(cacheKey);
        let buffer: Buffer;

        if (cached && cached.expiresAt > Date.now()) {
            buffer = cached.buffer;
        } else {
            buffer = await generateLeaderboardImage(data, timeframe);
            leaderboardCache.set(cacheKey, {
                buffer,
                expiresAt: Date.now() + 60_000,
            });
        }

        const attachment = new AttachmentBuilder(buffer, {
            name: `${cacheKey}.png`,
        });

        const titles: Record<string, string> = {
            overall: "Overall Leaderboard",
            weekly: "Weekly Top Earners",
            monthly: "Monthly Top Earners",
        };
        const messageTitle = titles[timeframe] || "Leaderboard";

        const selectMenu =
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("lb_timeframe_select")
                    .setPlaceholder("Select Timeframe")
                    .addOptions([
                        {
                            label: "Overall XP",
                            value: "overall",
                            description: "All-time leaderboard",
                        },
                        {
                            label: "Weekly XP",
                            value: "weekly",
                            description: "Top earners in the last 7 days",
                        },
                        {
                            label: "Monthly XP",
                            value: "monthly",
                            description: "Top earners in the last 30 days",
                        },
                    ]),
            );

        return {
            content: `# ${messageTitle}`,
            files: [attachment],
            components: [selectMenu],
        };
    };

    const initialPayload = await generatePayload("overall");
    if (!initialPayload) {
        return ctx.editReply("The leaderboard is currently empty.");
    }

    const message = await ctx.editReply(initialPayload);

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 120_000,
    });

    collector.on("collect", async (i) => {
        if (i.user.id !== ctx.user.id) {
            await i.reply({
                content: "You cannot interact with this menu.",
                ephemeral: true,
            });
            return;
        }

        await i.deferUpdate();
        const selectedTimeframe = i.values[0];

        const newPayload = await generatePayload(selectedTimeframe!);
        if (newPayload) await i.editReply(newPayload);
    });

    collector.on("end", () => {
        ctx.editReply({ components: [] }).catch(() => {});
    });
};
