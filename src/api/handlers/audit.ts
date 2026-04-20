import { Elysia } from "elysia";
import { getAuditLogsQuery } from "@/db";

export const auditRoutes = new Elysia({ prefix: "/api/audit" }).guard(
    {
        beforeHandle: ({ headers, set }) => {
            if (headers.authorization !== `Bearer ${process.env.API_TOKEN}`) {
                set.status = 401;
                return { error: "Unauthorized" };
            }
        },
    },
    (app) =>
        app.get("/", ({ query: { limit = "50", offset = "0" }, set }) => {
            try {
                const parsedLimit = parseInt(limit, 10);
                const parsedOffset = parseInt(offset, 10);

                if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
                    set.status = 400;
                    return { error: "Limit and offset must be valid numbers." };
                }

                const logs = getAuditLogsQuery.all({
                    $limit: parsedLimit,
                    $offset: parsedOffset,
                });

                const formattedLogs = logs.map((log) => {
                    let parsedChanges;
                    try {
                        parsedChanges = JSON.parse(log.changes);
                    } catch {
                        parsedChanges = log.changes;
                    }

                    return {
                        ...log,
                        changes: parsedChanges,
                    };
                });

                return {
                    limit: parsedLimit,
                    offset: parsedOffset,
                    logs: formattedLogs,
                };
            } catch (error) {
                set.status = 500;
                return {
                    error: "Failed to fetch audit logs from the database.",
                };
            }
        }),
);
