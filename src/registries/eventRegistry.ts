import fs from "fs";
import path from "path";
import type { Client } from "discord.js";
import { logger } from "../utils/logger";

export const loadEvents = async (client: Client) => {
    const eventsPath = path.join(__dirname, "../events");

    if (!fs.existsSync(eventsPath)) {
        logger.warn(`Events directory not found at ${eventsPath}`);
        return;
    }

    const eventFiles = fs
        .readdirSync(eventsPath)
        .filter((file) => file.match(/\.(ts|js)$/));

    let loadedCount = 0;

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);

        const eventName = path.parse(file).name;

        try {
            const module = await import(filePath);

            const handler = Object.values(module).find(
                (val) => typeof val === "function",
            ) as Function | undefined;

            if (handler) {
                client.on(eventName, (...args) => handler(...args));
                loadedCount++;
                logger.info(`Mounted event listener: ${eventName}`);
            } else {
                logger.warn(
                    `No exported function found in event file: ${file}`,
                );
            }
        } catch (error) {
            logger.error(`Failed to load event handler from ${file}:`, error);
        }
    }

    logger.info(`Successfully bound ${loadedCount} events to the client.`);
};
