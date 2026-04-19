import { GuildMember, type PartialGuildMember } from "discord.js";
import { syncAdmins } from "@/services/adminService";

export const handleGuildMemberUpdate = async (
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember,
) => {
    const newHasAdmin = newMember.permissions.has("Administrator");

    // If the old member state wasn't cached, we can't reliably check their previous permissions.
    // To be safe, if they are an admin now, we'll trigger a sync just in case.
    if (oldMember.partial) {
        if (newHasAdmin) {
            await syncAdmins(newMember.guild);
        }
        return;
    }

    const oldHasAdmin = oldMember.permissions.has("Administrator");

    if (oldHasAdmin !== newHasAdmin) {
        await syncAdmins(newMember.guild);
    }
};
