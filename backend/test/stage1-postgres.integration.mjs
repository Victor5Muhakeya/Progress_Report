import { test } from "node:test";

// Integration execution is disabled until a separately provisioned disposable
// local PostgreSQL instance can be independently verified. Future tests require
// a restricted test role, an isolated schema, and cleanup limited strictly to
// resources created by the test. They must cover migration ordering, migration
// ledger behavior, transactional rollback, advisory-lock concurrency, and the
// approved database constraints. They must not accept arbitrary external
// database URLs, including Supabase URLs.
//
// The migration runner's lock contract is transaction-scoped: after BEGIN it
// executes SELECT pg_advisory_xact_lock($1) with lock ID 74291863. Future
// concurrency coverage must use that exact ID and acquisition pattern.
test("Stage 1 PostgreSQL integration tests (disabled pending verified disposable infrastructure)", {
    skip: true
}, () => {
    throw new Error("PostgreSQL integration tests are unconditionally disabled.");
});
