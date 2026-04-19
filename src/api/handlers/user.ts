import { Elysia } from "elysia";
import { fetchUserRankData } from "@/services/dataService";

export const userRoutes = new Elysia({ prefix: "/api/users" }).get(
    "/:id",
    ({ params: { id }, set }) => {
        const rankData = fetchUserRankData(id);

        if (!rankData) {
            set.status = 404;
            return { error: "User not found" };
        }

        return rankData;
    },
);
