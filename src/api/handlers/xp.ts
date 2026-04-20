import { Elysia, t } from "elysia";
import type { Client } from "discord.js";
import { modifyExactXp } from "@/services/xpService";
import { processRoleRewards } from "@/services/roleService";
import { dispatchLevelUpMessage } from "@/services/notificationService";
import { logAuditAction } from "@/services/auditService";
import { logger } from "@/utils/logger";

export const xpRoutes = (client: Client) =>
    new Elysia({ prefix: "/api/xp" }).guard(
        {
            beforeHandle: ({ headers, set }) => {
                if (
                    headers.authorization !== `Bearer ${process.env.API_TOKEN}`
                ) {
                    set.status = 401;
                    return { error: "Unauthorized" };
                }
            },
        },
        (app) =>
            app.post(
                "/",
                async ({ body, set }) => {
                    const { user_id, amount, action, admin_id } = body;

                    if (action !== "add" && action !== "remove") {
                        set.status = 400;
                        return { error: "Action must be 'add' or 'remove'." };
                    }

                    const guild = client.guilds.cache.first();
                    if (!guild) {
                        set.status = 404;
                        return { error: "Bot is not initialized in a server." };
                    }

                    const member =
                        guild.members.cache.get(user_id) ||
                        (await guild.members.fetch(user_id).catch(() => null));
                    if (!member) {
                        set.status = 404;
                        return { error: "User not found in the server." };
                    }

                    const finalAmount =
                        action === "add" ? Math.abs(amount) : -Math.abs(amount);

                    const result = modifyExactXp(
                        member.user.id,
                        member.user.username,
                        member.user.displayAvatarURL({
                            extension: "png",
                            size: 256,
                        }),
                        finalAmount,
                        `api_${action}`,
                    );

                    if (!result) {
                        set.status = 500;
                        return {
                            error: "Failed to modify XP in the database.",
                        };
                    }

                    logAuditAction(admin_id, "XP_MANUAL_MOD", user_id, {
                        action,
                        amount: finalAmount,
                        new_total: result.xp,
                    });

                    if (result.leveledUp) {
                        try {
                            const earnedRole = await processRoleRewards(
                                member,
                                result.newLevel,
                            );
                            await dispatchLevelUpMessage(
                                member,
                                result.newLevel,
                                result.xp,
                                earnedRole,
                            );
                        } catch (error) {
                            logger.error(
                                `Failed to process API level up for ${member.user.username}:`,
                                error,
                            );
                        }
                    }

                    return {
                        success: true,
                        new_level: result.newLevel,
                        total_xp: result.xp,
                    };
                },
                {
                    body: t.Object({
                        user_id: t.String(),
                        amount: t.Number(),
                        action: t.String(),
                        admin_id: t.String(),
                    }),
                },
            ),
    );
