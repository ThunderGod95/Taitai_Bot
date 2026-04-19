import winston from "winston";

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
        new winston.transports.File({ filename: "bot.log" }),
    ],
});
