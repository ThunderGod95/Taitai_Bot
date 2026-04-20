import { db } from "@/db/client";
import type { RoleReward } from "@/types";

// --- Booster Roles ---
export const getBoosterRolesQuery = db.query<
    { role_id: string; name: string; multiplier: number },
    []
>(`SELECT role_id, name, multiplier FROM booster_roles`);

export const upsertBoosterRoleQuery = db.query<
    void,
    { $role_id: string; $name: string; $multiplier: number }
>(`
    INSERT INTO booster_roles (role_id, name, multiplier)
    VALUES ($role_id, $name, $multiplier)
    ON CONFLICT(role_id) DO UPDATE SET
        name = excluded.name,
        multiplier = excluded.multiplier
`);

export const deleteBoosterRoleQuery = db.query<void, { $role_id: string }>(
    `DELETE FROM booster_roles WHERE role_id = $role_id`,
);

// --- Role Rewards ---
export const getRoleRewardsQuery = db.query<RoleReward, []>(
    `SELECT level, role_id FROM role_rewards ORDER BY level ASC`,
);

export const upsertRoleRewardQuery = db.query<
    void,
    { $level: number; $role_id: string }
>(
    `INSERT INTO role_rewards (level, role_id) VALUES ($level, $role_id)
     ON CONFLICT(level) DO UPDATE SET role_id = excluded.role_id`,
);

export const deleteRoleRewardQuery = db.query<void, { $level: number }>(
    `DELETE FROM role_rewards WHERE level = $level`,
);
