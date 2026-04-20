import { getUserQuery, upsertUserQuery, insertTransactionQuery } from "@/db";
import { config } from "@/api/server";
import type { XpSource } from "@/types";
import type { GuildMember } from "discord.js";
import { calculateHighestMultiplier } from "./boosterService";
import { processRoleRewards } from "./roleService";
import { dispatchLevelUpMessage } from "./notificationService";

const xpCooldowns = new Set<string>();

export const BOT_UNKNOWNS = ["1413099172856594492"];

export const calculateXpForNextLevel = (level: number) =>
    Math.floor((level * config.base_xp + 75) * config.multiplier);

const getRandomXp = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

export const handleXp = (
    userId: string,
    username: string,
    avatarUrl: string | null,
    minXp: number,
    maxXp: number,
    source: XpSource,
    cooldownKey?: string,
    multiplier: number = 1.0,
): { leveledUp: boolean; newLevel: number; xp: number } | null => {
    if (BOT_UNKNOWNS.includes(userId)) return null;

    if (cooldownKey) {
        if (xpCooldowns.has(cooldownKey)) return null;
        xpCooldowns.add(cooldownKey);
        setTimeout(() => {
            xpCooldowns.delete(cooldownKey);
        }, config.cooldown);
    }

    const userData = getOrCreateUser(userId, username, avatarUrl);

    const gainedXp = Math.floor(getRandomXp(minXp, maxXp) * multiplier);
    userData.xp += gainedXp;
    userData.lifetime_xp += gainedXp;

    if (source === "message") userData.messages_sent += 1;
    if (source === "reaction") userData.reactions_given += 1;
    if (source === "voice") userData.voice_time_minutes += 1;

    let leveledUp = false;
    let xpNeeded = calculateXpForNextLevel(userData.level);

    while (userData.xp >= xpNeeded) {
        userData.level += 1;
        userData.xp -= xpNeeded;
        leveledUp = true;
        xpNeeded = calculateXpForNextLevel(userData.level);
    }

    saveUser(userData);

    insertTransactionQuery.run({
        $user_id: userId,
        $amount: gainedXp,
        $source: source,
    });

    return leveledUp
        ? { leveledUp, newLevel: userData.level, xp: userData.lifetime_xp }
        : null;
};

export const modifyExactXp = (
    userId: string,
    username: string,
    avatarUrl: string | null,
    amount: number,
    source: string,
): { leveledUp: boolean; newLevel: number; xp: number } | null => {
    if (BOT_UNKNOWNS.includes(userId)) return null;

    const userData = getOrCreateUser(userId, username, avatarUrl);

    userData.xp += amount;
    userData.lifetime_xp += amount;

    let leveledUp = false;

    if (amount > 0) {
        let xpNeeded = calculateXpForNextLevel(userData.level);
        while (userData.xp >= xpNeeded) {
            userData.level += 1;
            userData.xp -= xpNeeded;
            leveledUp = true;
            xpNeeded = calculateXpForNextLevel(userData.level);
        }
    }

    if (amount < 0) {
        while (userData.xp < 0 && userData.level > 1) {
            userData.level -= 1;
            userData.xp += calculateXpForNextLevel(userData.level);
        }

        // Clamp at Level 1, 0 XP if they are completely drained
        if (userData.xp < 0) userData.xp = 0;
        if (userData.lifetime_xp < 0) userData.lifetime_xp = 0;
    }

    saveUser(userData);

    insertTransactionQuery.run({
        $user_id: userId,
        $amount: amount,
        $source: source,
    });

    return { leveledUp, newLevel: userData.level, xp: userData.lifetime_xp };
};

const getOrCreateUser = (
    userId: string,
    username: string,
    avatarUrl: string | null,
) => {
    return (
        getUserQuery.get({ $id: userId }) ?? {
            id: userId,
            username,
            avatar_url: avatarUrl,
            xp: 0,
            lifetime_xp: 0,
            level: 1,
            messages_sent: 0,
            reactions_given: 0,
            voice_time_minutes: 0,
        }
    );
};

const saveUser = (userData: any) => {
    upsertUserQuery.run({
        $id: userData.id,
        $username: userData.username,
        $avatar_url: userData.avatar_url,
        $xp: userData.xp,
        $lifetime_xp: userData.lifetime_xp,
        $level: userData.level,
        $messages_sent: userData.messages_sent,
        $reactions_given: userData.reactions_given,
        $voice_time_minutes: userData.voice_time_minutes,
    });
};

export const awardXpAndProcessLevelUp = async (
    member: GuildMember | null,
    userId: string,
    username: string,
    avatarUrl: string | null,
    minXp: number,
    maxXp: number,
    source: XpSource,
    cooldownKey?: string,
) => {
    if (!member) return;

    const multiplier = calculateHighestMultiplier(member);

    const result = handleXp(
        userId,
        username,
        avatarUrl,
        minXp,
        maxXp,
        source,
        cooldownKey,
        multiplier,
    );

    if (result?.leveledUp) {
        const earnedRole = await processRoleRewards(member, result.newLevel);
        await dispatchLevelUpMessage(
            member,
            result.newLevel,
            result.xp,
            earnedRole,
        );
    }
};
