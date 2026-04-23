import { GuildMember, type PartialGuildMember } from "discord.js";
import { updateSingleAdminState } from "@/services/adminService";
import {
    getCultivationRolesQuery,
    insertDefaultAttainmentQuery,
} from "@/db/repositories/cultivation";
import { logger } from "@/utils/logger";

export const handleGuildMemberUpdate = async (
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember,
) => {
    // Admin Sync
    const newHasAdmin = newMember.permissions.has("Administrator");
    if (oldMember.partial) {
        await updateSingleAdminState(newMember, newHasAdmin);
        return;
    }
    const oldHasAdmin = oldMember.permissions.has("Administrator");
    if (oldHasAdmin !== newHasAdmin) {
        await updateSingleAdminState(newMember, newHasAdmin);
    }

    // Cultivation Attainment Tracker
    try {
        const registeredRoles = getCultivationRolesQuery.all();
        const lineages = registeredRoles.filter(
            (r) => r.role_type === "lineage",
        );
        const realms = registeredRoles.filter((r) => r.role_type === "realm");

        const userLineages = lineages.filter((l) =>
            newMember.roles.cache.has(l.role_id),
        );
        const userRealms = realms.filter((r) =>
            newMember.roles.cache.has(r.role_id),
        );

        for (const lineage of userLineages) {
            for (const realm of userRealms) {
                // 'INSERT OR IGNORE' handles skipping existing combinations safely
                insertDefaultAttainmentQuery.run({
                    $user_id: newMember.id,
                    $lineage_role_id: lineage.role_id,
                    $realm_role_id: realm.role_id,
                });
            }
        }
    } catch (error) {
        logger.error(
            "Error processing cultivation attainments on member update:",
            error,
        );
    }
};
