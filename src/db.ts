import { db } from "./db/client";

export * from "./db/repositories/admin";
export * from "./db/repositories/leaderboards";
export * from "./db/repositories/roles";
export * from "./db/repositories/settings";
export * from "./db/repositories/users";

export default db;
