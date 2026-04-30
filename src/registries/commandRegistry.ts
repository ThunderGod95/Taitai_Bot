import { Client, Collection } from "discord.js";
import fs from "fs";
import path from "path";
import { logger } from "@/utils/logger";

export const loadCommands = async (client: Client | null = null) => {
    const commands = new Collection<string, any>();
    const restPayloads: any[] = [];

    const commandsPath = path.join(__dirname, "../commands");
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.match(/\.(ts|js)$/));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const commandModule = await import(filePath);

        if ("data" in commandModule && "execute" in commandModule) {
            commands.set(commandModule.data.name, commandModule);
            restPayloads.push(commandModule.data.toJSON());

            if ("aliasData" in commandModule) {
                commands.set(commandModule.aliasData.name, commandModule);
                restPayloads.push(commandModule.aliasData.toJSON());
            }
        } else {
            logger.warn(
                `The command at ${filePath} is missing a required "data" or "execute" property.`,
            );
        }
    }

    if (client) {
        client.commands = commands;
    }

    return { commands, restPayloads };
};
