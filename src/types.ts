export interface Settings {
    id?: number;
    base_xp: number;
    multiplier: number;
    text_min_xp: number;
    text_max_xp: number;
    reaction_min_xp: number;
    reaction_max_xp: number;
    voice_min_xp: number;
    voice_max_xp: number;
    cooldown: number;

    text_xp_enabled: boolean;
    reaction_xp_enabled: boolean;
    voice_xp_enabled: boolean;
    reaction_xp_mode: "reactor" | "author" | "both";
    voice_min_users: number;

    role_reward_mode: "stack" | "replace";

    level_up_channel_id: string | null;
    level_up_message: string;
}

export type XpSource = "message" | "reaction" | "reaction_received" | "voice";

export interface User {
    id: string;
    username: string;
    avatar_url: string;
    xp: number;
    lifetime_xp: number;
    level: number;
    messages_sent: number;
    reactions_given: number;
    voice_time_minutes: number;
}

export interface RoleReward {
    level: number;
    role_id: string;
}

export interface BoosterRole {
    role_id: string;
    name: string;
    multiplier: number;
}
