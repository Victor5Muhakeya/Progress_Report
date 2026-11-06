(() => {
            const STORAGE_KEY = "eagles-progress-report-v1";
            const CLASS_RECORDS_KEY = "eagles-class-results-v1";
            const defaults = {
                schoolName: "Eagles Rising High School",
                reportType: "Mid-term results",
                term: "Term 1",
                academicYear: "2026 / 2027",
                issueDate: new Date().toISOString().slice(0, 10),
                studentName: "",
                studentId: "",
                className: "",
                classPosition: "",
                teacherComment: "",
                teacherName: "",
                headComment: "",
                subjects: [
                    { name: "English Language", mark: "", position: "", remark: "" },
                    { name: "Mathematics", mark: "", position: "", remark: "" },
                    { name: "Integrated Science", mark: "", position: "", remark: "" },
                    { name: "Social Studies", mark: "", position: "", remark: "" },
                    { name: "Creative Arts", mark: "", position: "", remark: "" },
                    { name: "Physical Education", mark: "", position: "", remark: "" }
                ]
            };
            const fields = [...document.querySelectorAll("[data-field]")];
            const editor = document.getElementById("subjectEditor");
            const saveState = document.getElementById("saveState");
            let state = loadState();
            let saveTimer;
            let toastTimer;

            function loadState() {
                try {
                    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
                    if (saved && typeof saved === "object") {
                        return { ...defaults, ...saved, subjects: Array.isArray(saved.subjects) ? saved.subjects : defaults.subjects.map(subject => ({ ...subject })) };
                    }
                } catch (error) {
                    console.warn("Could not load the saved report.", error);
                }
                return { ...defaults, subjects: defaults.subjects.map(subject => ({ ...subject })) };
            }

            function escapeHtml(value) {
                return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
            }

            function gradeFor(mark) {
                const score = Number(mark);
                if (mark === "" || !Number.isFinite(score)) return "-";
                if (score >= 85) return "A";
                if (score >= 75) return "B";
                if (score >= 65) return "C";
                if (score >= 50) return "D";
                return "F";
            }

            function formatDate(value) {
                if (!value) return "-";
                const date = new Date(`${value}T00:00:00`);
                return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
            }

            function averageForSubjects(subjects) {
                const markedSubjects = subjects.filter(subject => subject.mark !== "" && Number.isFinite(Number(subject.mark)));
                return markedSubjects.length
                    ? markedSubjects.reduce((total, subject) => total + Number(subject.mark), 0) / markedSubjects.length
                    : null;
            }

            function renderSubjects() {
                editor.innerHTML = "";
                state.subjects.forEach((subject, index) => {
                    const row = document.createElement("div");
                    row.className = "subject-edit-row";
                    row.innerHTML = `
                        <input aria-label="Subject ${index + 1} name" data-subject="name" data-index="${index}" value="${escapeHtml(subject.name)}" placeholder="Subject">
                        <input aria-label="${escapeHtml(subject.name || `Subject ${index + 1}`)} mark" data-subject="mark" data-index="${index}" type="number" min="0" max="100" step="1" value="${escapeHtml(subject.mark)}" placeholder="0-100">
                        <input aria-label="${escapeHtml(subject.name || `Subject ${index + 1}`)} position" data-subject="position" data-index="${index}" value="${escapeHtml(subject.position)}" placeholder="e.g. 3">
                        <input aria-label="${escapeHtml(subject.name || `Subject ${index + 1}`)} remark" data-subject="remark" data-index="${index}" value="${escapeHtml(subject.remark)}" placeholder="Optional">
                        <button class="remove-subject" type="button" data-remove="${index}" aria-label="Remove ${escapeHtml(subject.name || `subject ${index + 1}`)}" title="Remove subject">&times;</button>`;
                    editor.appendChild(row);
                });
                document.getElementById("subjectCount").textContent = `${state.subjects.length} ${state.subjects.length === 1 ? "subject" : "subjects"}`;
            }

            function readFields() {
                fields.forEach(field => { state[field.dataset.field] = field.value; });
            }

            function renderPreview() {
                const text = (id, value, fallback = "-") => { document.getElementById(id).textContent = value || fallback; };
                text("previewSchool", state.schoolName);
                text("previewPeriod", `${state.reportType || "School progress report"} / ${state.term || "Term"} / ${state.academicYear || "Academic year"}`);
                text("previewName", state.studentName, "Learner name");
                text("previewId", state.studentId);
                text("previewClass", state.className);
                text("previewYear", state.academicYear);
                text("previewPosition", state.classPosition);
                text("previewDate", formatDate(state.issueDate));
                text("previewOverallPosition", state.classPosition);
                text("previewTeacherComment", state.teacherComment);
                text("previewHeadComment", state.headComment);
                text("previewTeacherName", state.teacherName ? `Class teacher: ${state.teacherName}` : "Class teacher: ____________________");
                text("previewIssueDate", state.issueDate ? `Issued ${formatDate(state.issueDate)}` : "");

                const average = averageForSubjects(state.subjects);
                text("previewAverage", average === null ? "-" : `${average.toFixed(1)}%`);
                text("previewOverallGrade", average === null ? "-" : gradeFor(average));
                document.getElementById("status").value = average === null ? "" : average >= 50 ? "PASS" : "FAIL";
                text("previewStatus", average === null ? "-" : average >= 50 ? "PASS" : "FAIL");

                const tbody = document.getElementById("previewSubjects");
                if (!state.subjects.length) {
                    tbody.innerHTML = '<tr><td class="empty-row" colspan="5">Add subjects to show academic results.</td></tr>';
                } else {
                    tbody.innerHTML = state.subjects.map(subject => {
                        const mark = subject.mark === "" ? "-" : `${escapeHtml(subject.mark)}%`;
                        const grade = gradeFor(subject.mark);
                        const autoRemark = grade === "A" ? "Excellent" : grade === "B" ? "Very good" : grade === "C" ? "Good" : grade === "D" ? "Average" : grade === "F" ? "Fail" : "-";
                        return `<tr><td>${escapeHtml(subject.name || "-")}</td><td>${escapeHtml(subject.position || "-")}</td><td>${mark}</td><td><span class="grade-pill">${grade}</span></td><td>${escapeHtml(subject.remark || autoRemark)}</td></tr>`;
                    }).join("");
                }
            }

            function scheduleSave() {
                saveState.textContent = "Saving...";
                clearTimeout(saveTimer);
                saveTimer = setTimeout(() => {
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                        saveState.textContent = "Saved on this device";
                    } catch (error) {
                        saveState.textContent = "Could not save";
                        console.warn("Could not save the report.", error);
                    }
                }, 250);
            }

            function update() {
                readFields();
                renderPreview();
                scheduleSave();
            }

            function showToast(message) {
                const toast = document.getElementById("toast");
                toast.textContent = message;
                toast.classList.add("visible");
                clearTimeout(toastTimer);
                toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
            }

            function syncForm() {
                fields.forEach(field => { field.value = state[field.dataset.field] ?? ""; });
                renderSubjects();
                renderPreview();
            }

            fields.forEach(field => field.addEventListener("input", update));
            fields.filter(field => field.tagName === "SELECT").forEach(field => field.addEventListener("change", update));

            editor.addEventListener("input", event => {
                const input = event.target.closest("[data-subject]");
                if (!input) return;
                const index = Number(input.dataset.index);
                state.subjects[index][input.dataset.subject] = input.value;
                renderPreview();
                scheduleSave();
            });

            editor.addEventListener("click", event => {
                const button = event.target.closest("[data-remove]");
                if (!button) return;
                state.subjects.splice(Number(button.dataset.remove), 1);
                renderSubjects();
                renderPreview();
                scheduleSave();
            });

            document.getElementById("addSubject").addEventListener("click", () => {
                state.subjects.push({ name: "", mark: "", position: "", remark: "" });
                renderSubjects();
                renderPreview();
                scheduleSave();
                editor.querySelector(".subject-edit-row:last-child input").focus();
            });

            document.getElementById("printButton").addEventListener("click", () => window.print());

            document.getElementById("resetButton").addEventListener("click", () => {
                if (!window.confirm("Start a fresh report? This will clear the saved report on this device.")) return;
                state = { ...defaults, subjects: defaults.subjects.map(subject => ({ ...subject })) };
                localStorage.removeItem(STORAGE_KEY);
                syncForm();
                saveState.textContent = "New report started";
                showToast("New report ready");
            });

            document.getElementById("saveClassRecord").addEventListener("click", () => {
                readFields();
                const studentName = state.studentName.trim();
                const className = state.className.trim();
                const subjects = state.subjects
                    .filter(subject => subject.mark !== "")
                    .map(subject => ({ name: subject.name.trim(), mark: Number(subject.mark) }));

                if (!studentName || !className) {
                    showToast("Enter the learner's name and class first");
                    return;
                }
                if (!subjects.length || subjects.some(subject => !subject.name || !Number.isFinite(subject.mark) || subject.mark < 0 || subject.mark > 100)) {
                    showToast("Enter a valid 0-100 score and subject for each result");
                    return;
                }

                const term = state.term.trim();
                const academicYear = state.academicYear.trim();
                const identity = (state.studentId.trim() || studentName).toLocaleLowerCase();
                const record = {
                    key: JSON.stringify([className, term, academicYear, identity].map(value => value.toLocaleLowerCase())),
                    studentName,
                    studentId: state.studentId.trim(),
                    className,
                    term,
                    academicYear,
                    schoolName: state.schoolName.trim(),
                    subjects,
                    updatedAt: new Date().toISOString()
                };

                try {
                    const savedRecords = JSON.parse(localStorage.getItem(CLASS_RECORDS_KEY) || "[]");
                    if (!Array.isArray(savedRecords)) throw new Error("Class results data is not a list.");
                    const recordIndex = savedRecords.findIndex(saved => saved && saved.key === record.key);
                    if (recordIndex >= 0) savedRecords[recordIndex] = record;
                    else savedRecords.push(record);
                    localStorage.setItem(CLASS_RECORDS_KEY, JSON.stringify(savedRecords));
                    scheduleSave();
                    showToast(recordIndex >= 0 ? "Learner's class results updated" : "Learner added to class analysis");
                } catch (error) {
                    console.warn("Could not save class results.", error);
                    showToast("Could not save class results on this device");
                }
            });

            syncForm();
        })();
