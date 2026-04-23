import { db } from "./client";

export function initDb() {
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
            multiplier REAL DEFAULT 1,
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
        )
    `,
    ).run();

    db.query(
        `
        INSERT OR IGNORE INTO settings (id, base_xp, multiplier, text_min_xp, text_max_xp, reaction_min_xp, reaction_max_xp, voice_min_xp, voice_max_xp, cooldown, text_xp_enabled, reaction_xp_enabled, voice_xp_enabled, reaction_xp_mode, voice_min_users)
        VALUES (1, 100, 1, 15, 25, 5, 10, 10, 20, 60000, 1, 1, 1, 'both', 2)
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

    db.query(
        `
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id TEXT NOT NULL,
            action_type TEXT NOT NULL,
            target_id TEXT,
            changes TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,
    ).run();

    db.query(
        `
        CREATE TABLE IF NOT EXISTS booster_roles (
            role_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            multiplier REAL NOT NULL
        )
    `,
    ).run();

    db.query(
        `
        CREATE TABLE IF NOT EXISTS xp_donations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            donor_id TEXT NOT NULL,
            recipient_id TEXT NOT NULL,
            amount INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(donor_id) REFERENCES users(id),
            FOREIGN KEY(recipient_id) REFERENCES users(id)
        )
    `,
    ).run();
}

// To make sure the tables are created before anything else is run.
initDb();
