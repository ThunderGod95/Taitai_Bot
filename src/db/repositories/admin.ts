import { db } from "@/db/client";

export const getAdminsQuery = db.query<
    { user_id: string; username: string },
    []
>(`SELECT user_id, username FROM server_admins`);

export const addAdminQuery = db.query<
    void,
    { $user_id: string; $username: string }
>(`INSERT INTO server_admins (user_id, username) VALUES ($user_id, $username)`);

export const clearAdminsQuery = db.query<void, []>(`DELETE FROM server_admins`);

export const insertAuditLogQuery = db.query<
    void,
    {
        $admin_id: string;
        $action_type: string;
        $target_id: string | null;
        $changes: string;
    }
>(`
    INSERT INTO audit_logs (admin_id, action_type, target_id, changes)
    VALUES ($admin_id, $action_type, $target_id, $changes)
`);

export const getAuditLogsQuery = db.query<
    {
        id: number;
        admin_id: string;
        action_type: string;
        target_id: string | null;
        changes: string;
        timestamp: string;
    },
    { $limit: number; $offset: number }
>(`
    SELECT id, admin_id, action_type, target_id, changes, timestamp
    FROM audit_logs
    ORDER BY timestamp DESC
    LIMIT $limit OFFSET $offset
`);
