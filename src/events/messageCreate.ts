import { Message } from "discord.js";
import { config } from "@/api/server";
import { handleXp } from "@/services/xpService";
import { processRoleRewards } from "@/services/roleService";
import { CommandContext } from "@/utils/commandContext";
import { dispatchLevelUpMessage } from "@/services/notificationService";
import { logger } from "@/utils/logger";

export const handleMessageCreate = async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    const prefix = ".";
    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();

        if (commandName) {
            const command = message.client.commands.get(commandName);

            if (command) {
                try {
                    const ctx = new CommandContext(message);
                    await command.execute(ctx);
                } catch (error) {
                    logger.error(
                        `Error executing prefix command ${commandName}:`,
                        error,
                    );
                    await message.reply(
                        "There was an error while executing this command!",
                    );
                }
                return;
            }
        }
    }

    // XP Handling
    if (!config.text_xp_enabled) return;

    const avatarUrl = message.author.displayAvatarURL({
        extension: "png",
        size: 256,
    });

    const result = handleXp(
        message.author.id,
        message.author.username,
        avatarUrl,
        config.text_min_xp,
        config.text_max_xp,
        "message",
        `text_${message.author.id}`,
    );

    if (result?.leveledUp) {
        const earnedRole = await processRoleRewards(
            message.member!,
            result.newLevel,
        );
        await dispatchLevelUpMessage(
            message.member!,
            result.newLevel,
            result.xp,
            earnedRole,
        );
    }
};
