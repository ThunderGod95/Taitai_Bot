import { Database } from "bun:sqlite";
import path from "path";

export const DB_PATH = path.join(process.cwd(), "bot.db");
export const db = new Database(DB_PATH);

db.run("PRAGMA journal_mode = WAL;");
