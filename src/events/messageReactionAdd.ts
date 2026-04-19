import {
    MessageReaction,
    type PartialMessageReaction,
    User,
    type PartialUser,
} from "discord.js";
import { config } from "@/api/server";
import { handleXp } from "@/services/xpService";
import { processRoleRewards } from "@/services/roleService";
import { dispatchLevelUpMessage } from "@/services/notificationService";
import { logger } from "@/utils/logger";

export const handleMessageReactionAdd = async (
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
) => {
    if (!config.reaction_xp_enabled || user.bot || !reaction.message.guild)
        return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            logger.error("Failed to fetch reaction:", error);
            return;
        }
    }

    if (reaction.message.partial) {
        try {
            await reaction.message.fetch();
        } catch (error) {
            logger.error("Failed to fetch message:", error);
            return;
        }
    }

    const { reaction_xp_mode, reaction_min_xp, reaction_max_xp } = config;

    if (reaction_xp_mode === "reactor" || reaction_xp_mode === "both") {
        const reactorResult = handleXp(
            user.id,
            user.username || "Unknown",
            user.displayAvatarURL({ extension: "png", size: 256 }),
            reaction_min_xp,
            reaction_max_xp,
            "reaction",
            `react_${user.id}`,
        );

        if (reactorResult?.leveledUp) {
            const member =
                reaction.message.guild.members.cache.get(user.id) ||
                (await reaction.message.guild.members
                    .fetch(user.id)
                    .catch(() => null));

            if (member) {
                const earnedRole = await processRoleRewards(
                    member,
                    reactorResult.newLevel,
                );
                await dispatchLevelUpMessage(
                    member,
                    reactorResult.newLevel,
                    reactorResult.xp,
                    earnedRole,
                );
            }
        }
    }

    if (reaction_xp_mode === "author" || reaction_xp_mode === "both") {
        const author = reaction.message.author;

        if (author && !author.bot) {
            const authorResult = handleXp(
                author.id,
                author.username,
                author.displayAvatarURL({ extension: "png", size: 256 }),
                reaction_min_xp,
                reaction_max_xp,
                "reaction_received",
                `receive_react_${author.id}`,
            );

            if (authorResult?.leveledUp) {
                const member =
                    reaction.message.guild.members.cache.get(author.id) ||
                    (await reaction.message.guild.members
                        .fetch(author.id)
                        .catch(() => null));

                if (member) {
                    const earnedRole = await processRoleRewards(
                        member,
                        authorResult.newLevel,
                    );
                    await dispatchLevelUpMessage(
                        member,
                        authorResult.newLevel,
                        authorResult.xp,
                        earnedRole,
                    );
                }
            }
        }
    }
};
