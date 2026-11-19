import pg from "pg";
import { config, validateDatabaseUrl } from "./env.js";

const { Pool } = pg;
let pool;

export function buildPoolConfig(databaseUrl) {
    validateDatabaseUrl(databaseUrl);

    return {
        connectionString: databaseUrl,
        ssl: {
            rejectUnauthorized: true
        },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        query_timeout: 10000,
        statement_timeout: 10000
    };
}

export function getPool() {
    if (!config.databaseUrl) {
        throw new Error("DATABASE_URL is not configured.");
    }

    if (!pool) {
        pool = new Pool(buildPoolConfig(config.databaseUrl));
    }

    return pool;
}

export async function closePool() {
    if (!pool) return;
    await pool.end();
    pool = undefined;
}