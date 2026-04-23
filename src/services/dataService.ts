import {
    getUserQuery,
    getUserRankQuery,
    getOverallLeaderboardQuery,
    getTypeLeaderboardQuery,
    getReactionsLeaderboardQuery,
    getVoiceLeaderboardQuery,
} from "@/db";
import { BOT_UNKNOWNS, calculateXpForNextLevel } from "./xpService";

export const fetchUserRankData = (userId: string) => {
    const userData = getUserQuery.get({ $id: userId });
    if (!userData) return null;

    const rankData = getUserRankQuery.get({ $xp: userData.lifetime_xp });
    const xpNeededForLevel = calculateXpForNextLevel(userData.level);
    const currentLevelProgress = userData.xp;

    return {
        ...userData,
        rank: rankData?.rank || 1,
        nextLevelXp: xpNeededForLevel,
        currentLevelProgress,
        xpNeededForLevel,
    };
};

export const fetchLeaderboardData = (
    limit: number = 10,
    type: string = "overall",
) => {
    let rawData;

    if (type === "overall") {
        rawData = getOverallLeaderboardQuery
            .all({ $limit: limit })
            .map((u) => ({
                id: u.id,
                username: u.username,
                avatar_url: u.avatar_url,
                level: u.level,
                xp: u.xp,
                total_xp: u.lifetime_xp,
            }));
    } else if (type === "reactions") {
        rawData = getReactionsLeaderboardQuery
            .all({ $limit: limit })
            .map((u) => ({
                id: u.id,
                username: u.username,
                avatar_url: u.avatar_url,
                level: u.level,
                xp: u.xp,
                total_xp: u.reactions_given,
            }));
    } else if (type === "voice") {
        rawData = getVoiceLeaderboardQuery.all({ $limit: limit }).map((u) => ({
            id: u.id,
            username: u.username,
            avatar_url: u.avatar_url,
            level: u.level,
            xp: u.xp,
            total_xp: u.voice_time_minutes,
        }));
    } else {
        const date = new Date();
        let since: string;

        if (type === "weekly") {
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            date.setDate(diff);
            date.setHours(0, 0, 0, 0);
            since = date.toISOString().replace("T", " ").split(".")[0]!;
        } else if (type === "monthly") {
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            since = date.toISOString().replace("T", " ").split(".")[0]!;
        } else {
            since = date.toISOString().replace("T", " ").split(".")[0]!;
        }

        rawData = getTypeLeaderboardQuery.all({
            $limit: limit,
            $since: since!,
        });
    }

    rawData = rawData.filter((u) => !BOT_UNKNOWNS.includes(u.id));

    return rawData.map((user) => ({
        ...user,
        xpNeeded: calculateXpForNextLevel(user.level),
    }));
};
