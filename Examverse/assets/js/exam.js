/* ==========================================
   ExamVerse CBT Engine
   Version : 2.0
   Created by Subhajit Paul
==========================================*/

//==========================================
// Global Variables
//==========================================

let selectedExam = null;

let questions = [];

let currentQuestionIndex = 0;

let answers = {};

let visitedQuestions = [];

let reviewQuestions = [];

let timerInterval = null;

let examStartTime = null;

let attemptId = null;

//==========================================
// DOM Elements
//==========================================

const examTitle =
document.getElementById("examTitle");

const candidateName =
document.getElementById("candidateName");

const currentQuestion =
document.getElementById("currentQuestion");

const totalQuestion =
document.getElementById("totalQuestion");

const questionText =
document.getElementById("questionText");

const optionA =
document.getElementById("optionA");

const optionB =
document.getElementById("optionB");

const optionC =
document.getElementById("optionC");

const optionD =
document.getElementById("optionD");

const questionPalette =
document.getElementById("questionPalette");

const timer =
document.getElementById("timer");

const previousBtn =
document.getElementById("previousBtn");

const nextBtn =
document.getElementById("nextBtn");

const reviewBtn =
document.getElementById("reviewBtn");

const clearBtn =
document.getElementById("clearBtn");

const submitBtn =
document.getElementById("submitBtn");

//==========================================
// Start Application
//==========================================

window.addEventListener(

    "DOMContentLoaded",

    initializeExam

);

//==========================================
// Initialize Exam
//==========================================

async function initializeExam() {

    // Logged In User

    const user = Storage.getCurrentUser();

    if (!user) {

        alert("Please login first.");

        window.location.href = "login.html";

        return;

    }

    candidateName.textContent = user.fullName;

    // Selected Exam

    const storedExam = localStorage.getItem("selectedExam");

    if (!storedExam) {

        alert("No Exam Selected.");

        window.location.href = "exam-list.html";

        return;

    }

    selectedExam = JSON.parse(storedExam);

    examTitle.textContent = selectedExam.exam_name;

    // Attempt ID

    attemptId = sessionStorage.getItem("attemptId");

    if (!attemptId) {

        alert("Exam session not found.");

        window.location.href = "instructions.html";

        return;

    }

    // Start Time

    examStartTime = sessionStorage.getItem("examStartTime");

    // Load Questions

    await loadQuestions();

}

//==========================================
// Load Questions
//==========================================

async function loadQuestions() {

    const { data, error } = await supabaseClient

        .from("questions")

        .select("*")

        .eq("exam_id", selectedExam.id)

        .order("question_no", { ascending: true });

    if (error) {

        console.error(error);

        alert("Failed to load questions.");

        return;

    }

    questions = data;

    totalQuestion.textContent = questions.length;

    createPalette();

    displayQuestion(0);

}

