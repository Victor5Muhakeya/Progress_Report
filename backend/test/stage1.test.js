import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { test } from "node:test";
import { buildPoolConfig } from "../src/config/database.js";
import { parseEnv } from "../src/config/env.js";
import { createApp } from "../src/app.js";

const validDatabaseUrl = "postgresql://report_user:secret-value@db.example.test:5432/reports";
const productionEnvironment = {
    NODE_ENV: "production",
    DATABASE_URL: validDatabaseUrl,
    FRONTEND_ORIGINS: "https://eaglesprogressreport.vercel.app"
};

async function withServer(app, run) {
    const server = createServer(app);
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address();
    try {
        await run(`http://127.0.0.1:${address.port}`);
    } finally {
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    }
}

test("environment parser supplies development defaults and accepts a valid development setup", () => {
    assert.deepEqual(parseEnv({}), {
        nodeEnv: "development",
        port: 3000,
        databaseUrl: undefined,
        frontendOrigins: ["http://localhost:5501", "http://127.0.0.1:5501"]
    });

    assert.deepEqual(parseEnv({
        NODE_ENV: "development",
        PORT: "3010",
        DATABASE_URL: "postgres://user:pass@localhost:5432/reports",
        FRONTEND_ORIGINS: "http://localhost:5501"
    }), {
        nodeEnv: "development",
        port: 3010,
        databaseUrl: "postgres://user:pass@localhost:5432/reports",
        frontendOrigins: ["http://localhost:5501"]
    });
});

test("environment parser accepts both PostgreSQL URL schemes in production", () => {
    for (const scheme of ["postgres://", "postgresql://"]) {
        const parsed = parseEnv({
            ...productionEnvironment,
            DATABASE_URL: validDatabaseUrl.replace("postgresql://", scheme)
        });
        assert.equal(parsed.nodeEnv, "production");
        assert.equal(parsed.port, 3000);
        assert.deepEqual(parsed.frontendOrigins, ["https://eaglesprogressreport.vercel.app"]);
    }
});

test("environment parser rejects missing production URL, invalid environment, and invalid port", () => {
    assert.throws(
        () => parseEnv({ NODE_ENV: "production", FRONTEND_ORIGINS: productionEnvironment.FRONTEND_ORIGINS }),
        /DATABASE_URL is required in production/
    );
    assert.throws(() => parseEnv({ NODE_ENV: "staging" }), /NODE_ENV/);
    for (const port of ["0", "65536", "3.5", "not-a-port"]) {
        assert.throws(() => parseEnv({ PORT: port }), /PORT/);
    }
});

test("environment parser rejects malformed database URLs without exposing credentials", () => {
    const secretUrl = "postgresql://private-user:very-secret@not-a-url";
    assert.throws(() => parseEnv({
        ...productionEnvironment,
        DATABASE_URL: secretUrl
    }), error => {
        assert.match(error.message, /DATABASE_URL/);
        assert.equal(error.message.includes("private-user"), false);
        assert.equal(error.message.includes("very-secret"), false);
        assert.equal(error.message.includes(secretUrl), false);
        return true;
    });
});

test("environment parser rejects leading and trailing database URL whitespace without exposing credentials", () => {
    for (const databaseUrl of [
        ` ${validDatabaseUrl}`,
        `${validDatabaseUrl} `,
        "   "
    ]) {
        assert.throws(() => parseEnv({
            NODE_ENV: "development",
            DATABASE_URL: databaseUrl
        }), error => {
            assert.match(error.message, /DATABASE_URL/);
            assert.equal(error.message.includes("report_user"), false);
            assert.equal(error.message.includes("secret-value"), false);
            assert.equal(error.message.includes(databaseUrl), false);
            return true;
        });
    }

    assert.equal(parseEnv({ NODE_ENV: "development", DATABASE_URL: "" }).databaseUrl, undefined);
    assert.equal(parseEnv({ NODE_ENV: "test", DATABASE_URL: "" }).databaseUrl, undefined);
    assert.throws(() => parseEnv({
        ...productionEnvironment,
        DATABASE_URL: ` ${validDatabaseUrl}`
    }), /DATABASE_URL/);
});

test("environment parser rejects non-origin frontend entries", () => {
    for (const origin of [
        "https://example.test/path",
        "https://example.test?query=1",
        "https://example.test#fragment",
        "file://example.test",
        "https://user:pass@example.test",
        "*",
        "https://example.test,"
    ]) {
        assert.throws(() => parseEnv({
            ...productionEnvironment,
            FRONTEND_ORIGINS: origin
        }), /FRONTEND_ORIGINS/);
    }
});

test("environment and pool configuration reject URL SSL parameters without exposing credentials", () => {
    const secretUrl = `${validDatabaseUrl}?sslmode=disable`;
    for (const configure of [
        () => parseEnv({ ...productionEnvironment, DATABASE_URL: secretUrl }),
        () => buildPoolConfig(secretUrl)
    ]) {
        assert.throws(configure, error => {
            assert.match(error.message, /SSL parameters/);
            assert.equal(error.message.includes("report_user"), false);
            assert.equal(error.message.includes("secret-value"), false);
            return true;
        });
    }
});

test("pool configuration requires verified TLS and bounded connection and query settings", () => {
    const poolConfig = buildPoolConfig(validDatabaseUrl);
    assert.deepEqual(poolConfig.ssl, { rejectUnauthorized: true });
    assert.equal(poolConfig.max, 10);
    assert.equal(poolConfig.connectionTimeoutMillis, 5000);
    assert.equal(poolConfig.idleTimeoutMillis, 30000);
    assert.equal(poolConfig.query_timeout, 10000);
    assert.equal(poolConfig.statement_timeout, 10000);
});

test("CORS allows exact configured origins and originless requests, but rejects other origins", async () => {
    const frontendOrigin = "https://eaglesprogressreport.vercel.app";
    const app = createApp({
        appConfig: { frontendOrigins: [frontendOrigin] },
        poolProvider: () => {
            throw new Error("Application health must not use a pool.");
        }
    });

    await withServer(app, async baseUrl => {
        const allowed = await fetch(`${baseUrl}/api/health`, {
            headers: { Origin: frontendOrigin }
        });
        assert.equal(allowed.status, 200);
        assert.equal(allowed.headers.get("access-control-allow-origin"), frontendOrigin);
        assert.equal(allowed.headers.get("access-control-allow-credentials"), null);

        const originless = await fetch(`${baseUrl}/api/health`);
        assert.equal(originless.status, 200);
        assert.equal(originless.headers.get("access-control-allow-origin"), null);

        for (const origin of ["https://unlisted.example", "*"]) {
            const blocked = await fetch(`${baseUrl}/api/health`, {
                headers: { Origin: origin }
            });
            assert.equal(blocked.status, 403);
            assert.equal(blocked.headers.get("access-control-allow-origin"), null);
        }
    });
});

test("health checks never disclose database errors and validate query parameters", async () => {
    let queries = 0;
    const appWithSuccessfulPool = createApp({
        appConfig: { frontendOrigins: [] },
        poolProvider: () => ({
            async query(sql) {
                queries += 1;
                assert.equal(sql, "SELECT 1");
                return { rows: [{ "?column?": 1 }] };
            }
        })
    });

    await withServer(appWithSuccessfulPool, async baseUrl => {
        const applicationHealth = await fetch(`${baseUrl}/api/health`);
        assert.equal(applicationHealth.status, 200);
        assert.equal(queries, 0);

        const databaseHealth = await fetch(`${baseUrl}/api/health?check=database`);
        assert.equal(databaseHealth.status, 200);
        assert.equal((await databaseHealth.json()).database, "connected");
        assert.equal(queries, 1);

        const invalidCheck = await fetch(`${baseUrl}/api/health?check=anything`);
        assert.equal(invalidCheck.status, 400);
    });

    const appWithFailingPool = createApp({
        appConfig: { frontendOrigins: [] },
        poolProvider: () => ({
            async query() {
                throw new Error("secret host and password must not escape");
            }
        })
    });
    await withServer(appWithFailingPool, async baseUrl => {
        const response = await fetch(`${baseUrl}/api/health?check=database`);
        const body = await response.text();
        assert.equal(response.status, 503);
        assert.equal(body.includes("secret host"), false);
        assert.equal(body.includes("password"), false);
        assert.deepEqual(JSON.parse(body), {
            status: "unavailable",
            service: "eagles-progress-report-api",
            check: "database",
            timestamp: JSON.parse(body).timestamp,
            database: "disconnected"
        });
    });
});

test("migration 001 is unchanged and migration 002 is additive with approved integrity structures", async () => {
    const migration001 = await readFile(
        new URL("../src/db/migrations/001_initial_schema.sql", import.meta.url)
    );
    const migration002 = await readFile(
        new URL("../src/db/migrations/002_integrity_and_auth_foundation.sql", import.meta.url),
        "utf8"
    );
    const migrationHash = createHash("sha256").update(migration001).digest("hex").toUpperCase();

    assert.equal(migrationHash, "C5D9191B55E015283B7EA1A69ECBAE132588963BC1CFCD4C536321F6C14A59E2");
    for (const approvedStructure of [
        "WHERE u.role <> 'teacher'",
        "ADD CONSTRAINT users_id_role_uq UNIQUE (id, role)",
        "ADD COLUMN password_hash text",
        "CREATE UNIQUE INDEX users_at_most_one_admin_uq",
        "ADD COLUMN is_open boolean NOT NULL DEFAULT false",
        "teacher_profiles_user_role_fk",
        "lower(btrim(staff_id))",
        "lower(btrim(code))",
        "CREATE TABLE subject_form_offerings",
        "CHECK (form_number BETWEEN 1 AND 4)",
        "CREATE TABLE auth_sessions",
        "token_hash text NOT NULL UNIQUE",
        "CHECK (expires_at > created_at)"
    ]) {
        assert.ok(migration002.includes(approvedStructure), `Missing: ${approvedStructure}`);
    }
    assert.doesNotMatch(migration002, /^\s*(?:DROP|TRUNCATE|DELETE)\s+/im);
    assert.match(migration001.toString(), /mark numeric\(5, 2\) NOT NULL CHECK \(mark >= 0 AND mark <= 100\)/);
    assert.match(migration001.toString(), /FOREIGN KEY \(student_class_assignment_id, student_id, class_id, academic_year_id\)/);
    assert.match(migration001.toString(), /FOREIGN KEY \(teacher_subject_assignment_id, class_id, subject_id, academic_year_id\)/);
    assert.match(migration001.toString(), /FOREIGN KEY \(term_id, academic_year_id\)/);
});

test("PostgreSQL integration placeholder is unconditionally skipped and has no connection path", async () => {
    const integrationTest = await readFile(
        new URL("./stage1-postgres.integration.mjs", import.meta.url),
        "utf8"
    );

    assert.match(integrationTest, /test\([\s\S]*?\{\s*skip:\s*true\s*\}/);
    assert.doesNotMatch(integrationTest, /\bprocess\.env\b/);
    assert.doesNotMatch(integrationTest, /\b(?:DATABASE_URL|STAGE1_TEST_DATABASE_URL)\b/);
    assert.doesNotMatch(integrationTest, /from\s+["']pg["']/);
    assert.doesNotMatch(integrationTest, /\b(?:Pool|Client)\b/);
    assert.doesNotMatch(integrationTest, /\.connect\s*\(|new\s+Pool\s*\(/);
    assert.doesNotMatch(integrationTest, /\b(?:client|pool)\.query\s*\(/);
});

test("integration safety and advisory-lock documentation matches the migration runner", async () => {
    const [integrationTest, readme, migrationRunner] = await Promise.all([
        readFile(new URL("./stage1-postgres.integration.mjs", import.meta.url), "utf8"),
        readFile(new URL("../README.md", import.meta.url), "utf8"),
        readFile(new URL("../scripts/migrate.js", import.meta.url), "utf8")
    ]);

    assert.match(readme, /unconditionally disabled/i);
    assert.match(readme, /always skips it/i);
    assert.match(readme, /No environment variable or opt-in flag can activate it/i);
    assert.match(readme, /contains no PostgreSQL connection mechanism/i);
    assert.match(readme, /separately provisioned disposable local PostgreSQL environment/i);
    assert.match(readme, /server and database identity can be independently verified/i);
    assert.match(readme, /restricted test role/i);
    assert.match(readme, /isolated schema/i);
    assert.match(readme, /cleanup limited strictly to resources created by the test/i);
    assert.match(readme, /Arbitrary external database URLs, including Supabase URLs, must never be accepted/i);
    assert.match(integrationTest, /restricted test role/i);
    assert.match(integrationTest, /isolated schema/i);
    assert.match(integrationTest, /cleanup limited strictly to[\s\S]*resources created by the test/i);
    assert.match(integrationTest, /migration ordering,[\s\S]*migration[\s\S]*ledger behavior,[\s\S]*transactional rollback,[\s\S]*advisory-lock concurrency,[\s\S]*approved database constraints/i);
    assert.match(integrationTest, /lock ID 74291863/i);
    assert.match(integrationTest, /SELECT pg_advisory_xact_lock\(\$1\)/);
    assert.match(migrationRunner, /const lockId = 74291863;/);

    const beginIndex = migrationRunner.indexOf('client.query("BEGIN")');
    const lockIndex = migrationRunner.indexOf('client.query("SELECT pg_advisory_xact_lock($1)", [lockId])');
    assert.ok(beginIndex >= 0);
    assert.ok(lockIndex > beginIndex, "Migration advisory lock must be acquired after BEGIN.");
    assert.match(migrationRunner, /pg_advisory_xact_lock/);
});
