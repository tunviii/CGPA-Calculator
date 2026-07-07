const gradePoints = {
    "S": 10,
    "A": 9,
    "B": 8,
    "C": 7,
    "D": 6,
    "E": 5,
    "F": 0,
    "Ab": 0
};

const subjectsContainer = document.getElementById("subjects");
const futureSemestersContainer = document.getElementById("futureSemesters");
const storageKey = "cgpaCalculatorState";

let semesterGpa = 0;
let semesterCredits = 0;
let isRestoring = false;

function getInputValue(id){
    return document.getElementById(id).value;
}

function setInputValue(id, value){
    document.getElementById(id).value = value || "";
}

function gradeOptions(selectedGrade = "S"){
    return Object.keys(gradePoints).map(grade => {
        const selected = grade === selectedGrade ? "selected" : "";
        return `<option value="${grade}" ${selected}>${grade}</option>`;
    }).join("");
}

function calculateRows(rows){
    let totalCredits = 0;
    let totalPoints = 0;

    rows.forEach(row => {
        const credits = Number(row.querySelector(".credits").value);
        const grade = row.querySelector(".grade").value;

        totalCredits += credits;
        totalPoints += credits * gradePoints[grade];
    });

    return {
        credits: totalCredits,
        points: totalPoints,
        gpa: totalPoints / totalCredits || 0
    };
}

function createSubjectRow(subject = {}, onRemove = saveState){
    const row = document.createElement("div");

    row.className = "subject-row";

    row.innerHTML = `
        <input type="text" class="subject-name" placeholder="Subject" aria-label="Subject name">
        <input type="number" class="credits" placeholder="Credits" aria-label="Subject credits">
        <select class="grade" aria-label="Subject grade">
            ${gradeOptions(subject.grade)}
        </select>
        <button class="remove-btn" aria-label="Remove subject" title="Remove subject">X</button>
    `;

    row.querySelector(".subject-name").value = subject.subject || "";
    row.querySelector(".credits").value = subject.credits || "";

    row.querySelector(".remove-btn").onclick = () => {
        row.remove();
        onRemove();
        saveState();
    };

    row.addEventListener("input", () => {
        onRemove();
        saveState();
    });

    row.addEventListener("change", () => {
        onRemove();
        saveState();
    });

    return row;
}

function getSubjects(container){
    return Array.from(container.querySelectorAll(".subject-row")).map(row => ({
        subject: row.querySelector(".subject-name").value,
        credits: row.querySelector(".credits").value,
        grade: row.querySelector(".grade").value
    }));
}

function saveState(){
    if(isRestoring){
        return;
    }

    const state = {
        currentCgpa: getInputValue("currentCgpa"),
        currentCredits: getInputValue("currentCredits"),
        semesterGpa,
        semesterCredits,
        semesterGpaText: document.getElementById("semesterGpa").textContent,
        overallCgpaText: document.getElementById("overallCgpa").textContent,
        predictedCgpaText: document.getElementById("predictedCgpa").textContent,
        projectedCreditsText: document.getElementById("projectedCredits").textContent,
        subjects: getSubjects(subjectsContainer),
        futureSemesters: getFutureSemesters()
    };

    localStorage.setItem(storageKey, JSON.stringify(state));
}

function addSubject(subject = {}){
    subjectsContainer.appendChild(createSubjectRow(subject));
    saveState();
}

function addFutureSubject(semesterElement, subject = {}){
    const subjectsList = semesterElement.querySelector(".future-subjects");

    subjectsList.appendChild(createSubjectRow(subject, () => {
        updateFutureSemesterSummary(semesterElement);
    }));

    updateFutureSemesterSummary(semesterElement);
    saveState();
}

function updateFutureSemesterSummary(semesterElement){
    const rows = semesterElement.querySelectorAll(".subject-row");
    const totals = calculateRows(rows);

    semesterElement.querySelector(".future-semester-gpa").textContent = totals.gpa.toFixed(2);
    semesterElement.querySelector(".future-semester-credits").textContent = totals.credits;
}

function updateAllFutureSemesterSummaries(){
    document.querySelectorAll(".future-semester").forEach(updateFutureSemesterSummary);
}

function addFutureSemester(semester = {}){
    const semesterElement = document.createElement("div");
    const semesterNumber = futureSemestersContainer.children.length + 1;

    semesterElement.className = "future-semester";

    semesterElement.innerHTML = `
        <div class="future-semester-header">
            <input
                type="text"
                class="future-semester-title"
                aria-label="Future semester name"
            >
            <button class="remove-btn" aria-label="Remove future semester" title="Remove future semester">X</button>
        </div>

        <div class="future-subjects"></div>

        <div class="button-row">
            <button class="secondary-btn add-future-subject-btn" type="button">
                + Add Subject
            </button>
        </div>

        <div class="semester-summary">
            <span>Semester GPA: <strong class="future-semester-gpa">0.00</strong></span>
            <span>Credits: <strong class="future-semester-credits">0</strong></span>
        </div>
    `;

    semesterElement.querySelector(".remove-btn").onclick = () => {
        semesterElement.remove();
        saveState();
    };

    semesterElement.querySelector(".future-semester-title").value =
        semester.name || `Future Semester ${semesterNumber}`;

    semesterElement.querySelector(".future-semester-title").addEventListener("input", saveState);
    semesterElement.querySelector(".add-future-subject-btn").addEventListener("click", () => {
        addFutureSubject(semesterElement);
    });

    futureSemestersContainer.appendChild(semesterElement);

    if(semester.subjects && semester.subjects.length){
        semester.subjects.forEach(subject => addFutureSubject(semesterElement, subject));
    }
    else{
        addFutureSubject(semesterElement);
    }

    updateFutureSemesterSummary(semesterElement);
    saveState();
}

function getFutureSemesters(){
    return Array.from(document.querySelectorAll(".future-semester")).map(semesterElement => ({
        name: semesterElement.querySelector(".future-semester-title").value,
        subjects: getSubjects(semesterElement.querySelector(".future-subjects"))
    }));
}

function loadState(){
    const savedState = localStorage.getItem(storageKey);

    if(!savedState){
        addSubject();
        addFutureSemester();
        return;
    }

    let state;

    try{
        state = JSON.parse(savedState);
    }
    catch(error){
        localStorage.removeItem(storageKey);
        addSubject();
        addFutureSemester();
        return;
    }

    isRestoring = true;

    setInputValue("currentCgpa", state.currentCgpa);
    setInputValue("currentCredits", state.currentCredits);

    semesterGpa = Number(state.semesterGpa) || 0;
    semesterCredits = Number(state.semesterCredits) || 0;

    document.getElementById("semesterGpa").textContent = state.semesterGpaText || "0.00";
    document.getElementById("overallCgpa").textContent = state.overallCgpaText || "0.00";
    document.getElementById("predictedCgpa").textContent = state.predictedCgpaText || "0.00";
    document.getElementById("projectedCredits").textContent = state.projectedCreditsText || "0";

    subjectsContainer.innerHTML = "";
    futureSemestersContainer.innerHTML = "";

    if(state.subjects && state.subjects.length){
        state.subjects.forEach(subject => addSubject(subject));
    }
    else{
        addSubject();
    }

    if(state.futureSemesters && state.futureSemesters.length){
        state.futureSemesters.forEach(semester => addFutureSemester(semester));
    }
    else{
        addFutureSemester();
    }

    isRestoring = false;
    updateAllFutureSemesterSummaries();
    saveState();
}

function calculateSemester(){
    const totals = calculateRows(document.querySelectorAll("#subjects .subject-row"));

    semesterCredits = totals.credits;
    semesterGpa = totals.gpa;

    document.getElementById("semesterGpa").textContent = semesterGpa.toFixed(2);

    saveState();
}

function calculateCgpa(){
    calculateSemester();

    const currentCgpa = Number(document.getElementById("currentCgpa").value);
    const currentCredits = Number(document.getElementById("currentCredits").value);

    const overall =
        (
            currentCgpa * currentCredits +
            semesterGpa * semesterCredits
        )
        /
        (currentCredits + semesterCredits);

    document.getElementById("overallCgpa").textContent = (overall || 0).toFixed(2);

    saveState();
}

function predictCgpa(){
    const currentCgpa = Number(document.getElementById("currentCgpa").value);
    const currentCredits = Number(document.getElementById("currentCredits").value);
    const currentSemesterTotals = calculateRows(document.querySelectorAll("#subjects .subject-row"));

    let totalCredits = currentCredits + currentSemesterTotals.credits;
    let totalPoints = currentCgpa * currentCredits + currentSemesterTotals.points;

    document.querySelectorAll(".future-semester").forEach(semesterElement => {
        const totals = calculateRows(semesterElement.querySelectorAll(".subject-row"));

        totalCredits += totals.credits;
        totalPoints += totals.points;
        updateFutureSemesterSummary(semesterElement);
    });

    semesterCredits = currentSemesterTotals.credits;
    semesterGpa = currentSemesterTotals.gpa;

    document.getElementById("semesterGpa").textContent = semesterGpa.toFixed(2);
    document.getElementById("predictedCgpa").textContent = (totalPoints / totalCredits || 0).toFixed(2);
    document.getElementById("projectedCredits").textContent = totalCredits;

    saveState();
}

["currentCgpa", "currentCredits"].forEach(id => {
    document.getElementById(id).addEventListener("input", saveState);
});

document
.getElementById("addSubjectBtn")
.addEventListener("click", () => addSubject());

document
.getElementById("calculateSemesterBtn")
.addEventListener("click", calculateSemester);

document
.getElementById("calculateCgpaBtn")
.addEventListener("click", calculateCgpa);

document
.getElementById("addFutureSemesterBtn")
.addEventListener("click", () => addFutureSemester());

document
.getElementById("predictBtn")
.addEventListener("click", predictCgpa);

loadState();
