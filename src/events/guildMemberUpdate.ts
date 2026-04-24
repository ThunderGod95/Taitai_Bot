import { GuildMember, type PartialGuildMember } from "discord.js";
import { updateSingleAdminState } from "@/services/adminService";

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
};
