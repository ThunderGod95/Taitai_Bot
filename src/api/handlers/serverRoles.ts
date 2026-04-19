import { Elysia } from "elysia";
import type { Client } from "discord.js";
import { logger } from "@/utils/logger";

export const serverRolesRoutes = (client: Client) =>
    new Elysia({ prefix: "/api/server-roles" }).guard(
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

                try {
                    const roles = guild.roles.cache.map((role) => {
                        const colors = role.colors;

                        return {
                            id: role.id,
                            name: role.name,
                            color: role.hexColor,
                            icon_url: role.iconURL(),
                            primary_color:
                                colors?.primaryColor != null
                                    ? `#${colors.primaryColor.toString(16).padStart(6, "0")}`
                                    : null,
                            secondary_color:
                                colors?.secondaryColor != null
                                    ? `#${colors.secondaryColor.toString(16).padStart(6, "0")}`
                                    : null,
                            tertiary_color:
                                colors?.tertiaryColor != null
                                    ? `#${colors.tertiaryColor.toString(16).padStart(6, "0")}`
                                    : null,
                            position: role.position,
                            managed: role.managed,
                        };
                    });

                    return roles.sort((a, b) => b.position - a.position);
                } catch (error) {
                    logger.error("Error fetching roles:", error);
                    set.status = 500;
                    return { error: "Failed to fetch roles" };
                }
            }),
    );
