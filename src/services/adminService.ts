import { Guild } from "discord.js";
import { addAdminQuery, clearAdminsQuery } from "@/db";
import db from "@/db";
import { logger } from "@/utils/logger";

export const syncAdmins = async (guild: Guild) => {
    try {
        const members = await guild.members.fetch();
        const admins = members.filter(
            (m) => m.permissions.has("Administrator") && !m.user.bot,
        );

        const adminPayload = admins.map((m) => ({
            user_id: m.user.id,
            username: m.user.username,
        }));

        const syncLocalDb = db.transaction(() => {
            clearAdminsQuery.run();
            for (const admin of adminPayload) {
                addAdminQuery.run({
                    $user_id: admin.user_id,
                    $username: admin.username,
                });
            }
        });

        syncLocalDb();

        // This is a custom solution to sync server admins with https://xuanjian.vercel.app
        // This will also us to directly integrate the bot dashboard
        // into the web app without having to create a new site.
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            logger.warn(
                "Supabase credentials missing. Local DB updated, but remote sync skipped.",
            );
            return;
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sync_admins`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
                apikey: supabaseKey,
            },
            body: JSON.stringify({ admin_data: adminPayload }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Supabase returned ${response.status} ${response.statusText}: ${errorText}`,
            );
        }

        logger.info(
            `Successfully synced ${adminPayload.length} admins to DB & Supabase.`,
        );
    } catch (error) {
        logger.error("Failed to sync admins:", error);
    }
};
