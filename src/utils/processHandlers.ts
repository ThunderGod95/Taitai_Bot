import { Client, Events } from "discord.js";
import { logger } from "@/utils/logger";
import { db } from "@/db/client";

export const setupProcessHandlers = (client: Client) => {
    const gracefulShutdown = async (reason: string, exitCode: number) => {
        logger.error(`Shutting down due to: ${reason}`);

        try {
            client.destroy();
            logger.info("Discord client destroyed.");

            db.close();
            logger.info("Database connection closed.");
        } catch (shutdownError) {
            logger.error(
                "Error occurred during graceful shutdown:",
                shutdownError,
            );
        } finally {
            setTimeout(() => {
                process.exit(exitCode);
            }, 1000);
        }
    };

    process.on("unhandledRejection", (reason) => {
        logger.error(`Unhandled Rejection: ${reason}`);
    });

    process.on("uncaughtException", (error) => {
        gracefulShutdown("Uncaught Exception", 1);
    });

    process.on("SIGINT", () => {
        gracefulShutdown("SIGINT (Ctrl+C)", 0);
    });

    process.on("SIGTERM", () => {
        gracefulShutdown("SIGTERM (Process Killed)", 0);
    });

    client.on(Events.Error, (error) => {
        logger.error("Discord Client Error", error);
        // We don't exit here. Discord.js automatically attempts
        // to reconnect on standard Gateway WebSocket errors.
    });
};
