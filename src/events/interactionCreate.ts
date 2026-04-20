import { MessageFlags, type Interaction } from "discord.js";
import { CommandContext } from "@/utils/commandContext";
import { logger } from "@/utils/logger";

export const handleInteractionCreate = async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        logger.error(
            `No command matching ${interaction.commandName} was found.`,
        );
        return;
    }

    try {
        const ctx = new CommandContext(interaction);
        await command.execute(ctx);
    } catch (error) {
        logger.error(`Error executing ${interaction.commandName}:`, error);
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "There was an error while executing this command!",
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                await interaction.reply({
                    content: "There was an error while executing this command!",
                    flags: MessageFlags.Ephemeral,
                });
            }
        } catch (fallbackError) {
            logger.error(
                "Failed to send interaction error fallback message.",
                fallbackError,
            );
        }
    }
};
