import { REST, Routes } from "discord.js";
import { loadCommands } from "@/registries/commandRegistry";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
    console.error(
        "Missing DISCORD_TOKEN or CLIENT_ID in environment variables.",
    );
    process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
    try {
        const { restPayloads } = await loadCommands();

        console.log(
            `Started refreshing ${restPayloads.length} application (/) commands.`,
        );

        const data: any = await rest.put(Routes.applicationCommands(clientId), {
            body: restPayloads,
        });

        console.log(
            `Successfully reloaded ${data.length} application (/) commands.`,
        );

        process.exit(0);
    } catch (error) {
        console.error("Error deploying commands:", error);
        process.exit(1);
    }
})();
