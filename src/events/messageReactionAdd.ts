import {
    MessageReaction,
    type PartialMessageReaction,
    User,
    type PartialUser,
} from "discord.js";
import { config } from "@/api/server";
import { awardXpAndProcessLevelUp } from "@/services/xpService";
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
    const guild = reaction.message.guild;

    // Process Reactor
    if (reaction_xp_mode === "reactor" || reaction_xp_mode === "both") {
        const reactorMember =
            guild.members.cache.get(user.id) ||
            (await guild.members.fetch(user.id).catch(() => null));

        await awardXpAndProcessLevelUp(
            reactorMember,
            user.id,
            user.username || "Unknown",
            user.displayAvatarURL({ extension: "png", size: 256 }),
            reaction_min_xp,
            reaction_max_xp,
            "reaction",
            `react_${user.id}`,
        );
    }

    // Process Message Author
    if (reaction_xp_mode === "author" || reaction_xp_mode === "both") {
        const author = reaction.message.author;

        if (author && !author.bot) {
            const authorMember =
                guild.members.cache.get(author.id) ||
                (await guild.members.fetch(author.id).catch(() => null));

            await awardXpAndProcessLevelUp(
                authorMember,
                author.id,
                author.username,
                author.displayAvatarURL({ extension: "png", size: 256 }),
                reaction_min_xp,
                reaction_max_xp,
                "reaction_received",
                `receive_react_${author.id}`,
            );
        }
    }
};
