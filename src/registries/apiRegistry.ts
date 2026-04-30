import fs from "fs";
import path from "path";
import type { Client } from "discord.js";
import { Elysia } from "elysia";
import { logger } from "@/utils/logger";

export const loadApiRoutes = async (client: Client): Promise<Elysia<any>[]> => {
    const plugins: Elysia<any>[] = [];
    const handlersPath = path.join(__dirname, "../api/handlers");

    if (!fs.existsSync(handlersPath)) {
        logger.warn(`API handlers directory not found at ${handlersPath}`);
        return plugins;
    }

    const handlerFiles = fs
        .readdirSync(handlersPath)
        .filter((file) => file.match(/\.(ts|js)$/));

    for (const file of handlerFiles) {
        const filePath = path.join(handlersPath, file);

        try {
            const module = await import(filePath);

            for (const [exportName, exportedValue] of Object.entries(module)) {
                if (exportedValue instanceof Elysia) {
                    plugins.push(exportedValue);
                    logger.info(
                        `Mounted static API route: ${exportName} from ${file}`,
                    );
                } else if (typeof exportedValue === "function") {
                    const pluginInstance = exportedValue(client);

                    if (pluginInstance instanceof Elysia) {
                        plugins.push(pluginInstance);
                        logger.info(
                            `Mounted dynamic API route: ${exportName} from ${file}`,
                        );
                    }
                }
            }
        } catch (error) {
            logger.error(`Failed to load API handler from ${file}:`, error);
        }
    }

    return plugins;
};
