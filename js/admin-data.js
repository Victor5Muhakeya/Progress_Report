(() => {
    const STORAGE_KEY = "eagles-admin-demo-v1";
    const yearId = "year-2026";
    const termIds = ["term-2026-1", "term-2026-2", "term-2026-3"];

    function seedData() {
        const teachers = [
            { id: "teacher-1", fullName: "Grace Nansubuga", email: "grace.nansubuga@example.test", phone: "+256 700 100 101", staffId: "ERS-001", active: true },
            { id: "teacher-2", fullName: "Daniel Okello", email: "daniel.okello@example.test", phone: "+256 700 100 102", staffId: "ERS-002", active: true },
            { id: "teacher-3", fullName: "Sarah Atim", email: "sarah.atim@example.test", phone: "+256 700 100 103", staffId: "ERS-003", active: true }
        ];
        const classes = [1, 2, 3, 4].map(formNumber => ({
            id: `class-${formNumber}a`,
            name: `Form ${formNumber}A`,
            formNumber,
            stream: "A",
            yearId,
            active: true
        }));
        const subjects = [
            { id: "subject-eng", name: "English Language", code: "ENG", description: "", forms: [1, 2, 3, 4], active: true },
            { id: "subject-math", name: "Mathematics", code: "MAT", description: "", forms: [1, 2, 3, 4], active: true },
            { id: "subject-sci", name: "Integrated Science", code: "SCI", description: "", forms: [1, 2, 3, 4], active: true },
            { id: "subject-sst", name: "Social Studies", code: "SST", description: "", forms: [1, 2, 3, 4], active: true },
            { id: "subject-comp", name: "Computer Studies", code: "ICT", description: "", forms: [1, 2, 3, 4], active: true }
        ];
        const assignments = [
            { id: "assignment-1", teacherId: "teacher-1", classId: "class-1a", subjectId: "subject-eng", yearId, active: true },
            { id: "assignment-2", teacherId: "teacher-2", classId: "class-1a", subjectId: "subject-math", yearId, active: true },
            { id: "assignment-3", teacherId: "teacher-3", classId: "class-1a", subjectId: "subject-sci", yearId, active: true },
            { id: "assignment-4", teacherId: "teacher-1", classId: "class-2a", subjectId: "subject-sst", yearId, active: true },
            { id: "assignment-5", teacherId: "teacher-2", classId: "class-2a", subjectId: "subject-comp", yearId, active: true },
            { id: "assignment-6", teacherId: "teacher-3", classId: "class-2a", subjectId: "subject-math", yearId, active: true },
            { id: "assignment-7", teacherId: "teacher-1", classId: "class-3a", subjectId: "subject-eng", yearId, active: true },
            { id: "assignment-8", teacherId: "teacher-2", classId: "class-3a", subjectId: "subject-sci", yearId, active: true },
            { id: "assignment-9", teacherId: "teacher-3", classId: "class-4a", subjectId: "subject-math", yearId, active: true }
        ];
        teachers.forEach(teacher => {
            teacher.subjectIds = [...new Set(assignments
                .filter(assignment => assignment.teacherId === teacher.id)
                .map(assignment => assignment.subjectId))];
        });
        const students = Array.from({ length: 16 }, (_, index) => {
            const formNumber = Math.floor(index / 4) + 1;
            const number = String(index + 1).padStart(3, "0");
            return {
                id: `student-${index + 1}`,
                admissionNumber: `ERS-${number}`,
                fullName: ["Amina Kato", "Brian Ocen", "Clare Namuli", "David Ssemanda", "Evelyn Akello", "Frank Mugisha", "Gloria Naki", "Henry Ouma", "Irene Aciro", "James Kintu", "Kevin Odongo", "Lydia Nalwoga", "Martha Anyango", "Noah Kizza", "Olivia Namusoke", "Peter Laker"][index],
                gender: index % 2 ? "Male" : "Female",
                dateOfBirth: "",
                guardianName: "",
                guardianPhone: "",
                classId: `class-${formNumber}a`,
                yearId,
                history: []
            };
        });
        const marks = [];
        assignments.forEach((assignment, assignmentIndex) => {
            students.filter(student => student.classId === assignment.classId).forEach((student, studentIndex) => {
                if ((studentIndex + assignmentIndex) % 4 === 3) return;
                marks.push({
                    id: `mark-${assignment.id}-${student.id}`,
                    studentId: student.id,
                    assignmentId: assignment.id,
                    termId: termIds[2],
                    mark: 48 + ((studentIndex * 13 + assignmentIndex * 7) % 53),
                    remark: ""
                });
            });
        });
        return {
            teachers,
            students,
            classes,
            subjects,
            years: [{
                id: yearId,
                label: "2026 / 2027",
                active: true,
                terms: [
                    { id: termIds[0], name: "Term 1", startsOn: "2026-02-02", endsOn: "2026-05-01", open: false },
                    { id: termIds[1], name: "Term 2", startsOn: "2026-05-18", endsOn: "2026-08-14", open: false },
                    { id: termIds[2], name: "Term 3", startsOn: "2026-09-07", endsOn: "2026-11-27", open: true }
                ]
            }],
            assignments,
            marks,
            audit: [{ id: "audit-seed", actor: "Demo administrator", action: "Demo workspace loaded", details: "Sample records are for demonstration only.", at: new Date().toISOString() }],
            settings: {
                schoolName: "Eagles Rising High School",
                phone: "",
                email: "",
                address: "",
                logo: "images.jpg",
                defaultYearId: yearId,
                defaultTermId: termIds[2],
                showPositions: true,
                includeTeacherRemarks: true
            }
        };
    }

    function validateData(data) {
        const collections = ["teachers", "students", "classes", "subjects", "years", "assignments", "marks", "audit"];
        return data && typeof data === "object" &&
            collections.every(name => Array.isArray(data[name])) &&
            data.settings && typeof data.settings === "object";
    }

    function load() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) return seedData();
        let data;
        try {
            data = JSON.parse(raw);
        } catch (error) {
            throw new Error(`Saved demo data could not be read: ${error.message}`);
        }
        if (!validateData(data)) throw new Error("Saved demo data has an unexpected format. Reset demo data to restore the sample workspace.");
        data.teachers.forEach(teacher => {
            if (!Array.isArray(teacher.subjectIds)) {
                teacher.subjectIds = [...new Set(data.assignments
                    .filter(assignment => assignment.teacherId === teacher.id)
                    .map(assignment => assignment.subjectId))];
            }
        });
        return data;
    }

    let data;
    try {
        data = load();
    } catch (error) {
        window.AdminDataError = error;
        data = seedData();
    }

    function persist() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function nextId(prefix) {
        return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    }

    function audit(action, details) {
        data.audit.unshift({
            id: nextId("audit"),
            actor: "Demo administrator",
            action,
            details,
            at: new Date().toISOString()
        });
    }

    window.AdminData = Object.freeze({
        get data() { return data; },
        get storageKey() { return STORAGE_KEY; },
        id: nextId,
        save(action, details) {
            if (action) audit(action, details || "");
            persist();
        },
        reset() {
            const fresh = seedData();
            Object.keys(data).forEach(key => delete data[key]);
            Object.assign(data, fresh);
            persist();
            delete window.AdminDataError;
        },
        audit
    });
})();
