CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'teacher')),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_uq ON users (lower(email));

CREATE TABLE teacher_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    full_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_number text NOT NULL UNIQUE,
    full_name text NOT NULL,
    gender text,
    date_of_birth date,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred', 'graduated')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE classes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    form_number smallint NOT NULL CHECK (form_number BETWEEN 1 AND 4),
    stream text NOT NULL DEFAULT '',
    is_active boolean NOT NULL DEFAULT true,
    UNIQUE (form_number, stream)
);

CREATE TABLE subjects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE academic_years (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    label text NOT NULL UNIQUE,
    starts_on date,
    ends_on date,
    is_active boolean NOT NULL DEFAULT true,
    CHECK (starts_on IS NULL OR ends_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE terms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    name text NOT NULL,
    starts_on date,
    ends_on date,
    UNIQUE (academic_year_id, name),
    UNIQUE (id, academic_year_id),
    CHECK (starts_on IS NULL OR ends_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE teacher_subject_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE RESTRICT,
    class_id uuid NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (teacher_id, class_id, subject_id, academic_year_id),
    UNIQUE (id, class_id, subject_id, academic_year_id)
);

CREATE INDEX teacher_subject_assignments_class_year_idx
    ON teacher_subject_assignments (class_id, academic_year_id);

CREATE TABLE student_class_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    class_id uuid NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'completed')),
    started_on date NOT NULL DEFAULT CURRENT_DATE,
    ended_on date,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (id, student_id, class_id, academic_year_id),
    UNIQUE (student_id, class_id, academic_year_id),
    CHECK ((status = 'active' AND ended_on IS NULL) OR (status <> 'active' AND ended_on IS NOT NULL))
);

CREATE UNIQUE INDEX student_one_active_class_per_year_uq
    ON student_class_assignments (student_id, academic_year_id)
    WHERE status = 'active';

CREATE INDEX student_class_assignments_class_year_idx
    ON student_class_assignments (class_id, academic_year_id, status);

CREATE TABLE student_subject_marks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_class_assignment_id uuid NOT NULL,
    student_id uuid NOT NULL,
    class_id uuid NOT NULL,
    teacher_subject_assignment_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    term_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    mark numeric(5, 2) NOT NULL CHECK (mark >= 0 AND mark <= 100),
    teacher_remark text,
    status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'returned')),
    updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (student_class_assignment_id, student_id, class_id, academic_year_id)
        REFERENCES student_class_assignments (id, student_id, class_id, academic_year_id) ON DELETE RESTRICT,
    FOREIGN KEY (teacher_subject_assignment_id, class_id, subject_id, academic_year_id)
        REFERENCES teacher_subject_assignments (id, class_id, subject_id, academic_year_id) ON DELETE RESTRICT,
    FOREIGN KEY (term_id, academic_year_id)
        REFERENCES terms (id, academic_year_id) ON DELETE RESTRICT,
    UNIQUE (student_id, subject_id, term_id, academic_year_id)
);

CREATE INDEX student_subject_marks_class_term_idx
    ON student_subject_marks (class_id, term_id, academic_year_id);

CREATE INDEX student_subject_marks_assignment_idx
    ON student_subject_marks (teacher_subject_assignment_id, term_id);

CREATE TABLE otp_authentication_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash text NOT NULL,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
    requested_at timestamptz NOT NULL DEFAULT now(),
    request_ip_hash text
);

CREATE INDEX otp_authentication_records_pending_idx
    ON otp_authentication_records (user_id, expires_at)
    WHERE consumed_at IS NULL;

CREATE TABLE audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    details jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_actor_created_idx ON audit_logs (actor_user_id, created_at DESC);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);