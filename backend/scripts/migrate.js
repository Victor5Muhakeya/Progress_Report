import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { getPool, closePool } from "../src/config/database.js";

const migrationsDirectory = fileURLToPath(new URL("../src/db/migrations/", import.meta.url));
const lockId = 74291863;
let client;

try {
    client = await getPool().connect();
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [lockId]);
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version text PRIMARY KEY,
            applied_at timestamptz NOT NULL DEFAULT now()
        )
    `);

    const { rows } = await client.query("SELECT version FROM schema_migrations");
    const applied = new Set(rows.map(row => row.version));
    const files = (await readdir(migrationsDirectory))
        .filter(file => file.endsWith(".sql"))
        .sort();

    for (const file of files) {
        if (applied.has(file)) continue;
        const sql = await readFile(new URL(`../src/db/migrations/${file}`, import.meta.url), "utf8");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
        console.log(`Applied migration ${file}`);
    }

    await client.query("COMMIT");
    console.log("Database schema is up to date.");
} catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    console.error("Database migration failed.", error.message);
    process.exitCode = 1;
} finally {
    client?.release();
    await closePool();
}