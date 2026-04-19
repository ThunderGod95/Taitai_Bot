import { Elysia } from "elysia";
import { getAdminsQuery } from "@/db";

export const adminsRoutes = new Elysia({ prefix: "/api/admins" }).guard(
    {
        beforeHandle: ({ headers, set }) => {
            if (headers.authorization !== `Bearer ${process.env.API_TOKEN}`) {
                set.status = 401;
                return { error: "Unauthorized" };
            }
        },
    },
    (app) =>
        app.get("/", () => {
            const admins = getAdminsQuery.all();
            return { admins };
        }),
);
