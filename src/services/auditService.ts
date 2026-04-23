import { insertAuditLogQuery } from "@/db";
import { logger } from "@/utils/logger";

export const logAuditAction = (
    adminId: string, // This will also accept the donors id when actionType is "XP_DONATE"
    actionType: "SETTINGS_UPDATE" | "XP_MANUAL_MOD" | "XP_DONATE",
    targetId: string | null,
    changes: object | string,
) => {
    try {
        const changesString =
            typeof changes === "string" ? changes : JSON.stringify(changes);

        insertAuditLogQuery.run({
            $admin_id: adminId,
            $action_type: actionType,
            $target_id: targetId,
            $changes: changesString,
        });
    } catch (error) {
        logger.error(
            `Failed to insert audit log for action ${actionType}:`,
            error,
        );
    }
};
