import { Elysia } from "elysia";
import { fetchLeaderboardData } from "@/services/dataService";

export const leaderboardRoutes = new Elysia({ prefix: "/api/leaderboard" }).get(
    "/",
    ({ query: { timeframe = "overall", limit = "10" } }) => {
        const parsedLimit = parseInt(limit, 10);
        const data = fetchLeaderboardData(parsedLimit, timeframe);

        return {
            timeframe,
            limit: parsedLimit,
            leaderboard: data,
        };
    },
);
