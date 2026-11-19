# Eagles Progress Report API

This folder contains the Node.js and Express backend. The frontend communicates only with this API; database credentials and database connections remain server-side. Authentication, administrator workflows, and teacher workflows are not implemented in Stage 1.

## Database design

- `users` stores login identities and roles; `teacher_profiles` extends teacher users.
- `students` stores learner details. `classes` and `subjects` are reusable references, while `academic_years` own `terms`.
- `teacher_subject_assignments` links teachers, classes, subjects, and academic years. `student_class_assignments` records student enrollment history and permits one active class per student per year.
- `student_subject_marks` links an enrollment, matching teacher assignment, subject, term, and academic year. Composite foreign keys enforce consistent relationships; uniqueness and a 0-100 check protect mark records.
- `otp_authentication_records` is a foundation for hashed, expiring OTP challenges; `audit_logs` records actions and related entities.
- Migration 002 adds `subject_form_offerings` for verified curriculum mappings, constrained teacher identity fields, and a hashed-token `auth_sessions` foundation.

## Local environment

Use Node.js 20 or newer. From this folder, copy `.env.example` to `.env` and set values as needed:

```powershell
Copy-Item .env.example .env
```

`NODE_ENV` defaults to `development`, `PORT` defaults to `3000`, and local frontend origins default to `http://localhost:5501` and `http://127.0.0.1:5501`. A database URL is optional outside production. Production requires `DATABASE_URL` and `FRONTEND_ORIGINS`.

Keep `.env` out of version control. The repository ignores it; do not commit, paste into frontend files, or expose database credentials in logs or support requests. The production database URL must be a server-side PostgreSQL connection URL using `postgres://` or `postgresql://`. Do not add SSL parameters to the URL: the backend requires TLS with certificate verification enabled.

Supabase PostgreSQL is the intended database target. Stage 1 has not connected to Supabase; the frontend must never connect to it directly.

## Render configuration

Set these variables in the Render service's environment settings. Store the database URL only as a server-side secret:

```text
NODE_ENV=production
DATABASE_URL=<server-side PostgreSQL connection URL>
FRONTEND_ORIGINS=https://eaglesprogressreport.vercel.app
```

Add any additional frontend origins as exact comma-separated HTTP/HTTPS origins, without paths, query strings, or fragments. The API permits requests without an `Origin` header and does not allow CORS credentials.

The PostgreSQL pool is limited to 10 connections per Render process, with bounded connection and query timeouts. Pool capacity is per process: account for the maximum number of Render instances and other clients when staying within Supabase connection limits.

## Health and tests

- `GET /api/health` checks application health without contacting PostgreSQL.
- `GET /api/health?check=database` runs `SELECT 1`; database failures return a generic `503`.
- Run database-independent tests with `node --test` from this folder. These tests use fake pools and do not connect to a database.
- PostgreSQL integration tests are currently unconditionally disabled in `test/stage1-postgres.integration.mjs`. `node --test` may discover the placeholder, but always skips it. No environment variable or opt-in flag can activate it, and the current file contains no PostgreSQL connection mechanism or database operations.
- Integration execution cannot be implemented until a separately provisioned disposable local PostgreSQL environment is available and its server and database identity can be independently verified. Future testing must use a restricted test role and an isolated schema, with cleanup limited strictly to resources created by the test. Arbitrary external database URLs, including Supabase URLs, must never be accepted by that harness.
- Future integration coverage must include migration ordering, migration-ledger behavior, transactional rollback, advisory-lock concurrency, and the approved database constraints. The migration runner's exact advisory-lock contract is to begin a transaction and then execute `SELECT pg_advisory_xact_lock($1)` with lock ID `74291863`; this lock is transaction-scoped. Any future concurrency test must use that same ID and transaction-scoped acquisition pattern.

## Migration safety

Migrations in `src/db/migrations/` are applied in filename order by the migration runner. The runner uses a transaction and an advisory lock, and records applied filenames in `schema_migrations`. Migration `001_initial_schema.sql` is immutable; `002_integrity_and_auth_foundation.sql` is additive and refuses incompatible legacy teacher profiles before changing the schema.

Stage 1 does not connect to a database or execute migrations. Do not execute migrations against production or a persistent development database without a separately reviewed, explicitly authorized migration procedure and verified backup. No subject-to-form offerings or user-role backfills are guessed by migration 002.

No PostgreSQL integration test is run as part of Stage 1. The placeholder cannot connect to PostgreSQL or alter any database.

## Future mark-write authorization requirements

Future mark-write transactions must, in one transaction:

1. Validate the authenticated actor and role.
2. Verify that the teacher owns the assignment and that it is active.
3. Confirm the exact student enrollment, class, and academic year.
4. Apply the enrollment status/date policy.
5. Lock and check the term's `is_open` value.
6. Write the mark.
7. Handle conflicts explicitly and rely on the existing composite foreign keys, uniqueness constraints, and mark-range checks as final database safeguards.

The backend must enforce all permissions; frontend validation alone is never sufficient. Authentication, session behavior, first-administrator bootstrap, and mark-write workflows are later stages and are not implemented here.
