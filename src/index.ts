import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { startVoiceXpJob } from "@/jobs/voiceXpJob";
import { handleMessageCreate } from "@/events/messageCreate";
import { handleMessageReactionAdd } from "@/events/messageReactionAdd";
import { handleInteractionCreate } from "@/events/interactionCreate";
import { startApiServer } from "@/api/server";
import { loadCommands } from "@/utils/commandRegistry";
import { startPruneJob } from "@/jobs/pruneJob";
import { logger } from "@/utils/logger";

declare module "discord.js" {
    export interface Client {
        commands: Collection<string, any>;
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

(async () => {
    const { commands } = await loadCommands();
    client.commands = commands;

    client.once(Events.ClientReady, (readyClient) => {
        logger.info(`Logged in as ${readyClient.user.tag}`);
        startApiServer(client);
        startVoiceXpJob(client);
        startPruneJob();
    });

    client.on(Events.MessageCreate, handleMessageCreate);
    client.on(Events.MessageReactionAdd, handleMessageReactionAdd);
    client.on(Events.InteractionCreate, handleInteractionCreate);

    process.on("unhandledRejection", (reason) => {
        logger.error("Unhandled Promise Rejection", reason);
    });

    process.on("uncaughtException", (error) => {
        logger.error("Uncaught Exception", error);
        process.exit(1);
    });

    client.on(Events.Error, (error) => {
        logger.error("Discord Client Error", error);
    });

    client.login(process.env.DISCORD_TOKEN);
})();
