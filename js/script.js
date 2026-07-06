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

function getSubjects(){
    return Array.from(document.querySelectorAll(".subject-row")).map(row => ({
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
        futureCredits: getInputValue("futureCredits"),
        expectedGpa: getInputValue("expectedGpa"),
        semesterGpa,
        semesterCredits,
        semesterGpaText: document.getElementById("semesterGpa").textContent,
        overallCgpaText: document.getElementById("overallCgpa").textContent,
        predictedCgpaText: document.getElementById("predictedCgpa").textContent,
        subjects: getSubjects()
    };

    localStorage.setItem(storageKey, JSON.stringify(state));
}

// Add Subject Row
function addSubject(subject = {}){

    const row = document.createElement("div");

    row.className = "subject-row";

    row.innerHTML = `
        <input type="text" class="subject-name" placeholder="Subject" aria-label="Subject name">

        <input type="number" class="credits" placeholder="Credits" aria-label="Subject credits">

        <select class="grade" aria-label="Subject grade">
    <option value="S">S</option>
    <option value="A">A</option>
    <option value="B">B</option>
    <option value="C">C</option>
    <option value="D">D</option>
    <option value="E">E</option>
    <option value="F">F</option>
    <option value="Ab">Ab</option>
</select>

        <button class="remove-btn" aria-label="Remove subject" title="Remove subject">X</button>
    `;

    row.querySelector(".subject-name").value = subject.subject || "";
    row.querySelector(".credits").value = subject.credits || "";
    row.querySelector(".grade").value = subject.grade || "S";

    row.querySelector(".remove-btn").onclick = () => {
        row.remove();
        saveState();
    };

    row.addEventListener("input", saveState);
    row.addEventListener("change", saveState);

    subjectsContainer.appendChild(row);
    saveState();

}

function loadState(){
    const savedState = localStorage.getItem(storageKey);

    if(!savedState){
        addSubject();
        return;
    }

    let state;

    try{
        state = JSON.parse(savedState);
    }
    catch(error){
        localStorage.removeItem(storageKey);
        addSubject();
        return;
    }

    isRestoring = true;

    setInputValue("currentCgpa", state.currentCgpa);
    setInputValue("currentCredits", state.currentCredits);
    setInputValue("futureCredits", state.futureCredits);
    setInputValue("expectedGpa", state.expectedGpa);

    semesterGpa = Number(state.semesterGpa) || 0;
    semesterCredits = Number(state.semesterCredits) || 0;

    document.getElementById("semesterGpa").textContent = state.semesterGpaText || "0.00";
    document.getElementById("overallCgpa").textContent = state.overallCgpaText || "0.00";
    document.getElementById("predictedCgpa").textContent = state.predictedCgpaText || "0.00";

    subjectsContainer.innerHTML = "";

    if(state.subjects && state.subjects.length){
        state.subjects.forEach(subject => addSubject(subject));
    }
    else{
        addSubject();
    }

    isRestoring = false;
    saveState();
}

// Calculate Semester GPA
function calculateSemester(){

    const rows = document.querySelectorAll(".subject-row");

    let totalCredits = 0;
    let totalPoints = 0;

    rows.forEach(row=>{

        const credits = Number(row.querySelector(".credits").value);

        const grade = row.querySelector(".grade").value;

        totalCredits += credits;

        totalPoints += credits * gradePoints[grade];

    });

    semesterCredits = totalCredits;

    semesterGpa = totalPoints / totalCredits || 0;

    document.getElementById("semesterGpa").textContent =
        semesterGpa.toFixed(2);

    saveState();

}

// Calculate Overall CGPA
function calculateCgpa(){

    const currentCgpa =
        Number(document.getElementById("currentCgpa").value);

    const currentCredits =
        Number(document.getElementById("currentCredits").value);

    const overall =
        (
            currentCgpa * currentCredits +
            semesterGpa * semesterCredits
        )
        /
        (currentCredits + semesterCredits);

    document.getElementById("overallCgpa").textContent =
        (overall || 0).toFixed(2);

    saveState();

}

// What If Calculator
function predictCgpa(){

    const currentCgpa =
        Number(document.getElementById("currentCgpa").value);

    const currentCredits =
        Number(document.getElementById("currentCredits").value);

    const futureCredits =
        Number(document.getElementById("futureCredits").value);

    const expectedGpa =
        Number(document.getElementById("expectedGpa").value);

    const predicted =
        (
            currentCgpa * currentCredits +
            expectedGpa * futureCredits
        )
        /
        (currentCredits + futureCredits);

    document.getElementById("predictedCgpa").textContent =
        (predicted || 0).toFixed(2);

    saveState();

}

// Event Listeners
["currentCgpa", "currentCredits", "futureCredits", "expectedGpa"].forEach(id => {
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
.getElementById("predictBtn")
.addEventListener("click", predictCgpa);

loadState();
