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

    previousBtn.addEventListener(

    "click",

    previousQuestion

);

nextBtn.addEventListener(

    "click",

    nextQuestion

);

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

    //==========================================
// Create Question Palette
//==========================================

function createQuestionPalette() {

    questionPalette.innerHTML = "";

    questions.forEach((question, index) => {

        const button = document.createElement("button");

        button.className = "paletteBtn";

        button.id = `palette${index}`;

        button.textContent = index + 1;

        button.addEventListener("click", () => {

            displayQuestion(index);

        });

        questionPalette.appendChild(button);

    });

}

//==========================================
// Update Palette
//==========================================

function updatePalette() {

    document

    .querySelectorAll(".paletteBtn")

    .forEach((button, index) => {

        button.className = "paletteBtn";

        if (visitedQuestions.includes(index)) {

            button.classList.add("notAnswered");

        }

        const question = questions[index];

        if (question && answers[question.id]) {

            button.classList.remove("notAnswered");

            button.classList.add("answered");

        }

    });

    const current =

    document.getElementById(

        `palette${currentQuestionIndex}`

    );

    if (current) {

        current.classList.remove(

            "answered",

            "notAnswered"

        );

        current.classList.add("current");

    }

}

    questions = data;

    totalQuestion.textContent = questions.length;

    createQuestionPalette();

displayQuestion(0);

}

//==========================================
// Display - Question
//==========================================

function displayQuestion(index) {

    currentQuestionIndex = index;

    const question = questions[index];

    if (!question) return;

    // Current Question Number

    currentQuestion.textContent = index + 1;

    // Question

    questionText.textContent = question.question;

    // Options

    optionA.textContent = question.option_a;

    optionB.textContent = question.option_b;

    optionC.textContent = question.option_c;

    optionD.textContent = question.option_d;

    // Clear Previous Selection

    document.querySelectorAll('input[name="option"]')

    .forEach(radio => {

        radio.checked = false;

    });

    // Restore Answer

    if (answers[question.id]) {

        const radio = document.querySelector(

            `input[name="option"][value="${answers[question.id]}"]`

        );

        if (radio) {

            radio.checked = true;

        }

    }

    updateNavigation();

    updatePalette();

}

//==========================================
// Navigation Buttons
//==========================================

function updateNavigation(){

    previousBtn.disabled =

    currentQuestionIndex === 0;

    nextBtn.disabled =

    currentQuestionIndex === questions.length - 1;

}

//==========================================
// Previous
//==========================================

function previousQuestion(){

    if(currentQuestionIndex>0){

        displayQuestion(

            currentQuestionIndex-1

        );

    }

}

//==========================================
// Next
//==========================================

function nextQuestion(){

    if(currentQuestionIndex<questions.length-1){

        displayQuestion(

            currentQuestionIndex+1

        );

    }

}