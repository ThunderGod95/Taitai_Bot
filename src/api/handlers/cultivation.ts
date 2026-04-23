import { Elysia, t } from "elysia";
import {
    getCultivationRolesQuery,
    upsertCultivationRoleQuery,
    deleteCultivationRoleQuery,
    updateAttainmentStatusQuery,
} from "@/db/repositories/cultivation";

export const cultivationRoutes = new Elysia({
    prefix: "/api/cultivation",
}).guard(
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
            .get("/roles", () => getCultivationRolesQuery.all())
            .post(
                "/roles",
                ({ body, set }) => {
                    try {
                        upsertCultivationRoleQuery.run({
                            $role_id: body.role_id,
                            $role_type: body.role_type,
                            $name: body.name,
                            $tier: body.tier,
                        });
                        return { success: true };
                    } catch (err) {
                        set.status = 500;
                        return { error: "Failed to upsert role." };
                    }
                },
                {
                    body: t.Object({
                        role_id: t.String(),
                        role_type: t.String(), // 'lineage' or 'realm'
                        name: t.String(),
                        tier: t.Number(), // e.g., 5 for Golden Core, 3 for Foundation
                    }),
                },
            )
            .delete("/roles/:id", ({ params: { id }, set }) => {
                try {
                    deleteCultivationRoleQuery.run({ $role_id: id });
                    return { success: true };
                } catch (err) {
                    set.status = 500;
                    return { error: "Failed to delete role." };
                }
            })

            .post(
                "/attainment",
                ({ body, set }) => {
                    try {
                        updateAttainmentStatusQuery.run({
                            $user_id: body.user_id,
                            $lineage_role_id: body.lineage_role_id,
                            $realm_role_id: body.realm_role_id,
                            $status: body.status,
                        });
                        return { success: true };
                    } catch (err) {
                        set.status = 500;
                        return { error: "Failed to update attainment status." };
                    }
                },
                {
                    body: t.Object({
                        user_id: t.String(),
                        lineage_role_id: t.String(),
                        realm_role_id: t.String(),
                        status: t.String(),
                    }),
                },
            ),
);
