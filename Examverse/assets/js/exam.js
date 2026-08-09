/* ==========================================
   ExamVerse CBT Engine
   Created by Subhajit Paul
========================================== */

let selectedExam = null;
let answerSavePromise = null;
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

// ==========================
// Initialize Exam
// ==========================

async function initExam() {

    // Get selected exam from localStorage
    selectedExam = JSON.parse(localStorage.getItem("selectedExam"));
    const attemptId = sessionStorage.getItem("attemptId");

if (!attemptId) {

    alert("No exam attempt found.");

    window.location.href = "instructions.html";

    return;

}

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

    document.getElementById("nextBtn")
.addEventListener("click", nextQuestion);

document.getElementById("previousBtn")
.addEventListener("click", previousQuestion);

document.getElementById("reviewBtn")
.addEventListener("click", markForReview);

document.getElementById("clearBtn")
.addEventListener("click", clearResponse);
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

// Load previously saved answers
await loadSavedAnswers();

createPalette();

showQuestion(0);

}

//==========================================
// Load Saved Answers
//==========================================

async function loadSavedAnswers() {

    const attemptId = sessionStorage.getItem("attemptId");

    if (!attemptId) return;

    const { data, error } = await supabaseClient

        .from("user_answers")

        .select("question_id, selected_option, is_review")

        .eq("attempt_id", attemptId);

    if (error) {

        console.error(error);

        return;

    }

    data.forEach(answer => {

        if (answer.selected_option) {

    answers[answer.question_id] =
    answer.selected_option;

}


           if (answer.is_review === true) {

    if (!reviewQuestions.includes(answer.question_id)) {

        reviewQuestions.push(answer.question_id);

    }

}

const index = questions.findIndex(

    q => q.id === answer.question_id

);

if (

    index !== -1 &&

    !visitedQuestions.includes(index)

) {

    visitedQuestions.push(index);

}

    });

    console.log("Loaded Answers:", answers);

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

    if (!q) return;

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

        document.querySelectorAll('input[name="option"]')
.forEach(radio=>{

    radio.onchange = saveAnswer;

});

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

       // Review (Highest Priority)
if (reviewQuestions.includes(q.id)) {

    btn.classList.remove("answered", "notAnswered");

    btn.classList.add("review");

}

// Answered
else if (answers[q.id]) {

    btn.classList.remove("notAnswered");

    btn.classList.add("answered");

}

// Visited but Not Answered
else if (visitedQuestions.includes(index)) {

    btn.classList.add("notAnswered");

}

    });

    const currentButton =
    document.getElementById(`palette${currentQuestion}`);

if (currentButton) {

    // If current question is under review,
    // keep the review color.
    if (reviewQuestions.includes(
        questions[currentQuestion].id
    )) {

        currentButton.classList.remove(
            "answered",
            "notAnswered"
        );

        currentButton.classList.add("review");

    } else {

        currentButton.classList.remove(
            "review"
        );

        currentButton.classList.add("current");

    }

}

}

// ==========================
// Navigation Buttons
// ==========================

function nextQuestion() {

    if (currentQuestion < questions.length - 1) {

        showQuestion(currentQuestion + 1);

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


function saveAnswer() {

    const selected = document.querySelector(
        'input[name="option"]:checked'
    );

    if (!selected) return;

    const question = questions[currentQuestion];

    answers[question.id] = selected.value;


    console.log("Saved:", answers);

    updatePalette();

    answerSavePromise = saveAnswerToDatabase(

    question.id,

    selected.value

);

}

// ==========================
// Save Answer To Database
// ==========================

async function saveReviewToDatabase(questionId, isReview) {

    const attemptId = sessionStorage.getItem("attemptId");

    if (!attemptId) return;

    const { data: userData } =
        await supabaseClient.auth.getUser();

    const user = userData.user;

    if (!user) return;

    const selectedOption = answers[questionId] || null;

    const { error } = await supabaseClient

        .from("user_answers")

        .upsert(
            {
                attempt_id: attemptId,
                question_id: questionId,
                user_id: user.id,
                selected_option: selectedOption,
                is_review: isReview
            },
            {
                onConflict: "attempt_id,question_id"
            }
        );

    if (error) {

        console.error(
            "Review Save Error:",
            error
        );

    } else {

        console.log(
            "Review saved:",
            questionId,
            isReview
        );

    }

}

// ==========================
// Save Review To Database
// ==========================

async function saveReviewToDatabase(questionId, isReview) {

    const attemptId = sessionStorage.getItem("attemptId");

    const { data: userData } =
    await supabaseClient.auth.getUser();

    const user = userData.user;

    // Check if row exists

    const { data: existing } = await supabaseClient

        .from("user_answers")

        .select("id")

        .eq("attempt_id", attemptId)

        .eq("question_id", questionId)

        .maybeSingle();

    if (existing) {

        // Update existing row

        await supabaseClient

            .from("user_answers")

            .update({

                is_review: isReview

            })

            .eq("id", existing.id);

    } else {

        // Create new row

        await supabaseClient

            .from("user_answers")

            .insert({

                attempt_id: attemptId,

                question_id: questionId,

                user_id: user.id,

                selected_option: null,

                is_review: isReview

            });

    }

}

//==========================================
// Clear Response
//==========================================

async function clearResponse() {

    const question = questions[currentQuestion];

    if (!question) return;

    // Remove local answer
    delete answers[question.id];

    // Remove Review
reviewQuestions = reviewQuestions.filter(

    id => id !== question.id

);

    // Uncheck radio buttons
    document
    .querySelectorAll('input[name="option"]')
    .forEach(radio => {

        radio.checked = false;

    });

    // Remove from Supabase
    const attemptId = sessionStorage.getItem("attemptId");

    const { error } = await supabaseClient

    .from("user_answers")

    .delete()

    .eq("attempt_id", attemptId)

    .eq("question_id", question.id);

    // Ensure review is removed locally
reviewQuestions = reviewQuestions.filter(
    id => id !== question.id
);

updatePalette();

if (error) {

    console.error("Delete Error:", error);

} else {

    console.log("Answer deleted successfully");

}

    updatePalette();

}

// ==========================
// Mark For Review
// ==========================

async function markForReview() {

    const question = questions[currentQuestion];

    if (!question) return;

    // Toggle Review
    const isReview = !reviewQuestions.includes(question.id);

    if (isReview) {

        reviewQuestions.push(question.id);

    } else {

        reviewQuestions = reviewQuestions.filter(

            id => id !== question.id

        );

    }

    updatePalette();

// Wait for answer save to finish first
if (answerSavePromise) {

    await answerSavePromise;

    answerSavePromise = null;

}

await saveReviewToDatabase(

        question.id,

        isReview

    );

    // Move to next question
if (currentQuestion < questions.length - 1) {

    showQuestion(currentQuestion + 1);

}

}