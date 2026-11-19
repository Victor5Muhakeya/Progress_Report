import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";

const migration001Url = new URL("../src/db/migrations/001_initial_schema.sql", import.meta.url);
const migration002Url = new URL("../src/db/migrations/002_integrity_and_auth_foundation.sql", import.meta.url);
const migration003Url = new URL("../src/db/migrations/003_auth_security.sql", import.meta.url);

async function sha256(url) {
    const contents = await readFile(url);
    return createHash("sha256").update(contents).digest("hex").toUpperCase();
}

test("migrations 001 and 002 remain unchanged", async () => {
    assert.equal(
        await sha256(migration001Url),
        "C5D9191B55E015283B7EA1A69ECBAE132588963BC1CFCD4C536321F6C14A59E2"
    );
    assert.equal(
        await sha256(migration002Url),
        "ADD9B05DDE73082C1075937AC4B7575CF016BEFADA8C227194902BCE53FE8871"
    );
});

test("migration 003 stores only constrained CSRF token hashes", async () => {
    const migration003 = await readFile(migration003Url, "utf8");

    assert.match(migration003, /ALTER TABLE auth_sessions\s+ADD COLUMN csrf_token_hash text/);
    assert.match(
        migration003,
        /csrf_token_hash\s*~\s*'\^\[0-9a-f\]\{64\}\$'/
    );
    assert.match(migration003, /CREATE UNIQUE INDEX auth_sessions_csrf_token_hash_uq/);
    assert.match(migration003, /WHERE csrf_token_hash IS NOT NULL/);
    assert.match(migration003, /No session data is backfilled/);
});

test("migration 003 creates constrained, expiring HMAC rate-limit buckets", async () => {
    const migration003 = await readFile(migration003Url, "utf8");

    assert.match(migration003, /CREATE TABLE auth_login_rate_limits/);
    assert.match(migration003, /bucket_hash text PRIMARY KEY/);
    assert.match(
        migration003,
        /bucket_hash\s+text PRIMARY KEY\s+CHECK\s*\(\s*bucket_hash\s*~\s*'\^\[0-9a-f\]\{64\}\$'\s*\)/
    );
    assert.match(
        migration003,
        /attempt_count\s+integer NOT NULL\s+CHECK\s*\(\s*attempt_count\s*>\s*0\s*\)/
    );
    assert.match(
        migration003,
        /expires_at\s+timestamptz NOT NULL,\s+CHECK\s*\(\s*expires_at\s*>\s*window_started_at\s*\)/
    );
    assert.match(
        migration003,
        /CREATE INDEX auth_login_rate_limits_expires_idx\s+ON auth_login_rate_limits \(expires_at\)/
    );
    assert.doesNotMatch(migration003, /^\s*(?:email|ip_address|request_ip)\s+/im);
});

test("migration 003 safely prechecks and constrains administrator password hashes", async () => {
    const migration003 = await readFile(migration003Url, "utf8");

    assert.match(
        migration003,
        /IF EXISTS\s*\([\s\S]*?FROM users\s+WHERE role\s*=\s*'admin'\s+AND\s*\(\s*password_hash\s+IS NULL\s+OR\s+btrim\(password_hash\)\s*=\s*''\s*\)[\s\S]*?\)\s*THEN\s*RAISE EXCEPTION/
    );
    assert.match(migration003, /RAISE EXCEPTION/);
    assert.match(migration003, /ADD CONSTRAINT users_admin_password_hash_ck/);
    assert.match(
        migration003,
        /ADD CONSTRAINT users_admin_password_hash_ck\s+CHECK\s*\(\s*role\s*<>\s*'admin'\s+OR\s*\(\s*password_hash\s+IS NOT NULL\s+AND\s+btrim\(password_hash\)\s*<>\s*''\s*\)\s*\)/
    );
});

test("migration 003 follows migrations 001 and 002 in the runner's sorted order", async () => {
    const migrationDirectory = new URL("../src/db/migrations/", import.meta.url);
    const files = (await readdir(migrationDirectory))
        .filter(file => file.endsWith(".sql"))
        .sort();
    const runner = await readFile(new URL("../scripts/migrate.js", import.meta.url), "utf8");

    const migration001Index = files.indexOf("001_initial_schema.sql");
    const migration002Index = files.indexOf("002_integrity_and_auth_foundation.sql");
    const migration003Index = files.indexOf("003_auth_security.sql");

    assert.ok(migration001Index >= 0);
    assert.ok(migration002Index > migration001Index);
    assert.ok(migration003Index > migration002Index);
    assert.match(
        runner,
        /const files = \(await readdir\(migrationsDirectory\)\)\s*\.filter\(file => file\.endsWith\("\.sql"\)\)\s*\.sort\(\);/
    );
});

test("migration 003 is additive and is not run automatically at application startup", async () => {
    const [migration003, app, server, packageJson] = await Promise.all([
        readFile(migration003Url, "utf8"),
        readFile(new URL("../src/app.js", import.meta.url), "utf8"),
        readFile(new URL("../src/server.js", import.meta.url), "utf8"),
        readFile(new URL("../package.json", import.meta.url), "utf8")
    ]);

    assert.doesNotMatch(migration003, /^\s*(?:DROP|TRUNCATE|DELETE|UPDATE|INSERT)\b/im);
    assert.match(server, /import app from "\.\/app\.js"/);
    assert.match(server, /app\.listen\(config\.port/);
    assert.doesNotMatch(
        `${app}\n${server}`,
        /(?:scripts[\\/]+migrate(?:\.js)?|runMigrations|migrationsDirectory|db:migrate)/
    );
    assert.match(packageJson, /"start"\s*:\s*"node src\/server\.js"/);
    assert.match(packageJson, /"db:migrate"\s*:\s*"node scripts\/migrate\.js"/);
});
