import { Elysia } from "elysia";
import { ChannelType, type Client } from "discord.js";

export const channelsRoutes = (client: Client) =>
    new Elysia({ prefix: "/api/channels" }).guard(
        {
            beforeHandle: ({ headers, set }) => {
                if (
                    headers.authorization !== `Bearer ${process.env.API_TOKEN}`
                ) {
                    set.status = 401;
                    return { error: "Unauthorized" };
                }
            },
        },
        (app) =>
            app.get("/", async ({ set }) => {
                const guild = client.guilds.cache.first();

                if (!guild) {
                    set.status = 404;
                    return { error: "Bot is not in any server yet." };
                }

                const channels = guild.channels.cache
                    .filter((c) => c.type === ChannelType.GuildText)
                    .map((c) => ({
                        id: c.id,
                        name: c.name,
                        position: c.position,
                    }))
                    .sort((a, b) => a.position - b.position);

                return channels;
            }),
    );
