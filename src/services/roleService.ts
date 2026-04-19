import { config } from "@/api/server";
import { getRoleRewardsQuery } from "@/db";
import { logger } from "@/utils/logger";
import type { GuildMember, Role } from "discord.js";

export const processRoleRewards = async (
    member: GuildMember,
    newLevel: number,
): Promise<Role | null> => {
    if (process.env.NODE_ENV !== "production") {
        return null;
    }

    const rewards = getRoleRewardsQuery.all();
    if (!rewards.length) return null;

    const eligibleRewards = rewards.filter((r) => newLevel >= r.level);
    if (!eligibleRewards.length) return null;

    const highestReward = eligibleRewards[eligibleRewards.length - 1];
    let grantedRole: Role | null = null;

    try {
        if (config.role_reward_mode === "replace") {
            const rolesToRemove = eligibleRewards
                .filter((r) => r.role_id !== highestReward?.role_id)
                .map((r) => r.role_id);

            if (rolesToRemove.length > 0) {
                await member.roles.remove(rolesToRemove);
            }

            if (!member.roles.cache.has(highestReward?.role_id!)) {
                await member.roles.add(highestReward?.role_id!);
                grantedRole =
                    member.guild.roles.cache.get(highestReward!.role_id) ||
                    null;
            }
        } else {
            const rolesToAdd = eligibleRewards
                .map((r) => r.role_id)
                .filter((id) => !member.roles.cache.has(id));

            if (rolesToAdd.length > 0) {
                await member.roles.add(rolesToAdd);
                const newlyAddedHighest = rolesToAdd[rolesToAdd.length - 1];
                grantedRole =
                    member.guild.roles.cache.get(newlyAddedHighest!) || null;
            }
        }
    } catch (error) {
        logger.error(
            `Failed to assign role to ${member.user.username}:`,
            error,
        );
    }

    return grantedRole;
};
