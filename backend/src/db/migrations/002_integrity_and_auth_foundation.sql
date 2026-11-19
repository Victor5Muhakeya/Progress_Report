-- Refuse incompatible legacy profiles without naming or exposing user data.
-- Transactional migration execution rolls back if this precondition fails.
DO $$
DECLARE
    incompatible_count bigint;
BEGIN
    SELECT count(*)
    INTO incompatible_count
    FROM teacher_profiles AS tp
    JOIN users AS u ON u.id = tp.user_id
    WHERE u.role <> 'teacher';

    IF incompatible_count > 0 THEN
        RAISE EXCEPTION
            'Migration 002 cannot enforce teacher identity: % existing teacher profile(s) reference a non-teacher user. Review and correct those records explicitly, then retry.',
            incompatible_count;
    END IF;
END
$$;

-- Needed as the referenced key for the teacher role-guard composite FK.
ALTER TABLE users
    ADD CONSTRAINT users_id_role_uq UNIQUE (id, role);

-- Optional until the later authentication stage provisions a password.
ALTER TABLE users
    ADD COLUMN password_hash text;

-- Enforces at most one admin. First-admin bootstrap is out of scope.
CREATE UNIQUE INDEX users_at_most_one_admin_uq
    ON users (role)
    WHERE role = 'admin';

-- Approved fail-closed policy: old and new terms start closed.
ALTER TABLE terms
    ADD COLUMN is_open boolean NOT NULL DEFAULT false;

-- Existing profiles receive the constrained teacher guard only after the
-- precheck. No user role is changed or guessed.
ALTER TABLE teacher_profiles
    ADD COLUMN role_guard text NOT NULL DEFAULT 'teacher',
    ADD CONSTRAINT teacher_profiles_role_guard_teacher_ck
        CHECK (role_guard = 'teacher'),
    ADD CONSTRAINT teacher_profiles_user_role_fk
        FOREIGN KEY (user_id, role_guard)
        REFERENCES users (id, role)
        ON DELETE RESTRICT;

-- Optional, globally unique case-insensitively after trimming. NULL is allowed.
ALTER TABLE teacher_profiles
    ADD COLUMN staff_id text,
    ADD COLUMN phone text,
    ADD CONSTRAINT teacher_profiles_staff_id_nonblank_ck
        CHECK (staff_id IS NULL OR btrim(staff_id) <> ''),
    ADD CONSTRAINT teacher_profiles_phone_nonblank_ck
        CHECK (phone IS NULL OR btrim(phone) <> '');

CREATE UNIQUE INDEX teacher_profiles_staff_id_uq
    ON teacher_profiles (lower(btrim(staff_id)))
    WHERE staff_id IS NOT NULL;

-- Optional case-insensitive code; no assumed code backfill.
ALTER TABLE subjects
    ADD COLUMN code text,
    ADD CONSTRAINT subjects_code_nonblank_ck
        CHECK (code IS NULL OR btrim(code) <> '');

CREATE UNIQUE INDEX subjects_code_uq
    ON subjects (lower(btrim(code)))
    WHERE code IS NOT NULL;

-- Normalized subject-to-form offering. Populate only from verified curriculum
-- mappings in a separately controlled setup step.
CREATE TABLE subject_form_offerings (
    subject_id uuid NOT NULL
        REFERENCES subjects(id) ON DELETE RESTRICT,
    form_number smallint NOT NULL
        CHECK (form_number BETWEEN 1 AND 4),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (subject_id, form_number)
);

CREATE INDEX subject_form_offerings_form_subject_idx
    ON subject_form_offerings (form_number, subject_id);

-- Store only a one-way token digest. Session behavior is a later stage.
CREATE TABLE auth_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    CHECK (expires_at > created_at)
);

CREATE INDEX auth_sessions_user_active_expiry_idx
    ON auth_sessions (user_id, expires_at)
    WHERE revoked_at IS NULL;
