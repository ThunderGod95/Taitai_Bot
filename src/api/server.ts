import { Elysia } from "elysia";
import { getSettings } from "@/db";
import type { Settings } from "@/types";
import type { Client } from "discord.js";
import { serverRolesRoutes } from "./handlers/serverRoles";
import { channelsRoutes } from "./handlers/channels";
import { logger } from "@/utils/logger";
import { adminsRoutes } from "./handlers/admin";
import { xpRoutes } from "./handlers/xp";
import { settingsRoutes } from "./handlers/settings";
import { leaderboardRoutes } from "./handlers/leaderboard";
import { userRoutes } from "./handlers/user";
import { roleRewardsRoutes } from "./handlers/roleRewards";
import { boosterRoutes } from "./handlers/boosters";
import cors from "@elysiajs/cors";
import { cultivationRoutes } from "./handlers/cultivation";

export let config: Settings = getSettings();

export const startApiServer = (client: Client) => {
    const app = new Elysia()
        .use(cors())
        .use(settingsRoutes)
        .use(roleRewardsRoutes)
        .use(leaderboardRoutes)
        .use(userRoutes)
        .use(adminsRoutes)
        .use(boosterRoutes)
        .use(cultivationRoutes)
        .use(serverRolesRoutes(client))
        .use(channelsRoutes(client))
        .use(xpRoutes(client))
        .listen({ port: 8484, hostname: "0.0.0.0" });

    logger.info(
        `API Server running at ${app.server?.hostname}:${app.server?.port}`,
    );
};
