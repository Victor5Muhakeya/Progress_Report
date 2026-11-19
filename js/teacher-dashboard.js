(() => {
    "use strict";

    // Replace this demo object with the teacher dashboard API response in a later stage.
    const DEMO_TEACHER_DATA = {
        teacherProfile: {
            id: "teacher-amara-ndlovu",
            name: "Amara Ndlovu",
            staffId: "ERHS-T-024",
            email: "amara.ndlovu@example.edu",
            phone: "+263 77 555 0142"
        },
        reportingPeriod: {
            academicYear: { id: "year-2025-2026", label: "2025–2026" },
            term: { id: "term-2-2025-2026", name: "Term 2" }
        },
        classes: [
            { id: "class-form-3-east", name: "Form 3 East", form: "Form 3", academicYearId: "year-2025-2026", active: true },
            { id: "class-form-4-west", name: "Form 4 West", form: "Form 4", academicYearId: "year-2025-2026", active: true },
            { id: "class-form-2-central", name: "Form 2 Central", form: "Form 2", academicYearId: "year-2025-2026", active: true }
        ],
        learners: [
            { id: "learner-f3-001", name: "Amina Kato", classId: "class-form-3-east", academicYearId: "year-2025-2026", active: true },
            { id: "learner-f3-002", name: "Brian Ocen", classId: "class-form-3-east", academicYearId: "year-2025-2026", active: true },
            { id: "learner-f3-003", name: "Chipo Moyo", classId: "class-form-3-east", academicYearId: "year-2025-2026", active: true },
            { id: "learner-f3-004", name: "Daniel Ncube", classId: "class-form-3-east", academicYearId: "year-2025-2026", active: true },
            { id: "learner-f4-001", name: "Esi Dube", classId: "class-form-4-west", academicYearId: "year-2025-2026", active: true },
            { id: "learner-f4-002", name: "Farai Ndlovu", classId: "class-form-4-west", academicYearId: "year-2025-2026", active: true },
            { id: "learner-f4-003", name: "Grace Maseko", classId: "class-form-4-west", academicYearId: "year-2025-2026", active: true },
            { id: "learner-f2-001", name: "Hana Sibanda", classId: "class-form-2-central", academicYearId: "year-2025-2026", active: true },
            { id: "learner-f2-002", name: "Isaac Moyo", classId: "class-form-2-central", academicYearId: "year-2025-2026", active: true }
        ],
        subjects: [
            { id: "subject-biology", name: "Biology", active: true },
            { id: "subject-environmental-science", name: "Environmental Science", active: true },
            { id: "subject-mathematics", name: "Mathematics", active: true },
            { id: "subject-chemistry", name: "Chemistry", active: true },
            { id: "subject-english", name: "English Language", active: true }
        ],
        assignments: [
            { id: "assignment-biology-f3", teacherId: "teacher-amara-ndlovu", classId: "class-form-3-east", subjectId: "subject-biology", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", active: true },
            { id: "assignment-biology-f4", teacherId: "teacher-amara-ndlovu", classId: "class-form-4-west", subjectId: "subject-biology", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", active: true },
            { id: "assignment-environmental-science-f3", teacherId: "teacher-amara-ndlovu", classId: "class-form-3-east", subjectId: "subject-environmental-science", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", active: true },
            { id: "assignment-mathematics-f3", teacherId: "teacher-daniel-okello", classId: "class-form-3-east", subjectId: "subject-mathematics", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", active: true },
            { id: "assignment-chemistry-f4", teacherId: "teacher-grace-nansubuga", classId: "class-form-4-west", subjectId: "subject-chemistry", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", active: true },
            { id: "assignment-english-f2", teacherId: "teacher-daniel-okello", classId: "class-form-2-central", subjectId: "subject-english", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", active: true }
        ],
        subjectEnrollments: [
            { id: "enrollment-bio-f3-001", assignmentId: "assignment-biology-f3", learnerId: "learner-f3-001", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-bio-f3-002", assignmentId: "assignment-biology-f3", learnerId: "learner-f3-002", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-bio-f3-003", assignmentId: "assignment-biology-f3", learnerId: "learner-f3-003", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-bio-f3-004", assignmentId: "assignment-biology-f3", learnerId: "learner-f3-004", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-bio-f4-001", assignmentId: "assignment-biology-f4", learnerId: "learner-f4-001", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-bio-f4-002", assignmentId: "assignment-biology-f4", learnerId: "learner-f4-002", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-bio-f4-003", assignmentId: "assignment-biology-f4", learnerId: "learner-f4-003", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-env-f3-001", assignmentId: "assignment-environmental-science-f3", learnerId: "learner-f3-001", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-env-f3-003", assignmentId: "assignment-environmental-science-f3", learnerId: "learner-f3-003", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-env-f3-004", assignmentId: "assignment-environmental-science-f3", learnerId: "learner-f3-004", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-math-f3-001", assignmentId: "assignment-mathematics-f3", learnerId: "learner-f3-001", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-math-f3-002", assignmentId: "assignment-mathematics-f3", learnerId: "learner-f3-002", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-math-f3-003", assignmentId: "assignment-mathematics-f3", learnerId: "learner-f3-003", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-math-f3-004", assignmentId: "assignment-mathematics-f3", learnerId: "learner-f3-004", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-chem-f4-001", assignmentId: "assignment-chemistry-f4", learnerId: "learner-f4-001", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-chem-f4-002", assignmentId: "assignment-chemistry-f4", learnerId: "learner-f4-002", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-english-f2-001", assignmentId: "assignment-english-f2", learnerId: "learner-f2-001", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" },
            { id: "enrollment-english-f2-002", assignmentId: "assignment-english-f2", learnerId: "learner-f2-002", academicYearId: "year-2025-2026", termId: "term-2-2025-2026" }
        ],
        marks: [
            { id: "mark-bio-f3-001", assignmentId: "assignment-biology-f3", learnerId: "learner-f3-001", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", mark: 78 },
            { id: "mark-bio-f3-002", assignmentId: "assignment-biology-f3", learnerId: "learner-f3-002", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", mark: 61 },
            { id: "mark-bio-f3-003", assignmentId: "assignment-biology-f3", learnerId: "learner-f3-003", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", mark: 85 },
            { id: "mark-bio-f4-001", assignmentId: "assignment-biology-f4", learnerId: "learner-f4-001", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", mark: 72 },
            { id: "mark-env-f3-001", assignmentId: "assignment-environmental-science-f3", learnerId: "learner-f3-001", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", mark: 80 },
            { id: "mark-env-f3-004", assignmentId: "assignment-environmental-science-f3", learnerId: "learner-f3-004", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", mark: 66 },
            { id: "mark-math-f3-001", assignmentId: "assignment-mathematics-f3", learnerId: "learner-f3-001", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", mark: 90 },
            { id: "mark-math-f3-003", assignmentId: "assignment-mathematics-f3", learnerId: "learner-f3-003", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", mark: 75 },
            { id: "mark-chem-f4-001", assignmentId: "assignment-chemistry-f4", learnerId: "learner-f4-001", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", mark: 88 },
            { id: "mark-english-f2-001", assignmentId: "assignment-english-f2", learnerId: "learner-f2-001", academicYearId: "year-2025-2026", termId: "term-2-2025-2026", mark: 50 }
        ]
    };

    const views = {
        overview: "Overview",
        profile: "My Profile",
        classes: "My Classes",
        subjects: "My Subjects",
        results: "Enter Results",
        progress: "Submission Progress",
        logout: "Logout"
    };
    const sidebar = document.getElementById("sidebar");
    const navigation = document.getElementById("navigation");
    const menuButton = document.getElementById("menuButton");
    const sidebarScrim = document.getElementById("sidebarScrim");
    const content = document.getElementById("content");
    const viewCrumb = document.getElementById("viewCrumb");
    const viewAnnouncement = document.getElementById("viewAnnouncement");

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function heading(title, description) {
        return `<div class="page-heading"><div><p class="eyebrow">Teacher workspace</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div></div>`;
    }

    function getAssignmentContext(data) {
        const { academicYear, term } = data.reportingPeriod;
        const teacherId = data.teacherProfile.id;
        const classesById = new Map(data.classes.map(item => [item.id, item]));
        const subjectsById = new Map(data.subjects.map(item => [item.id, item]));
        const periodAssignments = data.assignments.filter(assignment => {
            const classRecord = classesById.get(assignment.classId);
            const subject = subjectsById.get(assignment.subjectId);
            return assignment.active !== false
                && assignment.academicYearId === academicYear.id
                && assignment.termId === term.id
                && classRecord
                && classRecord.active !== false
                && classRecord.academicYearId === academicYear.id
                && subject
                && subject.active !== false;
        });
        const ownAssignments = periodAssignments.filter(assignment => assignment.teacherId === teacherId);
        const ownClassIds = new Set(ownAssignments.map(assignment => assignment.classId));
        const otherAssignments = periodAssignments.filter(assignment =>
            assignment.teacherId !== teacherId && ownClassIds.has(assignment.classId)
        );
        return { ownAssignments, otherAssignments };
    }

    function getAssignedClasses(data, assignments) {
        const classIds = new Set(assignments.map(assignment => assignment.classId));
        const learnerCounts = new Map();
        data.learners.forEach(learner => {
            if (learner.active === false || learner.academicYearId !== data.reportingPeriod.academicYear.id) return;
            learnerCounts.set(learner.classId, (learnerCounts.get(learner.classId) || 0) + 1);
        });
        return data.classes
            .filter(classRecord => classIds.has(classRecord.id))
            .map(classRecord => ({ ...classRecord, learners: learnerCounts.get(classRecord.id) || 0 }));
    }

    function getAssignedSubjects(data, assignments) {
        const subjectsById = new Map(data.subjects.map(item => [item.id, item]));
        const classesById = new Map(data.classes.map(item => [item.id, item]));
        const assignedSubjects = new Map();
        assignments.forEach(assignment => {
            const subject = subjectsById.get(assignment.subjectId);
            const classRecord = classesById.get(assignment.classId);
            if (!subject || !classRecord) return;
            if (!assignedSubjects.has(subject.id)) {
                assignedSubjects.set(subject.id, { id: subject.id, name: subject.name, classes: new Set() });
            }
            assignedSubjects.get(subject.id).classes.add(classRecord.name);
        });
        return [...assignedSubjects.values()].map(subject => ({ ...subject, classes: [...subject.classes] }));
    }

    function combinationKey(parts) {
        return JSON.stringify(parts);
    }

    function isValidMark(mark) {
        return typeof mark === "number" && Number.isFinite(mark) && mark >= 0 && mark <= 100;
    }

    function calculateResults(data, assignments, teacherId) {
        const { academicYear, term } = data.reportingPeriod;
        const classesById = new Map(data.classes.map(item => [item.id, item]));
        const subjectsById = new Map(data.subjects.map(item => [item.id, item]));
        const learnersById = new Map(data.learners.map(item => [item.id, item]));
        const assignmentsById = new Map();
        const rowsByKey = new Map();

        assignments.forEach(assignment => {
            const classRecord = classesById.get(assignment.classId);
            const subject = subjectsById.get(assignment.subjectId);
            if (assignment.active === false
                || assignment.academicYearId !== academicYear.id
                || assignment.termId !== term.id
                || !classRecord
                || classRecord.active === false
                || classRecord.academicYearId !== academicYear.id
                || !subject
                || subject.active === false) return;

            const rowKey = combinationKey([
                assignment.teacherId,
                assignment.classId,
                assignment.subjectId,
                academicYear.id,
                term.id
            ]);
            if (!rowsByKey.has(rowKey)) {
                rowsByKey.set(rowKey, {
                    key: rowKey,
                    teacherId: assignment.teacherId,
                    classId: assignment.classId,
                    className: classRecord.name,
                    subjectId: assignment.subjectId,
                    subjectName: subject.name,
                    own: assignment.teacherId === teacherId,
                    eligible: new Set(),
                    entered: new Set()
                });
            }
            const row = rowsByKey.get(rowKey);
            assignmentsById.set(assignment.id, { assignment, row });
        });

        const eligible = new Map();
        data.subjectEnrollments.forEach(enrollment => {
            const assignmentRecord = assignmentsById.get(enrollment.assignmentId);
            if (!assignmentRecord
                || enrollment.active === false
                || enrollment.academicYearId !== academicYear.id
                || enrollment.termId !== term.id) return;
            const { assignment, row } = assignmentRecord;
            const learner = learnersById.get(enrollment.learnerId);
            if (!learner
                || learner.active === false
                || learner.classId !== assignment.classId
                || learner.academicYearId !== academicYear.id) return;

            const key = combinationKey([
                learner.id,
                assignment.subjectId,
                assignment.classId,
                academicYear.id,
                term.id
            ]);
            if (!eligible.has(key)) {
                eligible.set(key, { learnerId: learner.id, rowKeys: new Set() });
            }
            eligible.get(key).rowKeys.add(row.key);
            row.eligible.add(key);
        });

        const entered = new Set();
        data.marks.forEach(result => {
            if (!isValidMark(result.mark)
                || result.academicYearId !== academicYear.id
                || result.termId !== term.id) return;
            const assignmentRecord = assignmentsById.get(result.assignmentId);
            if (!assignmentRecord) return;
            const { assignment, row } = assignmentRecord;
            const key = combinationKey([
                result.learnerId,
                assignment.subjectId,
                assignment.classId,
                academicYear.id,
                term.id
            ]);
            const enrollment = eligible.get(key);
            if (!enrollment || !enrollment.rowKeys.has(row.key)) return;
            entered.add(key);
            row.entered.add(key);
        });

        const expected = eligible.size;
        const enteredCount = entered.size;
        const rows = [...rowsByKey.values()].map(row => ({
            ...row,
            expected: row.eligible.size,
            entered: row.entered.size,
            pending: row.eligible.size - row.entered.size,
            completionPercentage: row.eligible.size ? (row.entered.size / row.eligible.size) * 100 : 0
        }));
        return {
            expected,
            entered: enteredCount,
            pending: expected - enteredCount,
            completionPercentage: expected ? (enteredCount / expected) * 100 : 0,
            learnerIds: [...new Set([...eligible.values()].map(item => item.learnerId))],
            rows
        };
    }

    function renderWelcome() {
        const { teacherProfile } = DEMO_TEACHER_DATA;
        const { ownAssignments } = getAssignmentContext(DEMO_TEACHER_DATA);
        const classes = getAssignedClasses(DEMO_TEACHER_DATA, ownAssignments);
        const subjects = getAssignedSubjects(DEMO_TEACHER_DATA, ownAssignments);
        const results = calculateResults(DEMO_TEACHER_DATA, ownAssignments, teacherProfile.id);
        const stats = [
            ["Assigned classes", classes.length, "Across your teaching timetable"],
            ["Assigned subjects", subjects.length, "Subjects assigned to you"],
            ["Learners", results.learnerIds.length, "Enrolled in your assigned subjects"],
            ["Results entered", results.entered, "For your assigned subjects"],
            ["Results pending", results.pending, "Still to be entered"]
        ];
        return `
            <section class="welcome-panel" aria-labelledby="welcomeTitle">
                <div><p class="eyebrow">Your teaching workspace</p><h1 id="welcomeTitle">Welcome, ${escapeHtml(teacherProfile.name)}</h1><p>Here is a snapshot of your classes and reporting progress.</p></div>
                <div class="welcome-staff">Staff ID <strong>${escapeHtml(teacherProfile.staffId)}</strong></div>
            </section>
            <section class="stats-grid" aria-label="Teaching overview">
                ${stats.map(([label, number, hint]) => `<article class="stat-card"><span class="stat-label">${escapeHtml(label)}</span><strong class="stat-number">${escapeHtml(number)}</strong><span class="stat-hint">${escapeHtml(hint)}</span></article>`).join("")}
            </section>
            <div class="dashboard-grid">
                <section class="panel" aria-labelledby="classSnapshotTitle">
                    <div class="panel-heading"><div><h2 id="classSnapshotTitle">Your classes</h2><p>Assigned forms and learner counts</p></div></div>
                    ${classList(classes)}
                </section>
                <section class="panel" aria-labelledby="progressSnapshotTitle">
                    <div class="panel-heading"><div><h2 id="progressSnapshotTitle">Your results progress</h2><p>Results recorded for your subject assignments</p></div></div>
                    ${progressSummary(results)}
                </section>
            </div>`;
    }

    function classList(classes) {
        return `<div class="class-list">${classes.map(item => `
            <div class="class-item">
                <div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.form)}</small></div>
                <span class="class-count">${escapeHtml(item.learners)} learners</span>
            </div>`).join("")}</div>`;
    }

    function progressSummary(results) {
        const percent = Math.round(results.completionPercentage);
        return `<div class="progress-track" role="progressbar" aria-label="Your results entered" aria-valuemin="0" aria-valuemax="${results.expected}" aria-valuenow="${results.entered}"><span style="width: ${percent}%"></span></div>
            <p class="progress-value">${results.entered} of ${results.expected} results entered (${percent}%)</p>
            <div class="detail-list">
                <div class="detail-item"><span>Entered</span><strong>${results.entered} results</strong></div>
                <div class="detail-item"><span>Pending</span><strong>${results.pending} results</strong></div>
            </div>`;
    }

    function renderProfile() {
        const { teacherProfile } = DEMO_TEACHER_DATA;
        return `${heading("My Profile", "Your teacher contact details. This sample profile is read-only.")}
            <section class="panel" aria-label="Teacher profile">
                <div class="detail-list">
                    <div class="detail-item"><span>Teacher name</span><strong>${escapeHtml(teacherProfile.name)}</strong></div>
                    <div class="detail-item"><span>Staff ID</span><strong>${escapeHtml(teacherProfile.staffId)}</strong></div>
                    <div class="detail-item"><span>Email</span><strong>${escapeHtml(teacherProfile.email)}</strong></div>
                    <div class="detail-item"><span>Phone number</span><strong>${escapeHtml(teacherProfile.phone)}</strong></div>
                </div>
            </section>`;
    }

    function renderClasses() {
        const { ownAssignments } = getAssignmentContext(DEMO_TEACHER_DATA);
        const classes = getAssignedClasses(DEMO_TEACHER_DATA, ownAssignments);
        return `${heading("My Classes", "The forms assigned to you and the learner count for each class.")}
            <section class="panel" aria-label="Assigned classes">${classList(classes)}</section>`;
    }

    function renderSubjects() {
        const { ownAssignments } = getAssignmentContext(DEMO_TEACHER_DATA);
        const subjects = getAssignedSubjects(DEMO_TEACHER_DATA, ownAssignments);
        const rows = subjects.map(subject => `
            <tr>
                <td class="primary-cell">${escapeHtml(subject.name)}</td>
                <td>${subject.classes.map(escapeHtml).join(", ")}</td>
                <td>${escapeHtml(DEMO_TEACHER_DATA.reportingPeriod.academicYear.label)}</td>
            </tr>`).join("");
        return `${heading("My Subjects", "Subjects assigned to you, the corresponding classes, and academic year.")}
            <div class="table-card"><div class="table-scroll">
                <table><caption class="sr-only">Your assigned subjects and classes</caption>
                    <thead><tr><th scope="col">Subject</th><th scope="col">Assigned classes</th><th scope="col">Academic year</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div></div>`;
    }

    function renderResults() {
        return `${heading("Enter Results", "Mark entry will be available in a later stage of the teacher workspace.")}
            <section class="panel placeholder-panel" aria-labelledby="resultsPlaceholderTitle">
                <span class="placeholder-icon" aria-hidden="true">✎</span>
                <h2 id="resultsPlaceholderTitle">Mark entry is coming later</h2>
                <p>This area is a placeholder for a future mark-entry workflow. You cannot enter, edit, or save learner marks from this demo dashboard.</p>
            </section>`;
    }

    function renderProgress() {
        const { ownAssignments, otherAssignments } = getAssignmentContext(DEMO_TEACHER_DATA);
        const teacherId = DEMO_TEACHER_DATA.teacherProfile.id;
        const ownResults = calculateResults(DEMO_TEACHER_DATA, ownAssignments, teacherId);
        const otherResults = calculateResults(DEMO_TEACHER_DATA, otherAssignments, teacherId);
        const rows = [...ownResults.rows, ...otherResults.rows].map(item => {
            const percent = Math.round(item.completionPercentage);
            const state = item.expected === 0
                ? "No enrolled learners"
                : item.entered === item.expected ? "Complete" : "In progress";
            const assignment = item.own ? "Your assignment" : "Other subject";
            const scopeClass = item.own ? "own" : "other";
            const statusClass = item.expected === 0
                ? ""
                : item.entered === item.expected ? "complete" : "in-progress";
            return `<tr>
                <td class="primary-cell">${escapeHtml(item.subjectName)}</td>
                <td>${escapeHtml(item.className)}</td>
                <td><span class="assignment-pill ${scopeClass}">${assignment}</span></td>
                <td class="progress-cell">
                    <div class="progress-track" role="progressbar" aria-label="${escapeHtml(item.subjectName)} in ${escapeHtml(item.className)}" aria-valuemin="0" aria-valuemax="${item.expected}" aria-valuenow="${item.entered}"><span style="width: ${percent}%"></span></div>
                    <div class="progress-value">${item.entered} of ${item.expected} enrolled results (${percent}%)</div>
                </td>
                <td><span class="status-pill ${statusClass}">${state}</span></td>
            </tr>`;
        }).join("");
        return `${heading("Submission Progress", "Read-only completion status for subjects across your assigned classes.")}
            <p class="callout">Progress for your assigned subjects is highlighted separately. Other subjects are shown for visibility only; this view does not provide access to other teachers' marks.</p>
            <div class="section-heading"><h2>Subject submissions</h2><span class="section-note">${escapeHtml(DEMO_TEACHER_DATA.reportingPeriod.academicYear.label)} · ${escapeHtml(DEMO_TEACHER_DATA.reportingPeriod.term.name)}</span></div>
            <div class="legend" aria-label="Submission table legend">
                <span class="legend-item"><span class="legend-dot" aria-hidden="true"></span>Your assigned subject</span>
                <span class="legend-item"><span class="legend-dot other" aria-hidden="true"></span>Other subject · read-only status</span>
            </div>
            <div class="table-card"><div class="table-scroll">
                <table><caption class="sr-only">Subject submission progress for assigned classes</caption>
                    <thead><tr><th scope="col">Subject</th><th scope="col">Class</th><th scope="col">Assignment</th><th scope="col">Results submitted</th><th scope="col">Status</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div></div>`;
    }

    function renderLogout() {
        return `${heading("Logout", "Shared demo login and logout will be connected in a later stage.")}
            <section class="panel placeholder-panel" aria-labelledby="logoutPlaceholderTitle">
                <span class="placeholder-icon" aria-hidden="true">↪</span>
                <h2 id="logoutPlaceholderTitle">Logout is not connected yet</h2>
                <p>This demonstration does not use authentication or manage login sessions. Shared demo login/logout will be added when the common sign-in flow is implemented.</p>
            </section>`;
    }

    const renderers = {
        overview: renderWelcome,
        profile: renderProfile,
        classes: renderClasses,
        subjects: renderSubjects,
        results: renderResults,
        progress: renderProgress,
        logout: renderLogout
    };

    function setMenuOpen(open) {
        sidebar.classList.toggle("open", open);
        menuButton.setAttribute("aria-expanded", String(open));
        menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
        sidebarScrim.hidden = !open;
    }

    function showView(view) {
        if (!Object.prototype.hasOwnProperty.call(renderers, view)) return;
        content.innerHTML = renderers[view]();
        viewCrumb.textContent = views[view];
        viewAnnouncement.textContent = `${views[view]} section`;
        sidebar.querySelectorAll("[data-view]").forEach(button => {
            const active = button.dataset.view === view;
            button.classList.toggle("active", active);
            if (active) button.setAttribute("aria-current", "page");
            else button.removeAttribute("aria-current");
        });
        setMenuOpen(false);
    }

    document.getElementById("academicYear").textContent = DEMO_TEACHER_DATA.reportingPeriod.academicYear.label;
    document.getElementById("currentTerm").textContent = DEMO_TEACHER_DATA.reportingPeriod.term.name;
    document.getElementById("teacherName").textContent = DEMO_TEACHER_DATA.teacherProfile.name;
    document.getElementById("teacherStaffId").textContent = DEMO_TEACHER_DATA.teacherProfile.staffId;
    document.getElementById("teacherInitials").textContent = DEMO_TEACHER_DATA.teacherProfile.name
        .split(/\s+/)
        .map(part => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    navigation.addEventListener("click", event => {
        const button = event.target.closest("[data-view]");
        if (button && navigation.contains(button)) showView(button.dataset.view);
    });
    menuButton.addEventListener("click", () => setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true"));
    sidebarScrim.addEventListener("click", () => setMenuOpen(false));
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") setMenuOpen(false);
    });

    const requestedView = window.location.hash.slice(1);
    showView(Object.prototype.hasOwnProperty.call(renderers, requestedView) ? requestedView : "overview");
})();
