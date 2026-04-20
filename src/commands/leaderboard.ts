import {
    SlashCommandBuilder,
    AttachmentBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType,
    MessageFlags,
    ChatInputCommandInteraction,
    Message,
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
    .setDescription("View the top users ranked by XP.")
    .addStringOption((option) =>
        option
            .setName("type")
            .setDescription("The type of leaderboard to view")
            .addChoices(
                { name: "Overall XP", value: "overall" },
                { name: "Weekly XP", value: "weekly" },
                { name: "Monthly XP", value: "monthly" },
                { name: "Reactions", value: "reactions" },
                { name: "Voice Time", value: "voice" },
            )
            .setRequired(false),
    );

export const aliasData = new SlashCommandBuilder()
    .setName("lb")
    .setDescription("View the top users ranked by XP.")
    .addStringOption((option) =>
        option
            .setName("type")
            .setDescription("The type of leaderboard to view")
            .addChoices(
                { name: "Overall XP", value: "overall" },
                { name: "Weekly XP", value: "weekly" },
                { name: "Monthly XP", value: "monthly" },
                { name: "Reactions", value: "reactions" },
                { name: "Voice Time", value: "voice" },
            )
            .setRequired(false),
    );

export const execute = async (ctx: CommandContext) => {
    await ctx.deferReply();

    let initialType = "overall";

    if (ctx.isInteraction) {
        const interaction = ctx.raw as ChatInputCommandInteraction;
        initialType = interaction.options.getString("type") || "overall";
    } else {
        const args = (ctx.raw as Message).content.split(/ +/).slice(1);
        const parsedArg = args[0]?.toLowerCase();

        const validTypes = [
            "overall",
            "weekly",
            "monthly",
            "reactions",
            "voice",
        ];
        if (parsedArg && validTypes.includes(parsedArg)) {
            initialType = parsedArg;
        }
    }

    const generatePayload = async (type: string) => {
        const data = fetchLeaderboardData(10, type);
        if (!data || data.length === 0) return null;

        // Grab fresh avatar URLs from the cache to prevent 404s
        for (const user of data) {
            const cachedUser = ctx.raw.client.users.cache.get(user.id);
            if (cachedUser) {
                user.avatar_url = cachedUser.displayAvatarURL({
                    extension: "png",
                    size: 256,
                });
            }
        }

        const cacheKey = `lb_${type}`;
        const cached = leaderboardCache.get(cacheKey);
        let buffer: Buffer;

        if (cached && cached.expiresAt > Date.now()) {
            buffer = cached.buffer;
        } else {
            buffer = await generateLeaderboardImage(data, type);
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
            reactions: "Top Reactions Given",
            voice: "Top Voice Time",
        };
        const messageTitle = titles[type] || "Leaderboard";

        const selectMenu =
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("lb_type_select")
                    .setPlaceholder("Select Type")
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
                        {
                            label: "Reactions",
                            value: "reactions",
                            description: "Most reactions given",
                        },
                        {
                            label: "Voice Time",
                            value: "voice",
                            description: "Most time spent in voice channels",
                        },
                    ]),
            );

        return {
            content: `# ${messageTitle}`,
            files: [attachment],
            components: [selectMenu],
        };
    };

    const initialPayload = await generatePayload(initialType);
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
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await i.deferUpdate();
        const selectedType = i.values[0];

        const newPayload = await generatePayload(selectedType!);
        if (newPayload) await i.editReply(newPayload);
    });

    collector.on("end", () => {
        ctx.editReply({ components: [] }).catch(() => {});
    });
};
