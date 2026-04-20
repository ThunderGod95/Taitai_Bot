import { db } from "@/db/client";
import type { User } from "@/types";

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

export const getUserRankQuery = db.query<{ rank: number }, { $xp: number }>(`
    SELECT COUNT(*) + 1 as rank
    FROM users
    WHERE lifetime_xp > $xp
`);

export const insertTransactionQuery = db.query<
    void,
    { $user_id: string; $amount: number; $source: string }
>(`
    INSERT INTO xp_transactions (user_id, amount, source)
    VALUES ($user_id, $amount, $source)
`);

export const pruneTransactionsQuery = db.query<void, []>(
    `DELETE FROM xp_transactions WHERE timestamp <= datetime('now', '-30 days')`,
);
