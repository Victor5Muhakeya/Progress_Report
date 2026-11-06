# Eagles Progress Report API

This folder contains the Node.js and Express backend foundation. The existing frontend remains unchanged. The API does not yet implement sign-in, OTP delivery, administrator workflows, or teacher workflows.

## Database design

- `users` stores login identities and roles. A case-insensitive unique index prevents duplicate email addresses. `teacher_profiles` extends teacher users.
- `students` stores learner details and enforces a unique admission number.
- `classes` and `subjects` are reusable reference records. `academic_years` owns `terms`.
- `teacher_subject_assignments` connects a teacher, class, subject, and academic year. A unique constraint prevents duplicate assignments.
- `student_class_assignments` connects a learner, class, and academic year. Historical assignments remain after a transfer; a partial unique index permits only one active class per learner per year.
- `student_subject_marks` references the student's class assignment, the teacher's matching subject assignment, and the term in the same academic year. A unique constraint prevents duplicate marks for a learner, subject, term, and year; a check limits marks to 0-100.
- `otp_authentication_records` is prepared to store hashed, expiring, single-use OTP challenges and attempt counts. OTP logic and email delivery are not part of this phase.
- `audit_logs` records an optional user, action, entity, and JSON details for later admin-only audit workflows.

The composite foreign keys on marks ensure that the referenced student assignment, teacher assignment, class, subject, term, and academic year agree. Database credentials are only read by the backend from `DATABASE_URL`.

## Local setup

Install Node.js 20 or newer, then open a terminal in this folder:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

The application health endpoint is `http://localhost:3000/api/health`. To check the database, set `DATABASE_URL` in `.env` and request `http://localhost:3000/api/health?check=database`.

To create the initial schema after configuring the database URL, run:

```powershell
npm run db:migrate
```

Get the PostgreSQL connection string from your Supabase project's **Connect** panel. Use a server-side connection string (the Supabase session pooler is suitable for a hosted backend), keep its password only in `backend/.env`, and include the SSL option provided by Supabase. Never put this URL in frontend files or commit `.env`.

The frontend's local development origin is allowed by default. Set `FRONTEND_ORIGINS` to a comma-separated list when deploying, including the exact Vercel origin. Resend configuration is intentionally deferred until the OTP phase.