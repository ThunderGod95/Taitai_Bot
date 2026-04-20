import { getBoosterRolesQuery } from "@/db";
import type { GuildMember } from "discord.js";
import { logger } from "@/utils/logger";

export const calculateHighestMultiplier = (
    member: GuildMember | null | undefined,
): number => {
    if (!member) return 1.0;

    try {
        const boosterRoles = getBoosterRolesQuery.all();
        if (!boosterRoles || boosterRoles.length === 0) return 1.0;

        let highestMultiplier = 1.0;

        for (const booster of boosterRoles) {
            if (member.roles.cache.has(booster.role_id)) {
                if (booster.multiplier > highestMultiplier) {
                    highestMultiplier = booster.multiplier;
                }
            }
        }

        return highestMultiplier;
    } catch (error) {
        logger.error("Failed to calculate booster multiplier:", error);
        return 1.0;
    }
};
