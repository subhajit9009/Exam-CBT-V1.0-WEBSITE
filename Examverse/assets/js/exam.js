/* ==========================================
   ExamVerse CBT Engine
   Created by Subhajit Paul
========================================== */

let selectedExam = null;
let questions = [];
let currentQuestion = 0;

// ==========================
// Page Load
// ==========================

window.addEventListener("DOMContentLoaded", initExam);

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

    updatePalette();

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

function updatePalette() {

    document

        .querySelectorAll(".paletteBtn")

        .forEach(btn => {

            btn.classList.remove("current");

        });

    document

        .getElementById(`palette${currentQuestion}`)

        .classList.add("current");

}