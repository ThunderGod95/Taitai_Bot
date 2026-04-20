import { Elysia } from "elysia";
import { updateSettingsQuery } from "@/db";
import { config } from "../server";
import type { Settings } from "@/types";
import { logAuditAction } from "@/services/auditService";

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
                    const payload = body as Partial<Settings> & {
                        admin_id?: string;
                    };
                    const adminId = payload.admin_id || "SYSTEM_API";

                    const changes: Record<string, any> = {};
                    for (const key of Object.keys(payload)) {
                        if (key === "admin_id") continue;

                        const currentVal = config[key as keyof Settings];
                        const newVal = payload[key as keyof Settings];

                        if (currentVal !== newVal) {
                            changes[key] = { old: currentVal, new: newVal };
                        }
                    }

                    Object.assign(config, payload);

                    updateSettingsQuery.run({
                        $base_xp: config.base_xp,
                        $multiplier: config.multiplier ?? 1.0,
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

                    if (Object.keys(changes).length > 0) {
                        logAuditAction(
                            adminId,
                            "SETTINGS_UPDATE",
                            null,
                            changes,
                        );
                    }

                    return { success: true, newConfig: config };
                } catch (err) {
                    set.status = 400;
                    return { error: "Invalid JSON body" };
                }
            }),
);
