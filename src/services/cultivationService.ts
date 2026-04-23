import {
    getCultivationRolesQuery,
    getAttainmentsQuery,
} from "@/db/repositories/cultivation";
import type { Guild, Role } from "discord.js";

export interface ManifestGroup {
    unassigned: string[];
    fruition: string[];
    surplus: string[];
    intercalary: string[];
    default: string[];
}

export const getLineageManifest = async (guild: Guild, lineageRole: Role) => {
    await guild.members.fetch();

    const allRoles = getCultivationRolesQuery.all();
    const realms = allRoles
        .filter((r) => r.role_type === "realm")
        .sort((a, b) => b.tier - a.tier);
    const attainments = getAttainmentsQuery.all({
        $lineage_role_id: lineageRole.id,
    });

    const manifest: Record<string, ManifestGroup> = {};
    for (const realm of realms) {
        manifest[realm.role_id] = {
            unassigned: [],
            fruition: [],
            surplus: [],
            intercalary: [],
            default: [],
        };
    }

    let totalMembers = 0;

    for (const [userId, member] of lineageRole.members) {
        totalMembers++;
        const highestRealm = realms.find((r) =>
            member.roles.cache.has(r.role_id),
        );

        if (highestRealm) {
            const attainment = attainments.find(
                (a) =>
                    a.user_id === userId &&
                    a.realm_role_id === highestRealm.role_id,
            );
            const status = attainment?.status || "default";

            const group = manifest[highestRealm.role_id];

            if (group) {
                if (status in group) {
                    group[status as keyof ManifestGroup].push(userId);
                } else {
                    group.default.push(userId);
                }
            }
        }
    }

    return { total: totalMembers, realms, manifest };
};
