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

// ==========================================
// Check Attempt Status
// ==========================================

const {
    data: currentAttempt,
    error: attemptError
} = await supabaseClient

    .from("exam_attempts")

    .select("status")

    .eq("id", attemptId)

    .maybeSingle();


if (attemptError) {

    console.error(
        "Attempt status error:",
        attemptError
    );

    return;

}


if (!currentAttempt) {

    alert("Exam attempt not found.");

    sessionStorage.removeItem("attemptId");

    window.location.href = "instructions.html";

    return;

}


// ==========================================
// Prevent Reopening Completed Exam
// ==========================================

if (currentAttempt.status === "Completed") {

    alert(
        "This examination has already been submitted."
    );

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

// Start exam timer
startExamTimer();

document.getElementById("nextBtn")
    .addEventListener("click", nextQuestion);

document.getElementById("previousBtn")
.addEventListener("click", previousQuestion);

document.getElementById("reviewBtn")
.addEventListener("click", markForReview);

document.getElementById("clearBtn")
.addEventListener("click", clearResponse);

document.getElementById("submitBtn")
    .addEventListener("click", () => submitExam(false));

}

// ==========================================
// Exam Timer
// ==========================================

function startExamTimer() {

    // Stop any previous timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    const timerElement =
        document.getElementById("timer");

    if (!timerElement) return;


    // Get exam duration
    const durationMinutes =
        Number(
            selectedExam.duration_minutes ||
            selectedExam.duration ||
            0
        );


    if (!durationMinutes) {

        console.error(
            "Exam duration not found."
        );

        timerElement.textContent = "00:00:00";

        return;
    }


    // Get original exam start time
    const examStartTime =
        sessionStorage.getItem(
            "examStartTime"
        );


    if (!examStartTime) {

        console.error(
            "Exam start time not found."
        );

        return;
    }


    const startTime =
        new Date(examStartTime).getTime();


    const totalDuration =
        durationMinutes * 60 * 1000;


    const endTime =
        startTime + totalDuration;


    function updateTimer() {

        const now =
            Date.now();

        let remaining =
            endTime - now;


        // ==================================
        // Time Finished
        // ==================================

        if (remaining <= 0) {

    remaining = 0;

    timerElement.textContent =
        "00:00:00";


    // Automatically submit the examination
    submitExam(true);


    return;
}


        // ==================================
        // Convert milliseconds
        // ==================================

        const totalSeconds =
            Math.floor(
                remaining / 1000
            );


        const hours =
            Math.floor(
                totalSeconds / 3600
            );


        const minutes =
            Math.floor(
                (totalSeconds % 3600) / 60
            );


        const seconds =
            totalSeconds % 60;


        // ==================================
        // Format HH:MM:SS
        // ==================================

        timerElement.textContent =

            String(hours).padStart(2, "0")
            + ":" +
            String(minutes).padStart(2, "0")
            + ":" +
            String(seconds).padStart(2, "0");


        // ==================================
        // Low Time Warning
        // ==================================

        if (remaining <= 5 * 60 * 1000) {

            timerElement.classList.add(
                "timer-warning"
            );

        } else {

            timerElement.classList.remove(
                "timer-warning"
            );

        }

    }


    // Update immediately
    updateTimer();


    // Update every second
    timerInterval =
        setInterval(
            updateTimer,
            1000
        );

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

async function saveAnswerToDatabase(questionId, selectedOption) {

    const attemptId =
        sessionStorage.getItem("attemptId");

    if (!attemptId) return;

    const { data: userData } =
        await supabaseClient.auth.getUser();

    const user = userData.user;

    if (!user) return;

    const { error } = await supabaseClient

        .from("user_answers")

        .upsert(
    {
        attempt_id: attemptId,
        question_id: questionId,
        user_id: user.id,
        selected_option: selectedOption,

        // Preserve current review status
        is_review:
            reviewQuestions.includes(questionId)
    },
    {
        onConflict: "attempt_id,question_id"
    }
);

    if (error) {

        console.error(
            "Answer Save Error:",
            error
        );

    } else {

        console.log(
            "Answer saved to Supabase:",
            questionId,
            selectedOption
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

    // Always mark as review
    if (!reviewQuestions.includes(question.id)) {

        reviewQuestions.push(question.id);

    }

    updatePalette();

    // Wait for answer save to finish first
    if (answerSavePromise) {

        await answerSavePromise;

        answerSavePromise = null;

    }

    // Save review status as TRUE
    await saveReviewToDatabase(

        question.id,

        true

    );

    // Move to next question
    if (currentQuestion < questions.length - 1) {

        showQuestion(currentQuestion + 1);

    }

}

// ==========================================
// Submit Exam
// ==========================================

// ==========================================
// Submit Exam
// ==========================================

async function submitExam(autoSubmit = false) {

    // ------------------------------------------
    // Calculate current exam status
    // ------------------------------------------

    const totalQuestions = questions.length;

    const answeredQuestions =
        Object.keys(answers).length;

    const unansweredQuestions =
        totalQuestions - answeredQuestions;

    const reviewCount =
        reviewQuestions.length;


    // ------------------------------------------
    // Manual submission confirmation
    // ------------------------------------------

    if (!autoSubmit) {

        const message =

            "SUBMIT EXAMINATION?\n\n" +

            "Total Questions: " +
            totalQuestions +

            "\nAnswered: " +
            answeredQuestions +

            "\nUnanswered: " +
            unansweredQuestions +

            "\nMarked for Review: " +
            reviewCount +

            "\n\nAre you sure you want to submit your examination?";


        const confirmed =
            window.confirm(message);


        if (!confirmed) {

            return;

        }

    }


    // ------------------------------------------
    // Stop Timer
    // ------------------------------------------

    if (timerInterval) {

        clearInterval(timerInterval);

        timerInterval = null;

    }


    // ------------------------------------------
    // Disable Examination Controls
    // ------------------------------------------

    document
        .querySelectorAll(
            ".navigation button, .paletteBtn, #submitBtn"
        )
        .forEach(button => {

            button.disabled = true;

        });


   

    // ==========================================
// Finalize Exam in Database
// ==========================================

const finalized =
    await finalizeExamAttempt(autoSubmit);

if (!finalized) {

    return;

}

window.location.href = "result.html";

}

// ==========================================
// FINALIZE EXAM ATTEMPT
// ==========================================

async function finalizeExamAttempt(autoSubmit = false) {

    try {

        console.log("Finalizing exam attempt...");


        // ==========================================
        // Get Attempt ID
        // ==========================================

        const attemptId =
            sessionStorage.getItem("attemptId");


        if (!attemptId) {

            alert(
                "Exam attempt not found."
            );

            return false;

        }


        // ==========================================
        // Get Current User
        // ==========================================

        const {
            data: userData,
            error: userError
        } =
            await supabaseClient.auth.getUser();


        if (userError || !userData.user) {

            console.error(userError);

            alert(
                "User session expired. Please login again."
            );

            return false;

        }


        // ==========================================
        // Get Questions
        // ==========================================

        const {
            data: questionData,
            error: questionError
        } =
            await supabaseClient

                .from("questions")

                .select(
                    "id, correct_answer, marks, negative_marks"
                )

                .eq(
                    "exam_id",
                    selectedExam.id
                );


        if (questionError) {

            console.error(questionError);

            alert(
                "Unable to load question answers."
            );

            return false;

        }


        // ==========================================
        // Get User Answers
        // ==========================================

        const {
            data: userAnswers,
            error: answerError
        } =
            await supabaseClient

                .from("user_answers")

                .select(
                    "id, question_id, selected_option"
                )

                .eq(
                    "attempt_id",
                    attemptId
                );


        if (answerError) {

            console.error(answerError);

            alert(
                "Unable to load your answers."
            );

            return false;

        }


        // ==========================================
        // Result Counters
        // ==========================================

        let attempted = 0;

        let correct = 0;

        let wrong = 0;

        let skipped = 0;

        let score = 0;


        // ==========================================
        // Calculate Result
        // ==========================================

        questionData.forEach(question => {

            const userAnswer =
                userAnswers.find(
                    answer =>
                        answer.question_id === question.id
                );


            // No answer
            if (
                !userAnswer ||
                !userAnswer.selected_option
            ) {

                skipped++;

                return;

            }


            attempted++;


            // Correct answer
            if (
                userAnswer.selected_option ===
                question.correct_answer
            ) {

                correct++;


                score +=
                    Number(question.marks || 0);

            }


            // Wrong answer
            else {

                wrong++;


                score -=
                    Number(
                        question.negative_marks || 0
                    );

            }

        });


        // ==========================================
        // Prevent Negative Score Display
        // ==========================================

        score =
            Number(score.toFixed(2));


        // ==========================================
        // Percentage
        // ==========================================

        let percentage = 0;


        if (
            questionData.length > 0
        ) {

            percentage =
                Number(
                    (
                        (score /
                        questionData.reduce(
                            (total, question) =>
                                total +
                                Number(
                                    question.marks || 0
                                ),
                            0
                        )
                        ) * 100
                    ).toFixed(2)
                );

        }


        // ==========================================
        // Time Taken
        // ==========================================

        const startTime =
            sessionStorage.getItem(
                "examStartTime"
            );


        let timeTaken = 0;


        if (startTime) {

            timeTaken =
                Math.floor(
                    (
                        Date.now() -
                        new Date(
                            startTime
                        ).getTime()
                    ) / 1000
                );

        }


        // ==========================================
        // Result Status
        // ==========================================

        let result = "Completed";


        if (
            selectedExam.passing_marks !== null &&
            selectedExam.passing_marks !== undefined
        ) {

            result =
                score >=
                Number(
                    selectedExam.passing_marks
                )
                    ? "Pass"
                    : "Fail";

        }


        // ==========================================
        // Update Exam Attempt
        // ==========================================

        const {
    data: updatedAttempt,
    error: updateError
} =
    await supabaseClient

        .from("exam_attempts")

        .update({

            end_time:
                new Date().toISOString(),

            attempted:
                attempted,

            correct:
                correct,

            wrong:
                wrong,

            skipped:
                skipped,

            score:
                score,

            percentage:
                percentage,

            result:
                result,

            status:
                "Completed",

            submitted_at:
                new Date().toISOString(),

            time_taken:
                timeTaken

        })

        .eq(
            "id",
            attemptId
        )

        .select()
        .single();


console.log(
    "UPDATED ATTEMPT:",
    updatedAttempt
);


        if (updateError) {

            console.error(
                "Attempt update error:",
                updateError
            );

            alert(
                "Unable to save exam result."
            );

            return false;

        }


        // ==========================================
        // Success
        // ==========================================

        console.log(
            "Exam attempt finalized successfully:",
            {
                attempted,
                correct,
                wrong,
                skipped,
                score,
                percentage,
                result,
                timeTaken
            }
        );


        return true;

    }

    catch (error) {

        console.error(
            "Finalization error:",
            error
        );

        alert(
            "Something went wrong while submitting the exam."
        );

        return false;

    }

}