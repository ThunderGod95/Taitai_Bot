import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { startVoiceXpJob } from "@/jobs/voiceXpJob";
import { startApiServer } from "@/api/server";
import { loadCommands } from "@/registries/commandRegistry";
import { loadEvents } from "@/registries/eventRegistry";
import { startPruneJob } from "@/jobs/pruneJob";
import { logger } from "@/utils/logger";
import { syncAdmins } from "@/services/adminService";
import { setupProcessHandlers } from "./utils/processHandlers";

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
        GatewayIntentBits.GuildMembers,
    ],
});

(async () => {
    // Load slash commands.
    await loadCommands(client);

    // Register all event listeners.
    await loadEvents(client);

    // Graceful Shutdown
    setupProcessHandlers(client);

    client.once(Events.ClientReady, async (readyClient) => {
        logger.info(`Logged in as ${readyClient.user.tag}`);
        await startApiServer(client);
        startVoiceXpJob(client);
        startPruneJob();

        const guild = readyClient.guilds.cache.first();
        if (guild) {
            await syncAdmins(guild);
        }
    });

    client.login(process.env.DISCORD_TOKEN);
})();
