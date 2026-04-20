import { Elysia } from "elysia";
import { fetchLeaderboardData } from "@/services/dataService";

export const leaderboardRoutes = new Elysia({ prefix: "/api/leaderboard" }).get(
    "/",
    ({ query: { type = "overall", limit = "10" } }) => {
        const parsedLimit = parseInt(limit, 10);
        const data = fetchLeaderboardData(parsedLimit, type);

        return {
            type,
            limit: parsedLimit,
            leaderboard: data,
        };
    },
);
