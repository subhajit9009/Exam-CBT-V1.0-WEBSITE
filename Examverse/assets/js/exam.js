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

// ==========================================
// SECTIONAL TIMER
// ==========================================

let sectionTimerInterval = null;


// ==========================
// Page Load
// ==========================

window.addEventListener("DOMContentLoaded", initExam);


// ==========================
// Initialize Exam
// ==========================

async function initExam() {

    // ==========================================
// GET SELECTED EXAM
// ==========================================

const selectedExamId =
    sessionStorage.getItem("selectedExam");

if (!selectedExamId) {

    alert("No exam selected.");

    window.location.href =
        "exam-list.html";

    return;
}


// ==========================================
// LOAD EXAM DETAILS FROM SUPABASE
// ==========================================

const {
    data: examData,
    error: examError
} = await supabaseClient

    .from("exams")

    .select("*")

    .eq("id", selectedExamId)

    .single();


if (examError || !examData) {

    console.error(
        "Selected exam loading error:",
        examError
    );

    alert(
        "Unable to load the selected examination."
    );

    window.location.href =
        "exam-list.html";

    return;
}


// Store complete exam object

selectedExam = examData;


console.log(
    "✅ Selected Exam Loaded:",
    selectedExam
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

// ==========================================
// RESTORE / INITIALIZE EXAM POSITION
// ==========================================

const freshAttempt =
    sessionStorage.getItem(
        "attemptStartedFresh"
    ) === "true";


if (isSectionalExam) {

    // ==========================================
    // NEW ATTEMPT
    // ==========================================

    if (freshAttempt) {

        console.log(
            "🆕 NEW ATTEMPT — STARTING FROM SECTION 1"
        );

        currentSectionIndex = 0;

        currentQuestion = 0;

        sessionStorage.setItem(
            "currentSectionIndex",
            "0"
        );

        sessionStorage.setItem(
            "currentQuestionIndex",
            "0"
        );

        // Consume the fresh-attempt flag
        sessionStorage.removeItem(
            "attemptStartedFresh"
        );

    }

    // ==========================================
    // EXISTING ATTEMPT / REFRESH
    // ==========================================

    else {

        const savedSection =
            sessionStorage.getItem(
                "currentSectionIndex"
            );

        if (
            savedSection !== null &&
            Number.isInteger(
                Number(savedSection)
            )
        ) {

            currentSectionIndex =
                Number(savedSection);

        } else {

            currentSectionIndex = 0;

        }

    }


    console.log(
        "📌 Current Section:",
        currentSectionIndex + 1
    );


    // ==========================================
    // BUILD CURRENT SECTION
    // ==========================================

    buildCurrentSection();

    createSectionNavigation();

    createPalette();


    // ==========================================
    // QUESTION POSITION
    // ==========================================

    let savedQuestion =
        Number(
            sessionStorage.getItem(
                "currentQuestionIndex"
            )
        );


    if (
        freshAttempt ||
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


    sessionStorage.setItem(
        "currentQuestionIndex",
        String(currentQuestion)
    );


    showQuestion(
    currentQuestion
);

updateSectionSubmitButton();

// Start / restore current section timer
startSectionTimer();


} else {

    console.log(
        "📘 Normal exam detected."
    );

    // ==========================================
    // NEW NORMAL EXAM
    // ==========================================

    if (freshAttempt) {

        console.log(
            "🆕 NEW NORMAL ATTEMPT — STARTING FROM Q1"
        );

        currentQuestion = 0;

        sessionStorage.setItem(
            "currentQuestionIndex",
            "0"
        );

        // Consume fresh-attempt flag
        sessionStorage.removeItem(
            "attemptStartedFresh"
        );

    }

    // ==========================================
    // EXISTING NORMAL EXAM / REFRESH
    // ==========================================

    else {

        const savedQuestion =
            Number(
                sessionStorage.getItem(
                    "currentQuestionIndex"
                )
            );

        if (
            Number.isInteger(savedQuestion) &&
            savedQuestion >= 0 &&
            savedQuestion < questions.length
        ) {

            currentQuestion =
                savedQuestion;

        } else {

            currentQuestion = 0;

        }

    }

    console.log(
        "📌 Restored normal question:",
        currentQuestion + 1
    );

    showQuestion(
        currentQuestion
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

// ==========================================
// START SECTION TIMER
// ==========================================

function startSectionTimer() {

    // ------------------------------------------
    // Safety
    // ------------------------------------------

    if (!isSectionalExam) {
        return;
    }

    const timerElement =
        document.getElementById("timer");

    if (!timerElement) {
        console.error(
            "Timer element not found."
        );
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


    const durationMinutes =
        Number(
            section.duration_minutes || 0
        );


    if (!durationMinutes) {

        console.error(
            "Section duration not found:",
            section
        );

        timerElement.textContent =
            "00:00:00";

        return;
    }


    // ------------------------------------------
    // Stop previous section timer
    // ------------------------------------------

    if (sectionTimerInterval) {

        clearInterval(
            sectionTimerInterval
        );

        sectionTimerInterval = null;

    }


    // ------------------------------------------
    // Unique storage key for this section
    // ------------------------------------------

    const attemptId =
        sessionStorage.getItem(
            "attemptId"
        );

    if (!attemptId) {
        return;
    }


    const timerKey =
        "sectionTimerStart_" +
        attemptId +
        "_" +
        currentSectionIndex;


    // ------------------------------------------
    // Restore existing section timer
    // OR start a new one
    // ------------------------------------------

    let sectionStartTime =
        sessionStorage.getItem(
            timerKey
        );


    if (!sectionStartTime) {

        sectionStartTime =
            new Date().toISOString();

        sessionStorage.setItem(
            timerKey,
            sectionStartTime
        );

    }


    const startTime =
        new Date(
            sectionStartTime
        ).getTime();


    const totalDuration =
        durationMinutes *
        60 *
        1000;


    const endTime =
        startTime +
        totalDuration;


    // ------------------------------------------
    // Update timer
    // ------------------------------------------

    function updateSectionTimer() {

        const now =
            Date.now();


        let remaining =
            endTime -
            now;


        // --------------------------------------
        // Time finished
        // --------------------------------------

        if (remaining <= 0) {

            remaining = 0;


            timerElement.textContent =
                "00:00:00";


            if (sectionTimerInterval) {

                clearInterval(
                    sectionTimerInterval
                );

                sectionTimerInterval =
                    null;

            }


            // Prevent duplicate submission
            const lockKey =
                "sectionTimerSubmitted_" +
                attemptId +
                "_" +
                currentSectionIndex;


            if (
                sessionStorage.getItem(
                    lockKey
                ) === "true"
            ) {

                return;

            }


            sessionStorage.setItem(
                lockKey,
                "true"
            );


            // Automatically submit
            // current section

            submitCurrentSection(
                true
            );

            return;

        }


        // --------------------------------------
        // Convert milliseconds
        // --------------------------------------

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
                (
                    totalSeconds % 3600
                ) / 60
            );


        const seconds =
            totalSeconds % 60;


        timerElement.textContent =

            String(hours)
                .padStart(2, "0")

            + ":" +

            String(minutes)
                .padStart(2, "0")

            + ":" +

            String(seconds)
                .padStart(2, "0");


        // --------------------------------------
        // Warning
        // --------------------------------------

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


    // ------------------------------------------
    // Immediate update
    // ------------------------------------------

    updateSectionTimer();


    // ------------------------------------------
    // Update every second
    // ------------------------------------------

    sectionTimerInterval =
        setInterval(
            updateSectionTimer,
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

    // Section/question state is controlled by initExam().
    // Do NOT reset currentSectionIndex here.

    buildCurrentSection();

    createSectionNavigation();

} else {

    // Normal exam
    currentSectionQuestions = [];
    currentSectionStartIndex = 0;
    currentSectionEndIndex = 0;

}

createPalette();

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


// ==========================================
// AUTO-SCROLL ACTIVE SECTION
// ==========================================

const activeSection =
    navigation.querySelector(
        ".section-tab.active"
    );

if (activeSection) {

    requestAnimationFrame(() => {

        const navRect =
            navigation.getBoundingClientRect();

        const activeRect =
            activeSection.getBoundingClientRect();

        // ======================================
        // ACTIVE SECTION IS TOO FAR LEFT
        // ======================================

        if (
            activeRect.left <
            navRect.left
        ) {

            navigation.scrollLeft -=
                navRect.left -
                activeRect.left +
                20;

        }


        // ======================================
        // ACTIVE SECTION IS TOO FAR RIGHT
        // ======================================

        else if (
            activeRect.right >
            navRect.right
        ) {

            navigation.scrollLeft +=
                activeRect.right -
                navRect.right +
                20;

        }

    });

}

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

if (isSectionalExam) {

    sessionStorage.setItem(
        "currentSectionIndex",
        String(currentSectionIndex)
    );

}

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


    // ==========================================
// NAVIGATION BUTTON STATE
// ==========================================

// ==========================================
// NAVIGATION BUTTON STATE
// ==========================================

const previousBtn =
    document.getElementById("previousBtn");

const nextBtn =
    document.getElementById("nextBtn");


// ==========================================
// PREVIOUS BUTTON
// ==========================================

if (previousBtn) {

    if (isSectionalExam) {

        previousBtn.disabled =
            currentQuestion <=
            currentSectionStartIndex;

    } else {

        previousBtn.disabled =
            currentQuestion === 0;

    }

}


// ==========================================
// NEXT / SUBMIT BUTTON
// ==========================================

// IMPORTANT:
// Never disable the Next button on the
// final question.
// At the final question it will perform
// the appropriate submit action.

if (nextBtn) {

    nextBtn.disabled = false;

}

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

function updatePalette(shouldScroll = true) {

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

    // ==========================================
// CURRENT QUESTION
// ==========================================

// ==========================================
// CURRENT QUESTION
// ==========================================

const currentLocalIndex =
    paletteQuestions.findIndex(
        q => {

            const globalIndex =
                questions.findIndex(
                    question =>
                        String(question.id) ===
                        String(q.id)
                );

            return (
                globalIndex ===
                currentQuestion
            );

        }
    );


// ==========================================
// HIGHLIGHT + AUTO-SCROLL CURRENT QUESTION
// ==========================================

if (
    shouldScroll &&
    currentLocalIndex >= 0 &&
    currentLocalIndex < paletteButtons.length
) {

    const currentButton =
        paletteButtons[
            currentLocalIndex
        ];


    if (currentButton) {

        // --------------------------------------
        // Always mark current question
        // --------------------------------------

        currentButton.classList.add(
            "current"
        );


        // --------------------------------------
        // Make current question visible
        // --------------------------------------

       // ==========================================
// SMART PALETTE AUTO-SCROLL
// Keeps current question comfortably visible
// and works in BOTH directions
// ==========================================

const paletteContainer =
    document.getElementById("questionPalette");

if (
    paletteContainer &&
    shouldScroll
) {

    requestAnimationFrame(() => {

        const containerRect =
            paletteContainer.getBoundingClientRect();

        const buttonRect =
            currentButton.getBoundingClientRect();

        const containerHeight =
            paletteContainer.clientHeight;

        // ======================================
        // SAFE VISIBLE ZONE
        // ======================================
        //
        // We don't wait until the button
        // completely disappears.
        //
        // Top  = 25% of palette
        // Bottom = 75% of palette
        //
        // This makes upward and downward
        // scrolling feel much smoother.
        // ======================================

        const safeTop =
            containerRect.top +
            containerHeight * 0.25;

        const safeBottom =
            containerRect.top +
            containerHeight * 0.75;


        // ======================================
        // CURRENT QUESTION TOO HIGH
        // ======================================

        if (
            buttonRect.top <
            safeTop
        ) {

            const target =
                currentButton.offsetTop -
                containerHeight * 0.35;

            paletteContainer.scrollTo({

                top: Math.max(
                    0,
                    target
                ),

                behavior: "smooth"

            });

        }


        // ======================================
        // CURRENT QUESTION TOO LOW
        // ======================================

        else if (
            buttonRect.bottom >
            safeBottom
        ) {

            const target =
                currentButton.offsetTop -
                containerHeight * 0.65;

            const maxScroll =
                paletteContainer.scrollHeight -
                paletteContainer.clientHeight;

            paletteContainer.scrollTo({

                top: Math.min(
                    maxScroll,
                    Math.max(
                        0,
                        target
                    )
                ),

                behavior: "smooth"

            });

        }

    });

}

    }

}

}

// ==========================
// Navigation Buttons
// ==========================

// ==========================================
// NEXT QUESTION
// ==========================================

// ==========================================
// NEXT QUESTION
// ==========================================

function nextQuestion() {

    // ==========================================
    // SECTIONAL EXAM
    // ==========================================

    if (isSectionalExam) {

        // --------------------------------------
        // Last question of current section
        // --------------------------------------
        if (
            currentQuestion >=
            currentSectionEndIndex
        ) {

            console.log(
                "End of section reached. Returning to section Q1."
            );


            // Go back to FIRST question
            // of the CURRENT section.
            showQuestion(
                currentSectionStartIndex
            );

            return;
        }


        // --------------------------------------
        // Normal next question
        // --------------------------------------

        showQuestion(
            currentQuestion + 1
        );

        return;
    }


    // ==========================================
    // NORMAL EXAM
    // ==========================================

    // ------------------------------------------
    // Last question of entire exam
    // ------------------------------------------

    if (
        currentQuestion >=
        questions.length - 1
    ) {

        console.log(
            "End of exam reached. Returning to Q1."
        );


        // Go back to Question 1
        showQuestion(0);

        return;
    }


    // ------------------------------------------
    // Normal next question
    // ------------------------------------------

    showQuestion(
        currentQuestion + 1
    );
}

function previousQuestion() {

    // ==========================================
    // SECTIONAL EXAM
    // ==========================================

    if (isSectionalExam) {

        if (
            currentQuestion <=
            currentSectionStartIndex
        ) {

            console.log(
                "Beginning of current section."
            );

            return;

        }

    }


    // ==========================================
    // NORMAL EXAM
    // ==========================================

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


    // ==========================================
    // MARK CURRENT QUESTION FOR REVIEW
    // ==========================================

    if (
        !reviewQuestions.includes(
            question.id
        )
    ) {

        reviewQuestions.push(
            question.id
        );

    }


    // ==========================================
    // UPDATE PALETTE
    // ==========================================

    updatePalette();


    // ==========================================
    // WAIT FOR ANSWER SAVE
    // ==========================================

    if (answerSavePromise) {

        await answerSavePromise;

        answerSavePromise = null;

    }


    // ==========================================
    // SAVE REVIEW STATUS
    // ==========================================

    await saveReviewToDatabase(
        question.id,
        true
    );


    // ==========================================
    // MOVE TO NEXT QUESTION
    // ==========================================

    nextQuestion();

}

// ==========================================
// Submit Exam
// ==========================================

// ==========================================
// SUBMIT EXAM / SUBMIT SECTION
// ==========================================


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

    // ==========================================
// MOVE TO NEXT SECTION
// ==========================================

currentSectionIndex++;

sessionStorage.setItem(
    "currentSectionIndex",
    String(currentSectionIndex)
);


// ------------------------------------------
// Build new section
// ------------------------------------------

buildCurrentSection();


// ------------------------------------------
// Update section navigation
// ------------------------------------------

createSectionNavigation();


// ------------------------------------------
// Create NEW section palette
// ------------------------------------------

createPalette();


// ------------------------------------------
// Start at FIRST question of new section
// ------------------------------------------

currentQuestion =
    currentSectionStartIndex;

sessionStorage.setItem(
    "currentQuestionIndex",
    String(currentQuestion)
);


// ------------------------------------------
// Display first question
// ------------------------------------------

showQuestion(
    currentQuestion
);


// ------------------------------------------
// Update submit button
// ------------------------------------------

updateSectionSubmitButton();


// ------------------------------------------
// Start NEW section timer
// ------------------------------------------

startSectionTimer();


console.log(
    "➡️ NEXT SECTION:",
    examSections[
        currentSectionIndex
    ].section_name
);


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

// ==========================================
// UPDATE SUBMIT BUTTONS
// Desktop + Mobile
// ==========================================

function updateSectionSubmitButton() {

    const submitBtn =
        document.getElementById("submitBtn");

    const mobileSubmitBtn =
        document.getElementById(
            "mobileActionSubmit"
        );


    // ------------------------------------------
    // Safety check
    // ------------------------------------------

    if (!submitBtn && !mobileSubmitBtn) {
        return;
    }


    // ------------------------------------------
    // NORMAL EXAM
    // ------------------------------------------

    if (!isSectionalExam) {

        if (submitBtn) {
            submitBtn.textContent =
                "Submit Exam";
        }

        if (mobileSubmitBtn) {
            mobileSubmitBtn.innerHTML =
                "✓ Submit Exam";
        }

        return;
    }


    // ------------------------------------------
    // SECTIONAL EXAM
    // ------------------------------------------

    const isLastSection =
        currentSectionIndex >=
        examSections.length - 1;


    // ------------------------------------------
    // LAST SECTION
    // ------------------------------------------

    if (isLastSection) {

        if (submitBtn) {
            submitBtn.textContent =
                "Submit Exam";
        }

        if (mobileSubmitBtn) {
            mobileSubmitBtn.innerHTML =
                "✓ Submit Exam";
        }

    }


    // ------------------------------------------
    // NOT LAST SECTION
    // ------------------------------------------

    else {

        if (submitBtn) {
            submitBtn.textContent =
                "Submit Section & Next";
        }

        if (mobileSubmitBtn) {
            mobileSubmitBtn.innerHTML =
                "✓ Submit Section & Next";
        }

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

// =========================================================
// MOBILE QUESTION PALETTE
// =========================================================

function setupMobilePalette() {

    const palette =
        document.querySelector(".palette");

    const openButton =
        document.getElementById(
            "mobilePaletteToggle"
        );

    const closeButton =
        document.getElementById(
            "mobilePaletteClose"
        );


    if (
        !palette ||
        !openButton ||
        !closeButton
    ) {

        console.warn(
            "Mobile palette elements not found."
        );

        return;
    }


    // -----------------------------------------
    // OPEN PALETTE
    // -----------------------------------------

    openButton.addEventListener(
        "click",
        () => {

            palette.classList.add(
                "mobilePaletteOpen"
            );

            document.body.classList.add(
                "mobile-palette-active"
            );


            // Always start palette at the
            // appropriate/current question
            requestAnimationFrame(() => {

                updatePalette();

            });

        }
    );


    // -----------------------------------------
    // CLOSE PALETTE
    // -----------------------------------------

    closeButton.addEventListener(
        "click",
        () => {

            palette.classList.remove(
                "mobilePaletteOpen"
            );

            document.body.classList.remove(
                "mobile-palette-active"
            );

        }
    );

}


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    setupMobilePalette
);

/* =========================================================
   EXAMVERSE MOBILE CBT ACTION BAR
========================================================= */

(function createMobileActionBar() {

    function initMobileActionBar() {

        /* -----------------------------------------
           Prevent duplicate creation
        ----------------------------------------- */

        if (
            document.getElementById(
                "mobileExamActionBar"
            )
        ) {
            return;
        }


        /* -----------------------------------------
           Create action bar
        ----------------------------------------- */

        const bar =
            document.createElement("div");

        bar.id =
            "mobileExamActionBar";


        /* -----------------------------------------
           Palette button
        ----------------------------------------- */

        const paletteButton =
            document.createElement("button");

        paletteButton.type =
            "button";

        paletteButton.id =
            "mobileActionPalette";

        paletteButton.innerHTML =
            "☰ Palette";


        /* -----------------------------------------
           Submit button
        ----------------------------------------- */

        const submitButton =
            document.createElement("button");

        submitButton.type =
            "button";

        submitButton.id =
            "mobileActionSubmit";

        submitButton.innerHTML =
            "✓ Submit Exam";


        /* -----------------------------------------
           Add buttons
        ----------------------------------------- */

        bar.appendChild(
            paletteButton
        );

        bar.appendChild(
            submitButton
        );


        document.body.appendChild(
            bar
        );


        /* =========================================
           PALETTE BUTTON
        ========================================= */

        paletteButton.onclick =
            function () {

                const original =
                    document.getElementById(
                        "mobilePaletteToggle"
                    );

                if (original) {

                    original.click();

                }

            };


        /* =========================================
           SUBMIT BUTTON
        ========================================= */

        submitButton.onclick =
            function () {

                const original =
                    document.getElementById(
                        "submitBtn"
                    );

                if (original) {

                    original.click();

                }

            };

    }


    /* =========================================
       INITIALIZE
    ========================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initMobileActionBar
        );

    } else {

        initMobileActionBar();

    }

})();