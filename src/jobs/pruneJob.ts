import { pruneTransactionsQuery } from "@/db";
import { logger } from "@/utils/logger";

export const startPruneJob = () => {
    const runPrune = () => {
        try {
            pruneTransactionsQuery.run();
            logger.info(
                "Successfully pruned xp_transactions older than 30 days.",
            );
        } catch (error) {
            logger.error("Error pruning xp_transactions database:", error);
        }
    };

    runPrune();

    // Schedule to run every 24 hours (86,400,000 ms)
    setInterval(runPrune, 86_400_000);
};
