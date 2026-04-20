import { Database } from "bun:sqlite";
import fs from "fs";
import path from "path";

const db = new Database("bot.db");

const settings = db
    .query<
        { base_xp: number; multiplier: number },
        []
    >(`SELECT base_xp, multiplier FROM settings WHERE id = 1`)
    .get() || { base_xp: 100, multiplier: 1 }; // Fallback to defaults just in case

console.log(
    `Loaded settings: Base XP = ${settings.base_xp}, Multiplier = ${settings.multiplier}`,
);

export const calculateXpForNextLevel = (level: number) =>
    Math.floor((level * settings.base_xp + 75) * settings.multiplier);

const dataPath = path.join(process.cwd(), "arcane_data.json");
if (!fs.existsSync(dataPath)) {
    console.error(
        `Error: Could not find ${dataPath}. Make sure you saved the JSON output correctly.`,
    );
    process.exit(1);
}

const rawData = fs.readFileSync(dataPath, "utf-8");
const arcaneData = JSON.parse(rawData);

console.log(
    `Found ${arcaneData.length} users to migrate. Starting migration...`,
);

const upsertUser = db.query(`
    INSERT INTO users (id, username, xp, lifetime_xp, level, messages_sent, reactions_given, voice_time_minutes)
    VALUES ($id, $username, $xp, $lifetime_xp, $level, $messages_sent, $reactions_given, $voice_time_minutes)
    ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        lifetime_xp = excluded.lifetime_xp,
        xp = excluded.xp,
        level = excluded.level,
        messages_sent = excluded.messages_sent,
        reactions_given = excluded.reactions_given,
        voice_time_minutes = excluded.voice_time_minutes
`);

const runMigration = db.transaction(() => {
    for (const user of arcaneData) {
        let currentLevel = 1;
        let remainderXp = user.total_xp;
        let xpNeeded = calculateXpForNextLevel(currentLevel);

        while (remainderXp >= xpNeeded) {
            currentLevel += 1;
            remainderXp -= xpNeeded;
            xpNeeded = calculateXpForNextLevel(currentLevel);
        }

        upsertUser.run({
            $id: user.id,
            $username: user.username,
            $lifetime_xp: user.total_xp,
            $xp: remainderXp,
            $level: currentLevel,
            $messages_sent: user.messages,
            $reactions_given: user.reactions,
            $voice_time_minutes: user.voice_mins,
        });
    }
});

try {
    runMigration();
    console.log("Migration completed successfully!");
} catch (error) {
    console.error("An error occurred during migration:", error);
}
