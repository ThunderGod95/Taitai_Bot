import { db } from "@/db/client";
import type { User } from "@/types";

export const getOverallLeaderboardQuery = db.query<User, { $limit: number }>(`
    SELECT id, username, avatar_url, xp, lifetime_xp, level, messages_sent, reactions_given, voice_time_minutes
    FROM users
    ORDER BY lifetime_xp DESC
    LIMIT $limit
`);

export const getTypeLeaderboardQuery = db.query<
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

export const getReactionsLeaderboardQuery = db.query<User, { $limit: number }>(`
    SELECT id, username, avatar_url, xp, lifetime_xp, level, messages_sent, reactions_given, voice_time_minutes
    FROM users
    ORDER BY reactions_given DESC
    LIMIT $limit
`);

export const getVoiceLeaderboardQuery = db.query<User, { $limit: number }>(`
    SELECT id, username, avatar_url, xp, lifetime_xp, level, messages_sent, reactions_given, voice_time_minutes
    FROM users
    ORDER BY voice_time_minutes DESC
    LIMIT $limit
`);
