import { Elysia } from "elysia";
import { updateSettingsQuery } from "@/db";
import { config } from "../server";
import type { Settings } from "@/types";

export const settingsRoutes = new Elysia({ prefix: "/api/settings" }).guard(
    {
        beforeHandle: ({ headers, set }) => {
            if (headers.authorization !== `Bearer ${process.env.API_TOKEN}`) {
                set.status = 401;
                return { error: "Unauthorized" };
            }
        },
    },
    (app) =>
        app
            .get("/", () => config)
            .post("/", ({ body, set }) => {
                try {
                    const settingsBody = body as Partial<Settings>;
                    Object.assign(config, settingsBody);

                    updateSettingsQuery.run({
                        $base_xp: config.base_xp,
                        $growth_exponent: config.growth_exponent,
                        $text_min_xp: config.text_min_xp,
                        $text_max_xp: config.text_max_xp,
                        $reaction_min_xp: config.reaction_min_xp,
                        $reaction_max_xp: config.reaction_max_xp,
                        $voice_min_xp: config.voice_min_xp,
                        $voice_max_xp: config.voice_max_xp,
                        $cooldown: config.cooldown,
                        $text_xp_enabled: config.text_xp_enabled ? 1 : 0,
                        $reaction_xp_enabled: config.reaction_xp_enabled
                            ? 1
                            : 0,
                        $voice_xp_enabled: config.voice_xp_enabled ? 1 : 0,
                        $reaction_xp_mode: config.reaction_xp_mode,
                        $voice_min_users: config.voice_min_users,
                        $role_reward_mode: config.role_reward_mode,
                        $level_up_channel_id:
                            config.level_up_channel_id ?? null,
                        $level_up_message: config.level_up_message,
                    });

                    return { success: true, newConfig: config };
                } catch (err) {
                    set.status = 400;
                    return { error: "Invalid JSON body" };
                }
            }),
);
