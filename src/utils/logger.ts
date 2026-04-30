import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

const logDirectory = path.join(process.cwd(), "logs");

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.printf((info) => {
            const stack = info.stack ? `\n${info.stack}` : "";
            return `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}${stack}`;
        }),
    ),
    transports: [
        new winston.transports.Console(),

        new DailyRotateFile({
            dirname: logDirectory,
            filename: "bot-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "14d",
        }),
    ],
});
