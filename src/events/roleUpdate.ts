import { Role } from "discord.js";
import { syncAdmins } from "@/services/adminService";

export const handleRoleUpdate = async (oldRole: Role, newRole: Role) => {
    const oldHasAdmin = oldRole.permissions.has("Administrator");
    const newHasAdmin = newRole.permissions.has("Administrator");

    if (oldHasAdmin !== newHasAdmin) {
        await syncAdmins(newRole.guild);
    }
};
