/* ==========================================
   ExamVerse CBT Engine
   Created by Subhajit Paul
========================================== */

let selectedExam = null;
let answerSavePromise = null;
let questions = [];
let currentQuestion = 0;

// ==========================================
// EXAM MODE / SECTIONAL STATE
// ==========================================

let examSections = [];

let isSectionalExam = false;

let currentSectionIndex = 0;

let currentSectionQuestions = [];
let currentSectionStartIndex = 0;
let currentSectionEndIndex = 0;

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
    selectedExam =
        JSON.parse(
            localStorage.getItem("selectedExam")
        );

    const attemptId =
        sessionStorage.getItem("attemptId");


    if (!attemptId) {

        alert("No exam attempt found.");

        window.location.href =
            "instructions.html";

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

        sessionStorage.removeItem(
            "attemptId"
        );

        window.location.href =
            "instructions.html";

        return;

    }


    // ==========================================
    // Prevent Reopening Completed Exam
    // ==========================================

    if (
        currentAttempt.status ===
        "Completed"
    ) {

        alert(
            "This examination has already been submitted."
        );

        return;

    }


    if (!selectedExam) {

        alert("No exam selected.");

        window.location.href =
            "exam-list.html";

        return;

    }


    // Candidate Name

    const user =
        Storage.getCurrentUser();


    if (user) {

        document.getElementById(
            "candidateName"
        ).textContent =
            user.fullName;

    }


    // Exam Title

    document.getElementById(
        "examTitle"
    ).textContent =
        selectedExam.exam_name;


    // Load Questions

    // ==========================================
// Load Questions + Detect Exam Mode
// ==========================================

await loadQuestions();


// ==========================================
// RESTORE SECTION AFTER REFRESH
// ==========================================

if (isSectionalExam) {

    const savedSection =
        sessionStorage.getItem(
            "currentSectionIndex"
        );

    if (
        savedSection !== null &&
        !isNaN(
            Number(savedSection)
        )
    ) {

        currentSectionIndex =
            Number(savedSection);

    } else {

        currentSectionIndex = 0;

    }


    console.log(
        "📌 Restored section:",
        currentSectionIndex + 1
    );


    // Rebuild correct section

    buildCurrentSection();

    createSectionNavigation();

    createPalette();


    // Start from first question
    // of restored section

    currentQuestion =
        currentSectionStartIndex;


    showQuestion(
        currentQuestion
    );


    updateSectionSubmitButton();


} else {

    console.log(
        "📘 Normal exam detected."
    );

    startExamTimer();

}


    document.getElementById(
        "nextBtn"
    )
        .addEventListener(
            "click",
            nextQuestion
        );


    document.getElementById(
        "previousBtn"
    )
        .addEventListener(
            "click",
            previousQuestion
        );


    document.getElementById(
        "reviewBtn"
    )
        .addEventListener(
            "click",
            markForReview
        );


    document.getElementById(
        "clearBtn"
    )
        .addEventListener(
            "click",
            clearResponse
        );


    document.getElementById(
        "submitBtn"
    )
        .addEventListener(
            "click",
            () => submitExam(false)
        );

}


// ==========================================
// Exam Timer
// ==========================================

function startExamTimer() {

    // Stop any previous timer

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

    }


    const timerElement =
        document.getElementById(
            "timer"
        );


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

        timerElement.textContent =
            "00:00:00";

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
        new Date(
            examStartTime
        ).getTime();


    const totalDuration =
        durationMinutes *
        60 *
        1000;


    const endTime =
        startTime +
        totalDuration;


    function updateTimer() {

        const now =
            Date.now();


        let remaining =
            endTime -
            now;


        // ==================================
        // Time Finished
        // ==================================

        if (remaining <= 0) {

            remaining = 0;


            timerElement.textContent =
                "00:00:00";


            // Automatically submit
            // the examination

            submitExam(true);


            return;

        }


        // ==================================
        // Convert milliseconds
        // ==================================

        const totalSeconds =
            Math.floor(
                remaining /
                1000
            );


        const hours =
            Math.floor(
                totalSeconds /
                3600
            );


        const minutes =
            Math.floor(
                (
                    totalSeconds %
                    3600
                ) / 60
            );


        const seconds =
            totalSeconds %
            60;


        // ==================================
        // Format HH:MM:SS
        // ==================================

        timerElement.textContent =

            String(hours)
                .padStart(2, "0")

            + ":" +

            String(minutes)
                .padStart(2, "0")

            + ":" +

            String(seconds)
                .padStart(2, "0");


        // ==================================
        // Low Time Warning
        // ==================================

        if (
            remaining <=
            5 * 60 * 1000
        ) {

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

// ==========================
// Load Questions
// ==========================

async function loadQuestions() {

    const {
        data,
        error
    } = await supabaseClient

        .from("questions")

        .select("*")

        .eq(
            "exam_id",
            selectedExam.id
        )

        .order(
            "question_no",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(error);

        alert(error.message);

        return;

    }


    questions = data || [];


    document.getElementById(
        "totalQuestion"
    ).textContent =
        questions.length;


    // ==========================================
    // LOAD PREVIOUSLY SAVED ANSWERS
    // ==========================================

    await loadSavedAnswers();

    loadVisitedQuestions();


    // ==========================================
    // DETECT EXAM MODE
    // ==========================================

    const {
        data: sections,
        error: sectionError
    } = await supabaseClient

        .from("exam_sections")

        .select(`
            id,
            section_name,
            section_order,
            question_count,
            duration_minutes
        `)

        .eq(
            "exam_id",
            selectedExam.id
        )

        .order(
            "section_order",
            {
                ascending: true
            }
        );


    // ==========================================
    // SECTION QUERY ERROR
    // ==========================================

    if (sectionError) {

        console.error(
            "Section detection error:",
            sectionError
        );

        /*
         * IMPORTANT:
         *
         * If we cannot determine whether the
         * exam is sectional, we DO NOT silently
         * treat it as sectional.
         *
         * We keep the existing normal exam
         * behavior for safety.
         */

        examSections = [];

        isSectionalExam = false;

    }

    else {

        examSections =
            sections || [];

        isSectionalExam =
            examSections.length > 0;

    }


    // ==========================================
    // DEBUG INFORMATION
    // ==========================================

    console.log(
        "=========================================="
    );

    console.log(
        "EXAM MODE DETECTION"
    );

    console.log(
        "Exam:",
        selectedExam.exam_name
    );

    console.log(
        "Exam ID:",
        selectedExam.id
    );

    console.log(
        "Total Questions:",
        questions.length
    );

    console.log(
        "Sections Found:",
        examSections.length
    );

    console.log(
        "Is Sectional:",
        isSectionalExam
    );

    console.log(
        "Sections:",
        examSections
    );

    console.log(
        "=========================================="
    );


    // ==========================================
    // EXISTING NORMAL PALETTE / QUESTION
    // ==========================================
    //
    // We intentionally keep these unchanged
    // for now.
    //
    // Section-specific palette/navigation
    // will be added in the next phase.

    if (isSectionalExam) {

    // Build Section 1
    currentSectionIndex = 0;

    buildCurrentSection();

    // Show section categories
    createSectionNavigation();

} else {

    // Normal exam
    currentSectionQuestions = [];
    currentSectionStartIndex = 0;
    currentSectionEndIndex = 0;

}

createPalette();

showQuestion(0);

}

// ==========================================
// BUILD CURRENT SECTION
// ==========================================

function buildCurrentSection() {

    if (!isSectionalExam) {
        return;
    }

    const section =
        examSections[currentSectionIndex];

    if (!section) {
        console.error(
            "Section not found:",
            currentSectionIndex
        );
        return;
    }

    // Calculate where this section starts
    currentSectionStartIndex =
        examSections
            .slice(0, currentSectionIndex)
            .reduce(
                (total, item) =>
                    total +
                    Number(
                        item.question_count || 0
                    ),
                0
            );

    const questionCount =
        Number(
            section.question_count || 0
        );

    currentSectionEndIndex =
        currentSectionStartIndex +
        questionCount -
        1;

    currentSectionQuestions =
        questions.slice(
            currentSectionStartIndex,
            currentSectionStartIndex +
            questionCount
        );

    console.log(
        "================================"
    );

    console.log(
        "CURRENT SECTION"
    );

    console.log(
        "Section:",
        section.section_name
    );

    console.log(
        "Section index:",
        currentSectionIndex
    );

    console.log(
        "Start question:",
        currentSectionStartIndex + 1
    );

    console.log(
        "End question:",
        currentSectionEndIndex + 1
    );

    console.log(
        "Questions:",
        currentSectionQuestions
    );

    console.log(
        "================================"
    );
}

// ==========================================
// HTML SAFE TEXT HELPER
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

// ==========================================
// CREATE SECTION NAVIGATION
// ==========================================

function createSectionNavigation() {

    if (!isSectionalExam) {
        return;
    }

    let navigation =
        document.getElementById(
            "sectionNavigation"
        );

    if (!navigation) {

        navigation =
            document.createElement("div");

        navigation.id =
            "sectionNavigation";

        navigation.className =
            "section-navigation";

        const questionPalette =
            document.getElementById(
                "questionPalette"
            );

        if (questionPalette) {

            questionPalette.parentNode.insertBefore(
                navigation,
                questionPalette
            );

        } else {

            console.error(
                "questionPalette not found."
            );

            return;
        }
    }

    navigation.innerHTML = "";

    examSections.forEach(
        (section, index) => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "section-tab";

            if (
                index === currentSectionIndex
            ) {

                button.classList.add(
                    "active"
                );

            }

            button.innerHTML = `

                <span>
                    ${escapeHTML(
                        section.section_name
                    )}
                </span>

                <small>
                    ${Number(
                        section.question_count || 0
                    )}
                    Questions
                </small>

            `;

            /*
             * For now, section buttons are
             * display-only.
             *
             * We will control navigation
             * properly when the sectional
             * timer is added.
             */

            navigation.appendChild(
                button
            );

        }
    );
}


// ==========================================
// Load Saved Answers
// ==========================================

// ==========================================
// Save Visited Questions
// ==========================================

function saveVisitedQuestions() {

    const attemptId =
        sessionStorage.getItem("attemptId");

    if (!attemptId) return;

    sessionStorage.setItem(
        "visitedQuestions_" + attemptId,
        JSON.stringify(visitedQuestions)
    );
}


// ==========================================
// Load Visited Questions
// ==========================================

function loadVisitedQuestions() {

    const attemptId =
        sessionStorage.getItem("attemptId");

    if (!attemptId) return;

    const saved =
        sessionStorage.getItem(
            "visitedQuestions_" + attemptId
        );

    if (!saved) return;

    try {

        const parsed =
            JSON.parse(saved);

        if (Array.isArray(parsed)) {

            visitedQuestions =
                parsed;

        }

    } catch (error) {

        console.error(
            "Visited Questions Load Error:",
            error
        );

    }
}

async function loadSavedAnswers() {

    const attemptId =
        sessionStorage.getItem(
            "attemptId"
        );


    if (!attemptId) return;


    const {
        data,
        error
    } = await supabaseClient

        .from("user_answers")

        .select(
            "question_id, selected_option, is_review"
        )

        .eq(
            "attempt_id",
            attemptId
        );


    if (error) {

        console.error(error);

        return;

    }


    data.forEach(
        answer => {


            if (
                answer.selected_option
            ) {

                answers[
                    answer.question_id
                ] =
                    answer.selected_option;

            }


            if (
                answer.is_review === true
            ) {

                if (
                    !reviewQuestions.includes(
                        answer.question_id
                    )
                ) {

                    reviewQuestions.push(
                        answer.question_id
                    );

                }

            }


            const index =
                questions.findIndex(
                    q =>
                        q.id ===
                        answer.question_id
                );


            if (
                index !== -1 &&
                !visitedQuestions.includes(
                    index
                )
            ) {

                visitedQuestions.push(
                    index
                );

            }

        }
    );


    console.log(
        "Loaded Answers:",
        answers
    );

}


// ==========================
// Display Question
// ==========================

function showQuestion(index) {

    sessionStorage.setItem(
    "currentQuestionIndex",
    String(index)
);

    // ==========================================
// SECTION ACCESS PROTECTION
// ==========================================

if (isSectionalExam) {

    const question =
        questions[index];

    if (!question) {
        return;
    }

    const allowed =
        currentSectionQuestions.some(
            q =>
                String(q.id) ===
                String(question.id)
        );

    if (!allowed) {

        console.warn(
            "Blocked question outside current section:",
            index + 1
        );

        return;
    }

}

    currentQuestion =
        index;


    // Mark visited

    if (
        !visitedQuestions.includes(
            index
        )
    ) {

        visitedQuestions.push(
            index
        );

    }

    // save visited status //

    saveVisitedQuestions();


    const q =
        questions[index];


    if (!q) return;


    document.getElementById(
        "currentQuestion"
    ).textContent =
        index + 1;


    document.getElementById(
        "questionText"
    ).textContent =
        q.question;


    document.getElementById(
        "optionA"
    ).textContent =
        q.option_a;


    document.getElementById(
        "optionB"
    ).textContent =
        q.option_b;


    document.getElementById(
        "optionC"
    ).textContent =
        q.option_c;


    document.getElementById(
        "optionD"
    ).textContent =
        q.option_d;


    document.querySelectorAll(
        'input[name="option"]'
    )
        .forEach(
            radio => {

                radio.onchange =
                    saveAnswer;

            }
        );


    // ==========================
    // Restore Selected Answer
    // ==========================

    document.querySelectorAll(
        'input[name="option"]'
    )
        .forEach(
            radio => {

                radio.checked =
                    false;

            }
        );


    if (
        answers[q.id]
    ) {

        const selected =
            document.querySelector(
                `input[name="option"][value="${answers[q.id]}"]`
            );


        if (selected) {

            selected.checked =
                true;

        }

    }


    updatePalette();


    document.getElementById(
        "previousBtn"
    ).disabled =
        currentQuestion === 0;


    document.getElementById(
        "nextBtn"
    ).disabled =
        currentQuestion ===
        questions.length - 1;

}


// ==========================
// Create Palette
// ==========================

// ==========================================
// CREATE QUESTION PALETTE
// ==========================================

function createPalette() {

    const palette =
        document.getElementById(
            "questionPalette"
        );

    if (!palette) {
        console.error(
            "questionPalette not found."
        );
        return;
    }

    palette.innerHTML = "";


    // ==========================================
    // DETERMINE QUESTIONS TO SHOW
    // ==========================================

    let paletteQuestions;

    if (isSectionalExam) {

        paletteQuestions =
            currentSectionQuestions;

    } else {

        paletteQuestions =
            questions;

    }


    // ==========================================
    // CREATE BUTTONS
    // ==========================================

    paletteQuestions.forEach(
        (question) => {

            const globalIndex =
                questions.findIndex(
                    q =>
                        String(q.id) ===
                        String(question.id)
                );

            if (globalIndex === -1) {
                return;
            }


            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.className =
                "paletteBtn";

            button.id =
                `palette${globalIndex}`;

            button.textContent =
                globalIndex + 1;


            // ==================================
            // CLICK PALETTE QUESTION
            // ==================================

            button.addEventListener(
                "click",
                () => {

                    /*
                     * Extra safety:
                     * sectional exam can only open
                     * questions belonging to the
                     * current section.
                     */

                    if (
                        isSectionalExam &&
                        !currentSectionQuestions.some(
                            q =>
                                String(q.id) ===
                                String(
                                    questions[
                                        globalIndex
                                    ].id
                                )
                        )
                    ) {

                        return;

                    }


                    showQuestion(
                        globalIndex
                    );

                }
            );


            palette.appendChild(
                button
            );

        }
    );


    updatePalette();

}

// ==========================
// Update Palette
// ==========================

// ==========================================
// UPDATE PALETTE
// SECTION-AWARE VERSION
// ==========================================

function updatePalette() {

    const paletteButtons =
        document.querySelectorAll(
            ".paletteBtn"
        );


    // ==========================================
    // WHICH QUESTIONS DOES THIS PALETTE SHOW?
    // ==========================================

    let paletteQuestions;

    if (
        typeof isSectionalExam !== "undefined" &&
        isSectionalExam
    ) {

        paletteQuestions =
            currentSectionQuestions || [];

    } else {

        paletteQuestions =
            questions || [];

    }


    // ==========================================
    // UPDATE EACH PALETTE BUTTON
    // ==========================================

    paletteButtons.forEach(
        (btn, localIndex) => {

            const q =
                paletteQuestions[
                    localIndex
                ];


            if (!q) {

                btn.className =
                    "paletteBtn";

                btn.innerHTML =
                    localIndex + 1;

                return;

            }


            // ==================================
            // QUESTION STATUS
            // ==================================

            const isAnswered =
                !!answers[q.id];


            const isReview =
                reviewQuestions.includes(
                    q.id
                );


            const globalIndex =
                questions.findIndex(
                    question =>
                        String(question.id) ===
                        String(q.id)
                );


            const isVisited =
                globalIndex !== -1 &&
                visitedQuestions.includes(
                    globalIndex
                );


            // ==================================
            // RESET BUTTON
            // ==================================

            btn.className =
                "paletteBtn";

            btn.innerHTML =
                localIndex + 1;


            // ==================================
            // MARKED FOR REVIEW
            // ==================================

            if (isReview) {

                btn.classList.add(
                    "review"
                );


                // Answered + Review
                if (isAnswered) {

                    const indicator =
                        document.createElement(
                            "span"
                        );


                    indicator.className =
                        "reviewAnsweredDot";


                    indicator.innerHTML =
                        "✓";


                    btn.appendChild(
                        indicator
                    );

                }

            }


            // ==================================
            // ANSWERED
            // ==================================

            else if (isAnswered) {

                btn.classList.add(
                    "answered"
                );

            }


            // ==================================
            // VISITED BUT NOT ANSWERED
            // ==================================

            else if (isVisited) {

                btn.classList.add(
                    "notAnswered"
                );

            }

        }
    );


    // ==========================================
    // CURRENT QUESTION
    // ==========================================

    const currentGlobalQuestion =
        currentQuestion;


    const currentLocalIndex =
        paletteQuestions.findIndex(
            q => {

                const globalIndex =
                    questions.findIndex(
                        question =>
                            String(
                                question.id
                            ) ===
                            String(q.id)
                    );

                return (
                    globalIndex ===
                    currentGlobalQuestion
                );

            }
        );


    if (
        currentLocalIndex !== -1
    ) {

        const currentButton =
            paletteButtons[
                currentLocalIndex
            ];


        const currentQuestionData =
            paletteQuestions[
                currentLocalIndex
            ];


        if (
            currentButton &&
            currentQuestionData
        ) {

            const isReview =
                reviewQuestions.includes(
                    currentQuestionData.id
                );


            /*
             * Current question gets blue.
             *
             * Review remains orange.
             */

            if (!isReview) {

                currentButton.classList.add(
                    "current"
                );

            }

        }

    }

}


// ==========================
// Navigation Buttons
// ==========================

function nextQuestion() {

    if (isSectionalExam) {

    if (
        currentQuestion >=
        currentSectionEndIndex
    ) {

        console.log(
            "Reached end of current section."
        );

        return;
    }

}

    if (
        currentQuestion <
        questions.length - 1
    ) {

        showQuestion(
            currentQuestion + 1
        );

    }

}


function previousQuestion() {

    if (isSectionalExam) {

    if (
        currentQuestion <=
        currentSectionStartIndex
    ) {

        console.log(
            "Already at beginning of current section."
        );

        return;
    }

}

    if (
        currentQuestion > 0
    ) {

        showQuestion(
            currentQuestion - 1
        );

    }

}


// ==========================
// Save Answer (Local)
// ==========================

function saveAnswer() {

    const selected =
        document.querySelector(
            'input[name="option"]:checked'
        );


    if (!selected) return;


    const question =
        questions[currentQuestion];


    answers[
        question.id
    ] =
        selected.value;


    console.log(
        "Saved:",
        answers
    );


    updatePalette();


    answerSavePromise =
        saveAnswerToDatabase(
            question.id,
            selected.value
        );

}


// ==========================
// Save Answer To Database
// ==========================

async function saveAnswerToDatabase(
    questionId,
    selectedOption
) {

    const attemptId =
        sessionStorage.getItem(
            "attemptId"
        );


    if (!attemptId) return;


    const {
        data: userData
    } =
        await supabaseClient.auth.getUser();


    const user =
        userData.user;


    if (!user) return;


    const {
        error
    } =
        await supabaseClient

            .from("user_answers")

            .upsert(
                {

                    attempt_id:
                        attemptId,

                    question_id:
                        questionId,

                    user_id:
                        user.id,

                    selected_option:
                        selectedOption,

                    // Preserve current
                    // review status

                    is_review:
                        reviewQuestions.includes(
                            questionId
                        )

                },

                {

                    onConflict:
                        "attempt_id,question_id"

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

async function saveReviewToDatabase(
    questionId,
    isReview
) {

    const attemptId =
        sessionStorage.getItem(
            "attemptId"
        );


    const {
        data: userData
    } =
        await supabaseClient.auth.getUser();


    const user =
        userData.user;


    // Check if row exists

    const {
        data: existing
    } =
        await supabaseClient

            .from("user_answers")

            .select("id")

            .eq(
                "attempt_id",
                attemptId
            )

            .eq(
                "question_id",
                questionId
            )

            .maybeSingle();


    if (existing) {

        // Update existing row

        await supabaseClient

            .from("user_answers")

            .update({

                is_review:
                    isReview

            })

            .eq(
                "id",
                existing.id
            );

    } else {

        // Create new row

        await supabaseClient

            .from("user_answers")

            .insert({

                attempt_id:
                    attemptId,

                question_id:
                    questionId,

                user_id:
                    user.id,

                selected_option:
                    null,

                is_review:
                    isReview

            });

    }

}


// ==========================================
// Clear Response
// ==========================================

async function clearResponse() {

    const question =
        questions[currentQuestion];


    if (!question) return;


    // Remove local answer

    delete answers[
        question.id
    ];


    // Remove Review

    reviewQuestions =
        reviewQuestions.filter(
            id =>
                id !==
                question.id
        );


    // Uncheck radio buttons

    document
        .querySelectorAll(
            'input[name="option"]'
        )
        .forEach(
            radio => {

                radio.checked =
                    false;

            }
        );


    // Remove from Supabase

    const attemptId =
        sessionStorage.getItem(
            "attemptId"
        );


    const {
        error
    } =
        await supabaseClient

            .from("user_answers")

            .delete()

            .eq(
                "attempt_id",
                attemptId
            )

            .eq(
                "question_id",
                question.id
            );


    // Ensure review is removed locally

    reviewQuestions =
        reviewQuestions.filter(
            id =>
                id !==
                question.id
        );


    updatePalette();


    if (error) {

        console.error(
            "Delete Error:",
            error
        );

    } else {

        console.log(
            "Answer deleted successfully"
        );

    }


    updatePalette();

}


// ==========================
// Mark For Review
// ==========================

async function markForReview() {

    const question =
        questions[currentQuestion];


    if (!question) return;


    // Always mark as review

    if (
        !reviewQuestions.includes(
            question.id
        )
    ) {

        reviewQuestions.push(
            question.id
        );

    }


    updatePalette();


    // Wait for answer save
    // to finish first

    if (answerSavePromise) {

        await answerSavePromise;

        answerSavePromise =
            null;

    }


    // Save review status TRUE

    await saveReviewToDatabase(
        question.id,
        true
    );


    // Move to next question

    if (
        currentQuestion <
        questions.length - 1
    ) {

        showQuestion(
            currentQuestion + 1
        );

    }

}


// ==========================================
// Submit Exam
// ==========================================

// ==========================================
// SUBMIT EXAM / SUBMIT SECTION
// ==========================================

async function submitExam(
    autoSubmit = false
) {

    // ==========================================
    // SECTIONAL EXAM
    // ==========================================

    if (isSectionalExam) {

        await submitCurrentSection(
            autoSubmit
        );

        return;
    }


    // ==========================================
    // NORMAL EXAM
    // ==========================================

    const totalQuestions =
        questions.length;


    const answeredQuestions =
        Object.keys(
            answers
        ).length;


    const unansweredQuestions =
        totalQuestions -
        answeredQuestions;


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
            window.confirm(
                message
            );


        if (!confirmed) {

            return;

        }

    }


    // ------------------------------------------
    // Stop normal exam timer
    // ------------------------------------------

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;

    }


    // ------------------------------------------
    // Disable controls
    // ------------------------------------------

    document
        .querySelectorAll(
            ".navigation button, .paletteBtn, #submitBtn"
        )
        .forEach(
            button => {

                button.disabled =
                    true;

            }
        );


    // ------------------------------------------
    // Finalize NORMAL exam
    // ------------------------------------------

    const finalized =
        await finalizeExamAttempt(
            autoSubmit
        );


    if (!finalized) {

        return;

    }


    window.location.replace(
        "result.html"
    );

}


// ==========================================
// SUBMIT CURRENT SECTION
// ==========================================

// ==========================================
// SUBMIT EXAM / SUBMIT SECTION
// ==========================================

async function submitExam(autoSubmit = false) {

    // ==========================================
    // SECTIONAL EXAM
    // ==========================================

    if (isSectionalExam) {

        await submitCurrentSection(autoSubmit);

        return;
    }


    // ==========================================
    // NORMAL EXAM — EXISTING BEHAVIOR
    // ==========================================

    const totalQuestions =
        questions.length;

    const answeredQuestions =
        Object.keys(answers).length;

    const unansweredQuestions =
        totalQuestions - answeredQuestions;

    const reviewCount =
        reviewQuestions.length;


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


    if (timerInterval) {

        clearInterval(timerInterval);

        timerInterval = null;

    }


    document
        .querySelectorAll(
            ".navigation button, .paletteBtn, #submitBtn"
        )
        .forEach(button => {

            button.disabled = true;

        });


    const finalized =
        await finalizeExamAttempt(autoSubmit);


    if (!finalized) {
        return;
    }


    window.location.replace(
        "result.html"
    );

}

// ==========================================
// SUBMIT CURRENT SECTION
// ==========================================

async function submitCurrentSection(autoSubmit = false) {

    if (!isSectionalExam) {
        return;
    }


    const section =
        examSections[currentSectionIndex];


    if (!section) {

        console.error(
            "Current section not found."
        );

        return;

    }


    const start =
        currentSectionStartIndex;

    const end =
        currentSectionEndIndex;


    const sectionQuestions =
        questions.slice(
            start,
            end + 1
        );


    const sectionQuestionIds =
        sectionQuestions.map(
            question =>
                String(question.id)
        );


    const answeredCount =
        sectionQuestionIds.filter(
            id =>
                answers[id] !== undefined &&
                answers[id] !== null &&
                String(answers[id]).trim() !== ""
        ).length;


    const totalSectionQuestions =
        sectionQuestionIds.length;


    const unansweredCount =
        totalSectionQuestions -
        answeredCount;


    const isLastSection =
        currentSectionIndex >=
        examSections.length - 1;


    // ==========================================
    // CONFIRM SECTION SUBMISSION
    // ==========================================

    if (!autoSubmit) {

        let message;

        if (isLastSection) {

            message =
                "SUBMIT EXAMINATION?\n\n" +

                "Section: " +
                section.section_name +

                "\nQuestions: " +
                totalSectionQuestions +

                "\nAnswered: " +
                answeredCount +

                "\nUnanswered: " +
                unansweredCount +

                "\n\nThis is the LAST section." +
                "\nSubmitting will finish the examination." +

                "\n\nAre you sure?";

        } else {

            message =
                "SUBMIT SECTION?\n\n" +

                "Section: " +
                section.section_name +

                "\nQuestions: " +
                totalSectionQuestions +

                "\nAnswered: " +
                answeredCount +

                "\nUnanswered: " +
                unansweredCount +

                "\n\nYou cannot return to this section " +
                "after submitting it." +

                "\n\nContinue to the next section?";

        }


        const confirmed =
            window.confirm(message);


        if (!confirmed) {

            return;

        }

    }


    // ==========================================
    // STOP SECTION TIMER
    // ==========================================

    if (
        typeof sectionTimerInterval !== "undefined" &&
        sectionTimerInterval
    ) {

        clearInterval(
            sectionTimerInterval
        );

        sectionTimerInterval = null;

    }


    // ==========================================
    // LAST SECTION
    // ==========================================

    if (isLastSection) {

        document
            .querySelectorAll(
                ".navigation button, .paletteBtn, #submitBtn"
            )
            .forEach(button => {

                button.disabled = true;

            });


        const finalized =
            await finalizeExamAttempt(
                autoSubmit
            );


        if (!finalized) {

            return;

        }


        window.location.replace(
            "result.html"
        );

        return;
    }


    // ==========================================
    // MOVE TO NEXT SECTION
    // ==========================================

    currentSectionIndex++;

sessionStorage.setItem(
    "currentSectionIndex",
    String(currentSectionIndex)
);


    buildCurrentSection();


    createSectionNavigation();


    createPalette();


    let savedQuestion =
    Number(
        sessionStorage.getItem(
            "currentQuestionIndex"
        )
    );

if (
    !Number.isInteger(savedQuestion) ||
    savedQuestion <
        currentSectionStartIndex ||
    savedQuestion >
        currentSectionEndIndex
) {

    savedQuestion =
        currentSectionStartIndex;
}

currentQuestion =
    savedQuestion;

showQuestion(
    currentQuestion
);


    updateSectionSubmitButton();


    console.log(
        "➡️ NEXT SECTION:",
        examSections[
            currentSectionIndex
        ].section_name
    );

}

// ==========================================
// UPDATE SECTION SUBMIT BUTTON
// ==========================================

// ==========================================
// UPDATE SUBMIT BUTTON
// ==========================================

function updateSectionSubmitButton() {

    const submitBtn =
        document.getElementById(
            "submitBtn"
        );

    if (!submitBtn) {
        return;
    }


    if (!isSectionalExam) {

        submitBtn.textContent =
            "Submit Exam";

        return;

    }


    const isLastSection =
        currentSectionIndex >=
        examSections.length - 1;


    if (isLastSection) {

        submitBtn.textContent =
            "Submit Exam";

    } else {

        submitBtn.textContent =
            "Submit Section & Next";

    }

}

// ==========================================
// FINALIZE EXAM ATTEMPT
// ==========================================

async function finalizeExamAttempt(
    autoSubmit = false
) {

    try {


        console.log(
            "Finalizing exam attempt..."
        );


        // ==========================================
        // Get Attempt ID
        // ==========================================

        const attemptId =
            sessionStorage.getItem(
                "attemptId"
            );


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


        if (
            userError ||
            !userData.user
        ) {

            console.error(
                userError
            );

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

            console.error(
                questionError
            );

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

            console.error(
                answerError
            );

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

        let positiveMarks = 0;

        let negativeMarks = 0;


        // ==========================================
        // Calculate Result
        // ==========================================

        questionData.forEach(
            question => {


                const userAnswer =
                    userAnswers.find(
                        answer =>
                            answer.question_id ===
                            question.id
                    );


                // ----------------------------------
                // No answer
                // ----------------------------------

                if (
                    !userAnswer ||
                    !userAnswer.selected_option
                ) {

                    skipped++;

                    return;

                }


                attempted++;


                // ----------------------------------
                // Correct answer
                // ----------------------------------

                if (
                    userAnswer.selected_option ===
                    question.correct_answer
                ) {

                    correct++;


                    const marks =
                        Number(
                            question.marks || 0
                        );


                    positiveMarks +=
                        marks;


                    score +=
                        marks;

                }


                // ----------------------------------
                // Wrong answer
                // ----------------------------------

                else {

                    wrong++;


                    /*
                     * IMPORTANT:
                     *
                     * negative_marks may be stored
                     * in Supabase as either:
                     *
                     * 0.25
                     *
                     * OR
                     *
                     * -0.25
                     *
                     * Math.abs() makes both work.
                     */

                    const negative =
                        Math.abs(
                            Number(
                                question.negative_marks ||
                                0
                            )
                        );


                    negativeMarks +=
                        negative;


                    score -=
                        negative;

                }

            }
        );


        // ==========================================
        // Round Score
        // ==========================================

        score =
            Number(
                score.toFixed(2)
            );


        positiveMarks =
            Number(
                positiveMarks.toFixed(2)
            );


        negativeMarks =
            Number(
                negativeMarks.toFixed(2)
            );


        // ==========================================
        // Percentage
        // ==========================================

        let percentage = 0;


        if (
            questionData.length > 0
        ) {

            const totalMarks =
                questionData.reduce(
                    (
                        total,
                        question
                    ) =>
                        total +
                        Number(
                            question.marks ||
                            0
                        ),
                    0
                );


            if (
                totalMarks > 0
            ) {

                percentage =
                    Number(
                        (
                            (
                                score /
                                totalMarks
                            ) * 100
                        ).toFixed(2)
                    );

            }

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

        let result =
            "Completed";


        if (
            selectedExam.passing_marks !==
                null &&

            selectedExam.passing_marks !==
                undefined
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
                        new Date()
                            .toISOString(),

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
                        new Date()
                            .toISOString(),

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
                positiveMarks,
                negativeMarks,
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