import { Database } from "bun:sqlite";
import type { RoleReward, Settings, User } from "@/types";

const db = new Database("bot.db");

db.query(
    `
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        avatar_url TEXT,
        xp INTEGER DEFAULT 0,
        lifetime_xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        messages_sent INTEGER DEFAULT 0,
        reactions_given INTEGER DEFAULT 0,
        voice_time_minutes INTEGER DEFAULT 0
    )
`,
).run();

db.query(
    `
    CREATE TABLE IF NOT EXISTS xp_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        source TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
`,
).run();

db.query(
    `
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        base_xp INTEGER DEFAULT 100,
        growth_exponent REAL DEFAULT 1.5,
        text_min_xp INTEGER DEFAULT 15,
        text_max_xp INTEGER DEFAULT 25,
        reaction_min_xp INTEGER DEFAULT 5,
        reaction_max_xp INTEGER DEFAULT 10,
        voice_min_xp INTEGER DEFAULT 10,
        voice_max_xp INTEGER DEFAULT 20,
        cooldown INTEGER DEFAULT 60000,
        text_xp_enabled INTEGER DEFAULT 1,
        reaction_xp_enabled INTEGER DEFAULT 1,
        voice_xp_enabled INTEGER DEFAULT 1,
        reaction_xp_mode TEXT DEFAULT 'both',
        voice_min_users INTEGER DEFAULT 2,
        role_reward_mode TEXT DEFAULT 'stack',
        level_up_channel_id TEXT DEFAULT NULL,
        level_up_message TEXT DEFAULT 'Congratulations {user.mention}! You reached level {user.level}! {earned:You unlocked the {mention} role!}'
    );
`,
).run();

db.query(
    `
    INSERT OR IGNORE INTO settings (id, base_xp, growth_exponent, text_min_xp, text_max_xp, reaction_min_xp, reaction_max_xp, voice_min_xp, voice_max_xp, cooldown, text_xp_enabled, reaction_xp_enabled, voice_xp_enabled, reaction_xp_mode, voice_min_users)
    VALUES (1, 100, 1.5, 15, 25, 5, 10, 10, 20, 60000, 1, 1, 1, 'both', 2);
`,
).run();

db.query(
    `
    CREATE TABLE IF NOT EXISTS role_rewards (
        level INTEGER PRIMARY KEY,
        role_id TEXT NOT NULL
    )
`,
).run();

db.query(
    `
    CREATE TABLE IF NOT EXISTS server_admins (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL
    )
`,
).run();

export const getAdminsQuery = db.query<
    { user_id: string; username: string },
    []
>(`SELECT user_id, username FROM server_admins`);

export const addAdminQuery = db.query<
    void,
    { $user_id: string; $username: string }
>(`INSERT INTO server_admins (user_id, username) VALUES ($user_id, $username)`);

export const clearAdminsQuery = db.query<void, []>(`DELETE FROM server_admins`);

export const getUserQuery = db.query<User, { $id: string }>(
    `SELECT id, username, avatar_url, xp, lifetime_xp, level, messages_sent, reactions_given, voice_time_minutes FROM users WHERE id = $id`,
);

export const upsertUserQuery = db.query<
    void,
    {
        $id: string;
        $username: string;
        $avatar_url: string | null;
        $xp: number;
        $lifetime_xp: number;
        $level: number;
        $messages_sent: number;
        $reactions_given: number;
        $voice_time_minutes: number;
    }
>(`
    INSERT INTO users (id, username, avatar_url, xp, lifetime_xp, level, messages_sent, reactions_given, voice_time_minutes)
        VALUES ($id, $username, $avatar_url, $xp, $lifetime_xp, $level, $messages_sent, $reactions_given, $voice_time_minutes)
        ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        avatar_url = excluded.avatar_url,
        xp = excluded.xp,
        level = excluded.level,
        lifetime_xp = excluded.lifetime_xp,
        messages_sent = excluded.messages_sent,
        reactions_given = excluded.reactions_given,
        voice_time_minutes = excluded.voice_time_minutes
`);

export const insertTransactionQuery = db.query<
    void,
    { $user_id: string; $amount: number; $source: string }
>(`
    INSERT INTO xp_transactions (user_id, amount, source)
    VALUES ($user_id, $amount, $source)
`);

const rawGetSettings = db.query<any, []>(`SELECT * FROM settings WHERE id = 1`);

export const getSettings = (): Settings => {
    const raw = rawGetSettings.get();
    return {
        ...raw,
        text_xp_enabled: Boolean(raw.text_xp_enabled),
        reaction_xp_enabled: Boolean(raw.reaction_xp_enabled),
        voice_xp_enabled: Boolean(raw.voice_xp_enabled),
    } as Settings;
};

export const updateSettingsQuery = db.query<
    void,
    {
        $base_xp: number;
        $growth_exponent: number;
        $text_min_xp: number;
        $text_max_xp: number;
        $reaction_min_xp: number;
        $reaction_max_xp: number;
        $voice_min_xp: number;
        $voice_max_xp: number;
        $cooldown: number;
        $text_xp_enabled: number;
        $reaction_xp_enabled: number;
        $voice_xp_enabled: number;
        $reaction_xp_mode: string;
        $voice_min_users: number;
        $role_reward_mode: string;
        $level_up_channel_id: string | null;
        $level_up_message: string;
    }
>(`
    UPDATE settings
    SET base_xp = $base_xp, growth_exponent = $growth_exponent,
        text_min_xp = $text_min_xp, text_max_xp = $text_max_xp,
        reaction_min_xp = $reaction_min_xp, reaction_max_xp = $reaction_max_xp,
        voice_min_xp = $voice_min_xp, voice_max_xp = $voice_max_xp,
        cooldown = $cooldown, text_xp_enabled = $text_xp_enabled,
        reaction_xp_enabled = $reaction_xp_enabled, voice_xp_enabled = $voice_xp_enabled,
        reaction_xp_mode = $reaction_xp_mode, voice_min_users = $voice_min_users,
        role_reward_mode = $role_reward_mode,
        level_up_channel_id = $level_up_channel_id,
        level_up_message = $level_up_message
    WHERE id = 1
`);

export const getOverallLeaderboardQuery = db.query<User, { $limit: number }>(`
    SELECT id, username, avatar_url, xp, lifetime_xp, level, messages_sent, reactions_given, voice_time_minutes
    FROM users
    ORDER BY lifetime_xp DESC
    LIMIT $limit
`);

export const getTimeframeLeaderboardQuery = db.query<
    {
        id: string;
        username: string;
        avatar_url: string | null;
        level: number;
        xp: number;
        total_xp: number;
    },
    { $limit: number; $since: string }
>(`
    SELECT t.user_id as id, u.username, u.avatar_url, u.level, u.xp, SUM(t.amount) as total_xp
    FROM xp_transactions t
    JOIN users u ON t.user_id = u.id
    WHERE t.timestamp >= $since
    GROUP BY t.user_id
    ORDER BY total_xp DESC
    LIMIT $limit
`);

export const getUserRankQuery = db.query<{ rank: number }, { $xp: number }>(`
    SELECT COUNT(*) + 1 as rank
    FROM users
    WHERE lifetime_xp > $xp
`);
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

export const pruneTransactionsQuery = db.query<void, []>(
    `DELETE FROM xp_transactions WHERE timestamp <= datetime('now', '-30 days')`,
);

export default db;
