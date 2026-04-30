import { Elysia } from "elysia";
import { getSettings } from "@/db";
import type { Settings } from "@/types";
import type { Client } from "discord.js";
import cors from "@elysiajs/cors";
import { loadApiRoutes } from "@/registries/apiRegistry";
import { logger } from "@/utils/logger";

export let config: Settings = getSettings();

export const startApiServer = async (client: Client) => {
    const app = new Elysia().use(cors());

    const routes = await loadApiRoutes(client);

    for (const route of routes) {
        app.use(route);
    }

    app.listen({ port: 8484, hostname: "0.0.0.0" });

    logger.info(
        `API Server running at ${app.server?.hostname}:${app.server?.port}`,
    );
};
