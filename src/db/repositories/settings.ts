import { db } from "@/db/client";
import type { Settings } from "@/types";

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
        $multiplier: number;
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
    SET base_xp = $base_xp, multiplier = $multiplier,
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
