/* ==========================================
   ExamVerse CBT Engine
   Created by Subhajit Paul
========================================== */

let selectedExam = null;
let questions = [];
let currentQuestion = 0;

// ==========================
// Exam State
// ==========================

let answers = {};

let reviewQuestions = [];

let visitedQuestions = [];

let timerInterval = null;

// ==========================
// Page Load
// ==========================

window.addEventListener("DOMContentLoaded", initExam);

window.addEventListener("DOMContentLoaded", () => {

    const options = document.querySelector(".options");

    options.addEventListener("change", saveAnswer);

});

// ==========================
// Initialize Exam
// ==========================

async function initExam() {

    // Get selected exam from localStorage
    selectedExam = JSON.parse(localStorage.getItem("selectedExam"));

    if (!selectedExam) {

        alert("No exam selected.");

        window.location.href = "exam-list.html";

        return;

    }

    // Candidate Name
    const user = Storage.getCurrentUser();

    if (user) {

        document.getElementById("candidateName").textContent =
            user.fullName;

    }

    // Exam Title
    document.getElementById("examTitle").textContent =
        selectedExam.exam_name;

    // Load Questions
    await loadQuestions();

}

// ==========================
// Load Questions
// ==========================

async function loadQuestions() {

    const { data, error } =

        await supabaseClient

        .from("questions")

        .select("*")

        .eq("exam_id", selectedExam.id)

        .order("question_no", {
            ascending: true
        });

    if (error) {

        console.error(error);

        alert(error.message);

        return;

    }

    questions = data;

    document.getElementById("totalQuestion").textContent =
        questions.length;

    createPalette();

    showQuestion(0);

}

// ==========================
// Display Question
// ==========================

function showQuestion(index) {

    currentQuestion = index;

    // Mark visited

if(!visitedQuestions.includes(index)){

    visitedQuestions.push(index);

}

    const q = questions[index];

    document.getElementById("currentQuestion").textContent =
        index + 1;

    document.getElementById("questionText").textContent =
        q.question;

    document.getElementById("optionA").textContent =
        q.option_a;

    document.getElementById("optionB").textContent =
        q.option_b;

    document.getElementById("optionC").textContent =
        q.option_c;

    document.getElementById("optionD").textContent =
        q.option_d;

        // ==========================
// Restore Selected Answer
// ==========================

document.querySelectorAll('input[name="option"]')
.forEach(radio => {

    radio.checked = false;

});

if (answers[q.id]) {

    const selected = document.querySelector(
        `input[name="option"][value="${answers[q.id]}"]`
    );

    if (selected) {

        selected.checked = true;

    }

}

    updatePalette();

    document.getElementById("previousBtn").disabled =
currentQuestion===0;

document.getElementById("nextBtn").disabled =
currentQuestion===questions.length-1;

}

// ==========================
// Create Palette
// ==========================

function createPalette() {

    const palette =
        document.getElementById("questionPalette");

    palette.innerHTML = "";

    questions.forEach((q, index) => {

        palette.innerHTML +=

            `
<button
class="paletteBtn"
id="palette${index}"
onclick="showQuestion(${index})">

${index + 1}

</button>
`;

    });

}

// ==========================
// Update Palette
// ==========================

function updatePalette(){

    document.querySelectorAll(".paletteBtn")

    .forEach((btn,index)=>{

        btn.className="paletteBtn";

        if(visitedQuestions.includes(index)){

            btn.classList.add("notAnswered");

        }

        const q = questions[index];

        if(q && answers[q.id]){

            btn.classList.remove("notAnswered");

            btn.classList.add("answered");

        }

    });

    document

    .getElementById(`palette${currentQuestion}`)

    .classList.remove("answered","notAnswered");

    document

    .getElementById(`palette${currentQuestion}`)

    .classList.add("current");

}

// ==========================
// Navigation Buttons
// ==========================

document.getElementById("nextBtn")
.addEventListener("click", nextQuestion);

document.getElementById("previousBtn")
.addEventListener("click", previousQuestion);

function nextQuestion(){

    if(currentQuestion < questions.length-1){

        showQuestion(currentQuestion+1);

    }

}

function previousQuestion(){

    if(currentQuestion>0){

        showQuestion(currentQuestion-1);

    }

}

// ==========================
// Save Answer (Local)
// ==========================


function saveAnswer(event) {

    // Make sure a radio button was clicked
    if (!event.target.matches('input[name="option"]')) {
        return;
    }

    // Current question
    const question = questions[currentQuestion];

    // Save selected option locally
    answers[question.id] = event.target.value;

    console.log("Saved:", answers);

    // Update palette
    updatePalette();

}