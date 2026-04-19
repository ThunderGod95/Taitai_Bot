import { getUserQuery, upsertUserQuery, insertTransactionQuery } from "../db";
import { config } from "@/api/server";
import type { XpSource } from "@/types";

const xpCooldowns = new Set<string>();

export const calculateXpForNextLevel = (level: number) =>
    Math.floor(config.base_xp * Math.pow(level, config.growth_exponent));

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
): { leveledUp: boolean; newLevel: number; xp: number } | null => {
    if (cooldownKey) {
        if (xpCooldowns.has(cooldownKey)) return null;
        xpCooldowns.add(cooldownKey);
        setTimeout(() => {
            xpCooldowns.delete(cooldownKey);
        }, config.cooldown);
    }

    const userData = getUserQuery.get({ $id: userId }) ?? {
        id: userId,
        username,
        avatar_url: avatarUrl,
        xp: 0,
        lifetime_xp: 0,
        level: 1,
        messages_sent: 0,
        reactions_given: 0,
        voice_time_minutes: 0,
    };

    const gainedXp = getRandomXp(minXp, maxXp);
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

    upsertUserQuery.run({
        $id: userId,
        $username: username,
        $avatar_url: avatarUrl,
        $xp: userData.xp,
        $lifetime_xp: userData.lifetime_xp,
        $level: userData.level,
        $messages_sent: userData.messages_sent,
        $reactions_given: userData.reactions_given,
        $voice_time_minutes: userData.voice_time_minutes,
    });

    insertTransactionQuery.run({
        $user_id: userId,
        $amount: gainedXp,
        $source: source,
    });

    return leveledUp
        ? { leveledUp, newLevel: userData.level, xp: userData.lifetime_xp }
        : null;
};
