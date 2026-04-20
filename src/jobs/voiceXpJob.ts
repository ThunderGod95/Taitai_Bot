import { Client, GuildMember } from "discord.js";
import { config } from "@/api/server";
import { handleXp } from "@/services/xpService";
import { processRoleRewards } from "@/services/roleService";
import { dispatchLevelUpMessage } from "@/services/notificationService";
import { calculateHighestMultiplier } from "@/services/boosterService";
import db from "@/db";
import { logger } from "@/utils/logger";

/**
 * Scans all guilds and voice channels to find users eligible for voice XP.
 */
const getEligibleVoiceMembers = (client: Client): GuildMember[] => {
    const eligibleMembers: GuildMember[] = [];

    client.guilds.cache.forEach((guild) => {
        guild.channels.cache.forEach((channel) => {
            if (channel.isVoiceBased()) {
                const validMembers = channel.members.filter((m) => !m.user.bot);

                if (validMembers.size >= config.voice_min_users) {
                    validMembers.forEach((member) =>
                        eligibleMembers.push(member),
                    );
                }
            }
        });
    });

    return eligibleMembers;
};

export const startVoiceXpJob = (client: Client) => {
    if (!config.voice_xp_enabled) return;

    setInterval(() => {
        const eligibleMembers = getEligibleVoiceMembers(client);
        if (eligibleMembers.length === 0) return;

        const levelUps: {
            member: GuildMember;
            newLevel: number;
            xp: number;
        }[] = [];

        const processXpTransaction = db.transaction(() => {
            for (const member of eligibleMembers) {
                const multiplier = calculateHighestMultiplier(member);

                const result = handleXp(
                    member.user.id,
                    member.user.username,
                    member.user.displayAvatarURL({
                        extension: "png",
                        size: 256,
                    }),
                    config.voice_min_xp,
                    config.voice_max_xp,
                    "voice",
                    undefined,
                    multiplier,
                );

                if (result?.leveledUp) {
                    levelUps.push({
                        member,
                        newLevel: result.newLevel,
                        xp: result.xp,
                    });
                }
            }
        });

        try {
            processXpTransaction();
        } catch (error) {
            logger.error("Error executing voice XP transaction:", error);
            return;
        }

        for (const { member, newLevel, xp } of levelUps) {
            processRoleRewards(member, newLevel)
                .then((earnedRole) =>
                    dispatchLevelUpMessage(member, newLevel, xp, earnedRole),
                )
                .catch((error) => {
                    logger.error(
                        `Failed to process level up for ${member.user.username}:`,
                        error,
                    );
                });
        }
    }, 60000);
};
