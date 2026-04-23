import { db } from "@/db/client";

export const getCultivationRolesQuery = db.query<
    { role_id: string; role_type: string; name: string; tier: number },
    []
>(`SELECT * FROM cultivation_roles ORDER BY tier DESC`);

export const upsertCultivationRoleQuery = db.query<
    void,
    { $role_id: string; $role_type: string; $name: string; $tier: number }
>(`
    INSERT INTO cultivation_roles (role_id, role_type, name, tier)
    VALUES ($role_id, $role_type, $name, $tier)
    ON CONFLICT(role_id) DO UPDATE SET
        role_type = excluded.role_type,
        name = excluded.name,
        tier = excluded.tier
`);

export const deleteCultivationRoleQuery = db.query<void, { $role_id: string }>(
    `DELETE FROM cultivation_roles WHERE role_id = $role_id`,
);

export const getAttainmentsQuery = db.query<
    {
        user_id: string;
        lineage_role_id: string;
        realm_role_id: string;
        status: string;
    },
    { $lineage_role_id: string }
>(
    `SELECT * FROM cultivation_attainments WHERE lineage_role_id = $lineage_role_id`,
);

export const insertDefaultAttainmentQuery = db.query<
    void,
    { $user_id: string; $lineage_role_id: string; $realm_role_id: string }
>(`
    INSERT OR IGNORE INTO cultivation_attainments (user_id, lineage_role_id, realm_role_id, status)
    VALUES ($user_id, $lineage_role_id, $realm_role_id, 'unassigned')
`);

export const updateAttainmentStatusQuery = db.query<
    void,
    {
        $user_id: string;
        $lineage_role_id: string;
        $realm_role_id: string;
        $status: string;
    }
>(`
    UPDATE cultivation_attainments
    SET status = $status
    WHERE user_id = $user_id AND lineage_role_id = $lineage_role_id AND realm_role_id = $realm_role_id
`);
