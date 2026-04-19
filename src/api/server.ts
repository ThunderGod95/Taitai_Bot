import { Elysia } from "elysia";
import { settingsRoutes } from "./handlers/settings";
import { leaderboardRoutes } from "./handlers/leaderboard";
import { userRoutes } from "./handlers/user";
import { roleRewardsRoutes } from "./handlers/roleRewards";
import { getSettings } from "@/db";
import type { Settings } from "@/types";
import type { Client } from "discord.js";
import { serverRolesRoutes } from "./handlers/serverRoles";
import { channelsRoutes } from "./handlers/channels";
import { logger } from "@/utils/logger";
import { adminsRoutes } from "./handlers/admin";

export let config: Settings = getSettings();

export const startApiServer = (client: Client) => {
    const app = new Elysia()
        .use(settingsRoutes)
        .use(roleRewardsRoutes)
        .use(leaderboardRoutes)
        .use(userRoutes)
        .use(adminsRoutes)
        .use(serverRolesRoutes(client))
        .use(channelsRoutes(client))
        .listen(3000);

    logger.info(
        `API Server running at ${app.server?.hostname}:${app.server?.port}`,
    );
};
