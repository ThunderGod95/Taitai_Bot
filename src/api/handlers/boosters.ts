import { Elysia, t } from "elysia";
import {
    getBoosterRolesQuery,
    upsertBoosterRoleQuery,
    deleteBoosterRoleQuery,
} from "@/db";

export const boosterRoutes = new Elysia({ prefix: "/api/boosters" }).guard(
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
            .get("/", () => {
                const boosters = getBoosterRolesQuery.all();
                return { boosters };
            })
            .post(
                "/",
                ({ body, set }) => {
                    try {
                        upsertBoosterRoleQuery.run({
                            $role_id: body.role_id,
                            $name: body.name,
                            $multiplier: body.multiplier,
                        });
                        return { success: true };
                    } catch (err) {
                        set.status = 400;
                        return { error: "Invalid body or database error" };
                    }
                },
                {
                    body: t.Object({
                        role_id: t.String(),
                        name: t.String(),
                        multiplier: t.Number(),
                    }),
                },
            )
            .delete("/:id", ({ params: { id }, set }) => {
                try {
                    deleteBoosterRoleQuery.run({ $role_id: id });
                    return { success: true };
                } catch (err) {
                    set.status = 500;
                    return { error: "Failed to delete booster role" };
                }
            }),
);
