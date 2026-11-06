(() => {
            const STORAGE_KEY = "eagles-class-results-v1";
            const GRADES = ["A", "B", "C", "D", "E", "F"];
            const COLORS = ["#43815d", "#7ba66c", "#d5b44f", "#d78a4d", "#c97957", "#b95248"];
            const groupSelect = document.getElementById("groupSelect");
            const gradeGrid = document.getElementById("gradeGrid");
            const learnerRows = document.getElementById("learnerRows");
            let records = [];

            function gradeFor(mark) {
                if (mark >= 85) return "A";
                if (mark >= 75) return "B";
                if (mark >= 65) return "C";
                if (mark >= 50) return "D";
                return "F";
            }

            function validRecord(record) {
                return record && typeof record === "object" && typeof record.key === "string" &&
                    typeof record.studentName === "string" && typeof record.className === "string" &&
                        Array.isArray(record.subjects) && record.subjects.length > 0 &&
                    record.subjects.every(subject => subject && typeof subject.name === "string" &&
                        Number.isFinite(Number(subject.mark)) && Number(subject.mark) >= 0 && Number(subject.mark) <= 100);
            }

            function groupKey(record) {
                return JSON.stringify([record.className, record.term || "", record.academicYear || ""]);
            }

            function readRecords() {
                try {
                    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
                    if (!Array.isArray(saved)) throw new Error("Class results data is not a list.");
                    records = saved.filter(validRecord);
                    if (records.length !== saved.length) {
                        document.getElementById("storageNotice").textContent = "Some saved results were invalid and have been excluded from the analysis.";
                        document.getElementById("storageNotice").hidden = false;
                    }
                } catch (error) {
                    console.warn("Could not load class results.", error);
                    records = [];
                    const notice = document.getElementById("storageNotice");
                    notice.textContent = "Could not read saved class results from this device. Check browser storage and try again.";
                    notice.hidden = false;
                }
            }

            function createSvgElement(tag, attributes = {}) {
                const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
                Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
                return element;
            }

            function updateGroups() {
                const previous = groupSelect.value;
                const groups = new Map();
                records.forEach(record => {
                    const key = groupKey(record);
                    if (!groups.has(key)) groups.set(key, record);
                });
                groupSelect.replaceChildren();
                [...groups.entries()].forEach(([key, record]) => {
                    const option = document.createElement("option");
                    option.value = key;
                    option.textContent = [record.className, record.term, record.academicYear].filter(Boolean).join(" · ");
                    groupSelect.appendChild(option);
                });
                if (groups.has(previous)) groupSelect.value = previous;
                else if (records.length) {
                    const latest = records.reduce((newest, record) => record.updatedAt > newest.updatedAt ? record : newest, records[0]);
                    groupSelect.value = groupKey(latest);
                }
                document.getElementById("classSubtitle").textContent = records.length
                    ? "Review subject averages and class grade outcomes for the selected group."
                    : "Save learner results from the report page to build class-wide charts.";
            }

            function renderEmpty() {
                document.getElementById("learnerCount").textContent = "0";
                document.getElementById("classAverage").textContent = "-";
                document.getElementById("subjectCount").textContent = "0";
                gradeGrid.replaceChildren();
                GRADES.forEach(grade => {
                    const card = document.createElement("div");
                    card.className = "grade-card";
                    card.dataset.grade = grade;
                    card.innerHTML = `<span class="grade-name">${grade}</span><strong class="grade-count">0</strong>`;
                    gradeGrid.appendChild(card);
                });
                const subjectWrap = document.getElementById("subjectChartWrap");
                subjectWrap.innerHTML = '<div class="empty-chart">No learner results saved for this class and period yet.</div>';
                const gradeWrap = document.getElementById("gradeChartWrap");
                gradeWrap.innerHTML = '<div class="empty-chart">Grade distribution will appear after results are saved.</div>';
                learnerRows.innerHTML = '<tr><td colspan="6" class="empty-chart">No learners saved for this group.</td></tr>';
            }

            function renderBarChart(subjectAverages) {
                const svg = document.getElementById("subjectChart");
                svg.replaceChildren();
                const width = 700;
                const height = 260;
                const margin = { top: 16, right: 12, bottom: 62, left: 38 };
                const plotHeight = height - margin.top - margin.bottom;
                [0, 25, 50, 75, 100].forEach(value => {
                    const y = margin.top + plotHeight * (1 - value / 100);
                    svg.appendChild(createSvgElement("line", { x1: margin.left, y1: y, x2: width - margin.right, y2: y, stroke: "#e5ebe4", "stroke-width": 1 }));
                    const label = createSvgElement("text", { x: margin.left - 8, y: y + 4, "text-anchor": "end" });
                    label.textContent = `${value}%`;
                    svg.appendChild(label);
                });
                const step = (width - margin.left - margin.right) / subjectAverages.length;
                subjectAverages.forEach((subject, index) => {
                    const barWidth = Math.min(42, step * .56);
                    const barHeight = plotHeight * subject.average / 100;
                    const x = margin.left + step * index + (step - barWidth) / 2;
                    const y = margin.top + plotHeight - barHeight;
                    const bar = createSvgElement("rect", { x, y, width: barWidth, height: barHeight, rx: 4, fill: "#43815d" });
                    const title = createSvgElement("title");
                    title.textContent = `${subject.name}: ${subject.average.toFixed(1)}% from ${subject.count} result${subject.count === 1 ? "" : "s"}`;
                    bar.appendChild(title);
                    svg.appendChild(bar);
                    const value = createSvgElement("text", { x: x + barWidth / 2, y: y - 6, "text-anchor": "middle" });
                    value.textContent = `${subject.average.toFixed(0)}%`;
                    svg.appendChild(value);
                    const label = createSvgElement("text", { x: x + barWidth / 2, y: height - margin.bottom + 18, "text-anchor": "middle" });
                    label.textContent = subject.name.length > 13 ? `${subject.name.slice(0, 12)}…` : subject.name;
                    label.appendChild(createSvgElement("title")).textContent = subject.name;
                    svg.appendChild(label);
                });
            }

            function renderDonut(counts, total) {
                const svg = document.getElementById("gradeChart");
                const legend = document.getElementById("gradeLegend");
                svg.replaceChildren();
                legend.replaceChildren();
                let angle = -Math.PI / 2;
                GRADES.forEach((grade, index) => {
                    const count = counts[grade];
                    if (count) {
                        const nextAngle = angle + (count / total) * Math.PI * 2;
                        const startX = 110 + 82 * Math.cos(angle);
                        const startY = 110 + 82 * Math.sin(angle);
                        if (count === total) {
                            const middleX = 110 + 82 * Math.cos(angle + Math.PI);
                            const middleY = 110 + 82 * Math.sin(angle + Math.PI);
                            svg.appendChild(createSvgElement("path", { d: `M ${startX} ${startY} A 82 82 0 0 1 ${middleX} ${middleY} A 82 82 0 0 1 ${startX} ${startY}`, fill: "none", stroke: COLORS[index], "stroke-width": 24 }));
                        } else {
                            const endX = 110 + 82 * Math.cos(nextAngle);
                            const endY = 110 + 82 * Math.sin(nextAngle);
                            const largeArc = nextAngle - angle > Math.PI ? 1 : 0;
                            svg.appendChild(createSvgElement("path", { d: `M ${startX} ${startY} A 82 82 0 ${largeArc} 1 ${endX} ${endY}`, fill: "none", stroke: COLORS[index], "stroke-width": 24 }));
                        }
                        angle = nextAngle;
                    }
                    const item = document.createElement("div");
                    item.className = "legend-item";
                    const swatch = document.createElement("span");
                    swatch.className = "legend-swatch";
                    swatch.style.backgroundColor = COLORS[index];
                    const label = document.createElement("span");
                    label.textContent = `${grade}: ${count} (${total ? Math.round(count / total * 100) : 0}%)`;
                    item.append(swatch, label);
                    legend.appendChild(item);
                });
                const totalLabel = createSvgElement("text", { x: 110, y: 108, class: "donut-total" });
                totalLabel.textContent = String(total);
                svg.appendChild(totalLabel);
                const caption = createSvgElement("text", { x: 110, y: 127, class: "donut-caption" });
                caption.textContent = "subject results";
                svg.appendChild(caption);
            }

            function render() {
                const selectedKey = groupSelect.value;
                const selectedRecords = records.filter(record => groupKey(record) === selectedKey);
                if (!selectedRecords.length) {
                    renderEmpty();
                    return;
                }
                const grades = Object.fromEntries(GRADES.map(grade => [grade, 0]));
                const subjects = new Map();
                let scoreTotal = 0;
                let resultCount = 0;
                selectedRecords.forEach(record => {
                    record.subjects.forEach(subject => {
                        const mark = Number(subject.mark);
                        const grade = gradeFor(mark);
                        grades[grade]++;
                        scoreTotal += mark;
                        resultCount++;
                        const key = subject.name.trim().toLocaleLowerCase();
                        const entry = subjects.get(key) || { name: subject.name.trim(), total: 0, count: 0 };
                        entry.total += mark;
                        entry.count++;
                        subjects.set(key, entry);
                    });
                });
                const subjectAverages = [...subjects.values()]
                    .map(subject => ({ ...subject, average: subject.total / subject.count }))
                    .sort((first, second) => first.name.localeCompare(second.name));
                document.getElementById("learnerCount").textContent = String(selectedRecords.length);
                document.getElementById("classAverage").textContent = resultCount ? `${(scoreTotal / resultCount).toFixed(1)}%` : "-";
                document.getElementById("subjectCount").textContent = String(subjectAverages.length);
                gradeGrid.replaceChildren();
                GRADES.forEach(grade => {
                    const card = document.createElement("div");
                    card.className = "grade-card";
                    card.dataset.grade = grade;
                    card.innerHTML = `<span class="grade-name">${grade}</span><strong class="grade-count">${grades[grade]}</strong>`;
                    gradeGrid.appendChild(card);
                });
                document.getElementById("subjectChartWrap").innerHTML = '<svg class="chart" id="subjectChart" viewBox="0 0 700 260" role="img" aria-label="Bar chart of average marks by learning area"></svg>';
                if (subjectAverages.length) renderBarChart(subjectAverages);
                else document.getElementById("subjectChartWrap").innerHTML = '<div class="empty-chart">No subject marks are available to chart.</div>';
                document.getElementById("gradeChartWrap").innerHTML = '<svg class="chart donut-chart" id="gradeChart" viewBox="0 0 220 220" role="img" aria-label="Donut chart showing grade distribution"></svg><div class="legend" id="gradeLegend"></div>';
                renderDonut(grades, resultCount);
                learnerRows.replaceChildren();
                selectedRecords
                    .map(record => {
                        const marks = record.subjects.map(subject => Number(subject.mark));
                        return { record, marks, average: marks.reduce((sum, mark) => sum + mark, 0) / marks.length };
                    })
                    .sort((first, second) => second.average - first.average || first.record.studentName.localeCompare(second.record.studentName))
                    .forEach(({ record, marks, average }) => {
                    const row = document.createElement("tr");
                    [record.studentName, record.studentId || "-", String(marks.length), `${average.toFixed(1)}%`, gradeFor(average)].forEach(value => {
                        const cell = document.createElement("td");
                        cell.textContent = value;
                        row.appendChild(cell);
                    });
                    const actionCell = document.createElement("td");
                    const remove = document.createElement("button");
                    remove.type = "button";
                    remove.className = "remove-button";
                    remove.dataset.recordKey = record.key;
                    remove.textContent = "Remove";
                    remove.setAttribute("aria-label", `Remove ${record.studentName} from class analysis`);
                    actionCell.appendChild(remove);
                    row.appendChild(actionCell);
                    learnerRows.appendChild(row);
                    });
            }

            function refresh() {
                readRecords();
                updateGroups();
                render();
            }

            groupSelect.addEventListener("change", render);
            learnerRows.addEventListener("click", event => {
                const button = event.target.closest("[data-record-key]");
                if (!button) return;
                const record = records.find(item => item.key === button.dataset.recordKey);
                if (!record || !window.confirm(`Remove ${record.studentName}'s results from class analysis?`)) return;
                records = records.filter(item => item.key !== record.key);
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
                    updateGroups();
                    render();
                } catch (error) {
                    console.warn("Could not remove class results.", error);
                    document.getElementById("storageNotice").textContent = "Could not update saved class results on this device.";
                    document.getElementById("storageNotice").hidden = false;
                }
            });
            window.addEventListener("storage", event => {
                if (event.key === STORAGE_KEY) refresh();
            });
            refresh();
        })();
