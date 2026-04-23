import { Guild, GuildMember } from "discord.js";
import {
    addAdminQuery,
    clearAdminsQuery,
    removeAdminQuery,
    getAdminsQuery,
} from "@/db";
import { db } from "@/db/client";
import { logger } from "@/utils/logger";

export const pushAdminsToSupabase = async () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const adminPayload = getAdminsQuery.all();

    try {
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
                `Supabase returned ${response.status}: ${errorText}`,
            );
        }
    } catch (error) {
        logger.error("Failed to sync admins to Supabase:", error);
    }
};

export const syncAdmins = async (guild: Guild) => {
    try {
        const members = await guild.members.fetch();
        const admins = members.filter(
            (m) => m.permissions.has("Administrator") && !m.user.bot,
        );

        const syncLocalDb = db.transaction(() => {
            clearAdminsQuery.run();
            for (const [_, m] of admins) {
                addAdminQuery.run({
                    $user_id: m.user.id,
                    $username: m.user.username,
                });
            }
        });

        syncLocalDb();
        await pushAdminsToSupabase();
        logger.info("Successfully performed full admin sync.");
    } catch (error) {
        logger.error("Failed to perform full admin sync:", error);
    }
};

export const updateSingleAdminState = async (
    member: GuildMember,
    isAdmin: boolean,
) => {
    try {
        if (isAdmin) {
            addAdminQuery.run({
                $user_id: member.id,
                $username: member.user.username,
            });
        } else {
            removeAdminQuery.run({ $user_id: member.id });
        }

        await pushAdminsToSupabase();
    } catch (error) {
        logger.error(
            `Failed to update local admin state for ${member.user.username}:`,
            error,
        );
    }
};
