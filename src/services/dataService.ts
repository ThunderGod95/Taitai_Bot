import {
    getUserQuery,
    getUserRankQuery,
    getOverallLeaderboardQuery,
    getTimeframeLeaderboardQuery,
} from "@/db";
import { calculateXpForNextLevel } from "./xpService";

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
    timeframe: string = "overall",
) => {
    let rawData;

    if (timeframe === "overall") {
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
    } else {
        const date = new Date();
        if (timeframe === "weekly") date.setDate(date.getDate() - 7);
        if (timeframe === "monthly") date.setMonth(date.getMonth() - 1);

        const since = date.toISOString().replace("T", " ").split(".")[0];
        rawData = getTimeframeLeaderboardQuery.all({
            $limit: limit,
            $since: since!,
        });
    }

    return rawData.map((user) => ({
        ...user,
        xpNeeded: calculateXpForNextLevel(user.level),
    }));
};
