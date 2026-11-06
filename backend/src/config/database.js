import pg from "pg";
import { config } from "./env.js";

const { Pool } = pg;
let pool;

export function getPool() {
    if (!config.databaseUrl) {
        throw new Error("DATABASE_URL is not configured.");
    }

    if (!pool) {
        pool = new Pool({
            connectionString: config.databaseUrl,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000
        });
    }

    return pool;
}

export async function closePool() {
    if (!pool) return;
    await pool.end();
    pool = undefined;
}