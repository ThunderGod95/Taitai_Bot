import { Elysia, t } from "elysia";
import {
    deleteRoleRewardQuery,
    getRoleRewardsQuery,
    upsertRoleRewardQuery,
} from "@/db";

export const roleRewardsRoutes = new Elysia({ prefix: "/api/roles" }).guard(
    {
        beforeHandle: ({ headers, set }) => {
            if (headers.authorization !== `Bearer ${process.env.API_TOKEN}`) {
                set.status = 401;
                return { error: "Unauthorized" };
            }
        },
    },
    (app) =>
        app
            .get("/", () => getRoleRewardsQuery.all())
            .post(
                "/",
                ({ body, set }) => {
                    try {
                        upsertRoleRewardQuery.run({
                            $level: body.level,
                            $role_id: body.role_id,
                        });
                        return { success: true };
                    } catch (err) {
                        set.status = 400;
                        return { error: "Invalid body" };
                    }
                },
                {
                    body: t.Object({
                        level: t.Number(),
                        role_id: t.String(),
                    }),
                },
            )
            .delete("/", ({ query: { level }, set }) => {
                const parsedLevel = parseInt(level || "0", 10);
                if (parsedLevel > 0) {
                    deleteRoleRewardQuery.run({ $level: parsedLevel });
                    return { success: true };
                }

                set.status = 400;
                return { error: "Invalid level parameter" };
            }),
);
