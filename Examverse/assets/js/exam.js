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

let currentAttemptState = null;

let normalTimerEndTime = null;

let sectionTimerEndTime = null;

let resumeSectionRemainingTimes = {};

let pauseOperationInProgress = false;

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
    // AUTHENTICATION CHECK
    // ==========================================

    const {
        data: authData,
        error: authError
    } = await supabaseClient.auth.getUser();


    if (
        authError ||
        !authData ||
        !authData.user
    ) {

        alert(
            "Please login to access the examination."
        );

        window.location.replace(
            "login.html"
        );

        return;
    }

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


    // ==========================================
// VERIFY ACTIVE EXAM ATTEMPT
// ==========================================

const attemptId =
    sessionStorage.getItem("attemptId");

if (!attemptId) {

    console.warn(
        "⚠️ No active exam attempt. Returning to Exam List."
    );

    // DO NOT show an error.
    // DO NOT go to Instructions.
    // DO NOT load the CBT.

    window.location.replace(
        "exam-list.html"
    );

    return;
}


    // ==========================================
    // Check Attempt Status
    // ==========================================

   // ==========================================
// CHECK ATTEMPT STATUS
// ==========================================

const {
    data: currentAttempt,
    error: attemptError
} = await supabaseClient

    .from("exam_attempts")

    .select(`
        id,
        exam_id,
        user_id,
        status,
        remaining_time_seconds,
        current_question_index,
        current_section_index,
        progress_state,
        paused_at
    `)

    .eq("id", attemptId)

    .maybeSingle();


// ==========================================
// ATTEMPT ERROR
// ==========================================

if (attemptError) {

    console.error(
        "Attempt verification error:",
        attemptError
    );

    // Remove stale session data
    sessionStorage.removeItem(
        "attemptId"
    );

    sessionStorage.removeItem(
        "examStartTime"
    );

    sessionStorage.removeItem(
        "attemptStartedFresh"
    );

    // NEVER go to instructions
    window.location.replace(
        "exam-list.html"
    );

    return;
}


// ==========================================
// ATTEMPT DOES NOT EXIST
// ==========================================

if (!currentAttempt) {

    console.warn(
        "⚠️ Attempt not found. Returning to Exam List."
    );

    // Clear stale attempt information
    sessionStorage.removeItem(
        "attemptId"
    );

    sessionStorage.removeItem(
        "examStartTime"
    );

    sessionStorage.removeItem(
        "attemptStartedFresh"
    );

    sessionStorage.removeItem(
        "currentQuestionIndex"
    );

    sessionStorage.removeItem(
        "currentSectionIndex"
    );

    sessionStorage.removeItem(
        "examActiveStartedAt"
    );

    // IMPORTANT:
    // Do NOT go to instructions.html
    // Do NOT load the CBT

    window.location.replace(
        "exam-list.html"
    );

    return;
}


// ==========================================
// VERIFY ATTEMPT BELONGS TO THIS EXAM
// ==========================================

if (
    String(currentAttempt.exam_id) !==
    String(selectedExamId)
) {

    console.warn(
        "⚠️ Attempt belongs to another exam."
    );

    sessionStorage.removeItem(
        "attemptId"
    );

    sessionStorage.removeItem(
        "examStartTime"
    );

    sessionStorage.removeItem(
        "attemptStartedFresh"
    );

    sessionStorage.removeItem(
        "currentQuestionIndex"
    );

    sessionStorage.removeItem(
        "currentSectionIndex"
    );

    sessionStorage.removeItem(
        "examActiveStartedAt"
    );

    window.location.replace(
        "exam-list.html"
    );

    return;
}


// ==========================================
// VERIFY ATTEMPT BELONGS TO LOGGED USER
// ==========================================

if (
    String(currentAttempt.user_id) !==
    String(authData.user.id)
) {

    console.warn(
        "🚫 Attempt does not belong to logged-in user."
    );

    sessionStorage.removeItem(
        "attemptId"
    );

    sessionStorage.removeItem(
        "examStartTime"
    );

    sessionStorage.removeItem(
        "attemptStartedFresh"
    );

    sessionStorage.removeItem(
        "currentQuestionIndex"
    );

    sessionStorage.removeItem(
        "currentSectionIndex"
    );

    sessionStorage.removeItem(
        "examActiveStartedAt"
    );

    window.location.replace(
        "exam-list.html"
    );

    return;
}


    if (attemptError) {

        console.error(
            "Attempt status error:",
            attemptError
        );

        return;

    }


    // ==========================================
// PAUSE / RESUME RESTORATION
// ==========================================

currentAttemptState = currentAttempt;

const isPausedAttempt =
    currentAttempt.status === "Paused";


// ------------------------------------------
// PAUSED ATTEMPT
// ------------------------------------------

if (isPausedAttempt) {

    console.log(
        "↻ Resuming paused attempt:",
        attemptId
    );


    // --------------------------------------
    // Restore question
    // --------------------------------------

    if (
        Number.isInteger(
            Number(
                currentAttempt.current_question_index
            )
        )
    ) {

        sessionStorage.setItem(
            "currentQuestionIndex",
            String(
                currentAttempt.current_question_index
            )
        );

    }


    // --------------------------------------
    // Restore section
    // --------------------------------------

    if (
        Number.isInteger(
            Number(
                currentAttempt.current_section_index
            )
        )
    ) {

        sessionStorage.setItem(
            "currentSectionIndex",
            String(
                currentAttempt.current_section_index
            )
        );

    }


    // --------------------------------------
    // Restore progress state
    // --------------------------------------

    const savedProgress =
        currentAttempt.progress_state || {};


    resumeSectionRemainingTimes =
        savedProgress.sectionRemainingTimes || {};


   // --------------------------------------
// Restore active-time tracking
// --------------------------------------

// Do NOT start active-time tracking from
// the moment the resume page begins loading.
//
// It will be started after the CBT is ready.

sessionStorage.removeItem(
    "examActiveStartedAt"
);


    // --------------------------------------
    // NORMAL EXAM TIMER RESTORATION
    // --------------------------------------

    // --------------------------------------
// NORMAL EXAM TIMER RESTORATION
// --------------------------------------

if (
    !isSectionalExam &&
    currentAttempt.remaining_time_seconds !== null &&
    currentAttempt.remaining_time_seconds !== undefined
) {

    const durationMinutes =
        Number(
            selectedExam.duration_minutes ||
            selectedExam.duration ||
            0
        );


    const totalSeconds =
        durationMinutes * 60;


    const remainingSeconds =
        Math.max(
            0,
            Number(
                currentAttempt.remaining_time_seconds
            )
        );


    // ----------------------------------
    // Rebuild the start time
    //
    // This makes the timer continue
    // from the saved remaining time.
    // ----------------------------------

    const elapsedSeconds =
        Math.max(
            0,
            totalSeconds -
            remainingSeconds
        );


    const restoredStart =
        Date.now() -
        (
            elapsedSeconds *
            1000
        );


    sessionStorage.setItem(
        "examStartTime",
        new Date(
            restoredStart
        ).toISOString()
    );


    // ----------------------------------
    // Store remaining time explicitly
    // ----------------------------------

    sessionStorage.setItem(
        "resumeRemainingTime",
        String(
            remainingSeconds
        )
    );

}

    // --------------------------------------
    // Mark attempt as active again
    // --------------------------------------

    const {
        error: resumeError
    } = await supabaseClient

        .from("exam_attempts")

        .update({
            status: "In Progress",
            paused_at: null
        })

        .eq(
            "id",
            attemptId
        );


    if (resumeError) {

        console.error(
            "Resume Error:",
            resumeError
        );

        alert(
            "Unable to resume this examination."
        );

        return;
    }


    currentAttemptState.status =
        "In Progress";

}


   // ==========================================
// PREVENT REOPENING COMPLETED EXAM
// ==========================================

if (
    currentAttempt.status ===
    "Completed"
) {

    console.warn(
        "🚫 Completed examination attempt."
    );


    // ======================================
    // STOP NORMAL EXAM TIMER
    // ======================================

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;

    }


    // ======================================
    // STOP SECTION TIMER
    // ======================================

    if (sectionTimerInterval) {

        clearInterval(
            sectionTimerInterval
        );

        sectionTimerInterval = null;

    }


    // ======================================
    // KEEP CBT LOCKED
    // ======================================

    document.body.classList.remove(
        "exam-ready"
    );

    document.body.classList.add(
        "exam-loading"
    );


    // ======================================
    // RETURN TO RESULT PAGE
    // ======================================

    window.location.replace(
        "result.html"
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


// ==========================================
// NOW CREATE THE PALETTE
// ==========================================

createPalette();


showQuestion(
    currentQuestion
);

updateSectionSubmitButton();

// Start / restore current section timer
startSectionTimer();


// ==========================================
// EXAM VALIDATED + READY
// ==========================================

document.body.classList.remove(
    "exam-loading"
);

document.body.classList.add(
    "exam-ready"
);


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


// ==========================================
// CREATE PALETTE AFTER QUESTION IS RESTORED
// ==========================================

createPalette();


showQuestion(
    currentQuestion
);

// ==========================================
// OFFICIAL EXAM START TIME
// ==========================================
// For a brand-new attempt, start the timer
// only after the CBT/questions are ready.
//
// For refresh/resume, an existing start time
// is preserved.

if (
    !sessionStorage.getItem(
        "examStartTime"
    )
) {

    const officialStartTime =
        new Date().toISOString();


    sessionStorage.setItem(
        "examStartTime",
        officialStartTime
    );


    console.log(
        "🕐 Official exam timer started:",
        officialStartTime
    );

}


// ==========================================
// ACTIVE EXAM TIME TRACKING
// ==========================================

if (
    !sessionStorage.getItem(
        "examActiveStartedAt"
    )
) {

    const existingStart =
        sessionStorage.getItem(
            "examStartTime"
        );

    sessionStorage.setItem(
        "examActiveStartedAt",
        existingStart ||
        new Date().toISOString()
    );
}


// ==========================================
// START / RESTORE NORMAL EXAM TIMER
// ==========================================

startExamTimer();

// ==========================================
// EXAM VALIDATED + READY
// ==========================================

document.body.classList.remove(
    "exam-loading"
);

document.body.classList.add(
    "exam-ready"
);

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

        // ==========================================
// PAUSE EXAM BUTTON
// ==========================================

const pauseBtn =
    document.getElementById(
        "pauseBtn"
    );

if (pauseBtn) {

    pauseBtn.addEventListener(
        "click",
        () => {

            if (
                typeof window.pauseExam ===
                "function"
            ) {

                window.pauseExam();

            } else {

                console.error(
                    "pauseExam() function is not available."
                );

                alert(
                    "Pause system is not loaded. Please refresh the page."
                );

            }

        }
    );

}

}


// ==========================================
// Exam Timer
// ==========================================

function startExamTimer() {

    // ==========================================
    // STOP PREVIOUS TIMER
    // ==========================================

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;

    }


    const timerElement =
        document.getElementById(
            "timer"
        );


    if (!timerElement) return;


    // ==========================================
    // GET EXAM DURATION
    // ==========================================

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


    const totalDuration =
        durationMinutes *
        60 *
        1000;


    // ==========================================
    // GET EXAM START TIME
    // ==========================================

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


    // ==========================================
    // SET TIMER END TIME
    // ==========================================

    normalTimerEndTime =
        startTime +
        totalDuration;


    // ==========================================
    // UPDATE TIMER
    // ==========================================

    function updateTimer() {

        const now =
            Date.now();


        let remaining =
            normalTimerEndTime -
            now;


        // ======================================
        // TIME FINISHED
        // ======================================

        if (remaining <= 0) {

            remaining = 0;


            timerElement.textContent =
                "00:00:00";


            if (timerInterval) {

                clearInterval(
                    timerInterval
                );

                timerInterval =
                    null;
            }


            // Automatically submit
            // the examination

            submitExam(true);

            return;

        }


        // ======================================
        // CONVERT MILLISECONDS
        // ======================================

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


        // ======================================
        // FORMAT HH:MM:SS
        // ======================================

        timerElement.textContent =

            String(hours)
                .padStart(2, "0")

            + ":" +

            String(minutes)
                .padStart(2, "0")

            + ":" +

            String(seconds)
                .padStart(2, "0");


        // ======================================
        // LOW TIME WARNING
        // ======================================

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


    // ==========================================
    // UPDATE IMMEDIATELY
    // ==========================================

    updateTimer();


    // ==========================================
    // UPDATE EVERY SECOND
    // ==========================================

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
        document.getElementById(
            "timer"
        );


    if (!timerElement) {

        console.error(
            "Timer element not found."
        );

        return;
    }


    const section =
        examSections[
            currentSectionIndex
        ];


    if (!section) {

        console.error(
            "Current section not found."
        );

        return;
    }


    const durationMinutes =
        Number(
            section.duration_minutes ||
            0
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

        sectionTimerInterval =
            null;

    }


    // ------------------------------------------
    // Attempt ID
    // ------------------------------------------

    const attemptId =
        sessionStorage.getItem(
            "attemptId"
        );


    if (!attemptId) {
        return;
    }


    // ------------------------------------------
    // Unique storage key
    // ------------------------------------------

    const timerKey =
        "sectionTimerStart_" +
        attemptId +
        "_" +
        currentSectionIndex;


    // ------------------------------------------
    // Total section duration
    // ------------------------------------------

    const totalDuration =
        durationMinutes *
        60 *
        1000;


    let sectionStartTime;


    // ==========================================
    // CHECK FOR PAUSED/RESUMED TIME
    // ==========================================

    const savedRemainingTimes =
        resumeSectionRemainingTimes || {};


    const savedRemaining =
        savedRemainingTimes[
            String(
                currentSectionIndex
            )
        ];


    // ==========================================
    // RESUME FROM SAVED TIME
    // ==========================================

    if (
        savedRemaining !== undefined &&
        savedRemaining !== null
    ) {

        const remainingMilliseconds =
            Number(
                savedRemaining
            ) * 1000;


        sectionStartTime =
            Date.now() -
            (
                totalDuration -
                remainingMilliseconds
            );


        sessionStorage.setItem(
            timerKey,
            new Date(
                sectionStartTime
            ).toISOString()
        );


        // We have consumed this saved value.
        delete
        resumeSectionRemainingTimes[
            String(
                currentSectionIndex
            )
        ];

    }


    // ==========================================
    // NORMAL START / PAGE REFRESH
    // ==========================================

    else {

        const savedStart =
            sessionStorage.getItem(
                timerKey
            );


        if (savedStart) {

            sectionStartTime =
                new Date(
                    savedStart
                ).getTime();

        } else {

            sectionStartTime =
                Date.now();


            sessionStorage.setItem(
                timerKey,
                new Date(
                    sectionStartTime
                ).toISOString()
            );

        }

    }


    // ==========================================
    // SAVE END TIME GLOBALLY
    // ==========================================

    sectionTimerEndTime =
        sectionStartTime +
        totalDuration;


    // ==========================================
    // UPDATE SECTION TIMER
    // ==========================================

    function updateSectionTimer() {

        const now =
            Date.now();


        let remaining =
            sectionTimerEndTime -
            now;


        // ======================================
        // TIME FINISHED
        // ======================================

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


            // ----------------------------------
            // Prevent duplicate submission
            // ----------------------------------

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


            // ----------------------------------
            // Automatically submit section
            // ----------------------------------

            submitCurrentSection(
                true
            );


            return;

        }


        // ======================================
        // CONVERT TIME
        // ======================================

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


        // ======================================
        // DISPLAY HH:MM:SS
        // ======================================

        timerElement.textContent =

            String(hours)
                .padStart(
                    2,
                    "0"
                )

            + ":" +

            String(minutes)
                .padStart(
                    2,
                    "0"
                )

            + ":" +

            String(seconds)
                .padStart(
                    2,
                    "0"
                );


        // ======================================
        // LOW TIME WARNING
        // ======================================

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


    // ==========================================
    // UPDATE IMMEDIATELY
    // ==========================================

    updateSectionTimer();


    // ==========================================
    // UPDATE EVERY SECOND
    // ==========================================

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

    // IMPORTANT:
    // Every time the palette is rebuilt,
    // start from the top.

    palette.innerHTML = "";
    palette.scrollTop = 0;

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
    isSectionalExam
        ? paletteQuestions.indexOf(question) + 1
        : globalIndex + 1;


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

// ==========================================
// UPDATE QUESTION PALETTE
// SECTION-AWARE + STABLE AUTO-SCROLL
// ==========================================

function updatePalette(
    shouldScroll = true
) {

    const paletteContainer =
        document.getElementById(
            "questionPalette"
        );


    if (!paletteContainer) {

        console.warn(
            "questionPalette not found."
        );

        return;

    }


    const paletteButtons =
        Array.from(
            paletteContainer.querySelectorAll(
                ".paletteBtn"
            )
        );


    // ==========================================
    // DETERMINE QUESTIONS SHOWN IN PALETTE
    // ==========================================

    let paletteQuestions;


    if (
        typeof isSectionalExam !==
        "undefined" &&
        isSectionalExam
    ) {

        paletteQuestions =
            currentSectionQuestions || [];

    }

    else {

        paletteQuestions =
            questions || [];

    }


    // ==========================================
    // UPDATE QUESTION STATUS
    // ==========================================

    paletteButtons.forEach(
        (
            button,
            localIndex
        ) => {

            const question =
                paletteQuestions[
                    localIndex
                ];


            if (!question) {

                button.className =
                    "paletteBtn";

                button.textContent =
                    localIndex + 1;

                return;

            }


            // ======================================
            // QUESTION STATUS
            // ======================================

            const isAnswered =
                !!answers[
                    question.id
                ];


            const isReview =
                reviewQuestions.includes(
                    question.id
                );


            const globalIndex =
                questions.findIndex(
                    item =>
                        String(item.id) ===
                        String(question.id)
                );


            const isVisited =
                globalIndex !== -1 &&
                visitedQuestions.includes(
                    globalIndex
                );


            // ======================================
            // RESET BUTTON
            // ======================================

            button.className =
                "paletteBtn";


            button.innerHTML =
                localIndex + 1;


            // ======================================
            // MARKED FOR REVIEW
            // ======================================

            if (isReview) {

                button.classList.add(
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


                    button.appendChild(
                        indicator
                    );

                }

            }


            // ======================================
            // ANSWERED
            // ======================================

            else if (isAnswered) {

                button.classList.add(
                    "answered"
                );

            }


            // ======================================
            // VISITED BUT NOT ANSWERED
            // ======================================

            else if (isVisited) {

                button.classList.add(
                    "notAnswered"
                );

            }

        }
    );


    // ==========================================
    // FIND CURRENT QUESTION
    // ==========================================

    const currentLocalIndex =
        paletteQuestions.findIndex(
            question => {

                const globalIndex =
                    questions.findIndex(
                        item =>
                            String(item.id) ===
                            String(question.id)
                    );


                return (
                    globalIndex ===
                    currentQuestion
                );

            }
        );


    // ==========================================
    // CURRENT QUESTION DOES NOT EXIST
    // ==========================================

    if (
        currentLocalIndex < 0 ||
        currentLocalIndex >=
            paletteButtons.length
    ) {

        return;

    }


    const currentButton =
        paletteButtons[
            currentLocalIndex
        ];


    if (!currentButton) {

        return;

    }


    // ==========================================
    // HIGHLIGHT CURRENT QUESTION
    // ==========================================

    currentButton.classList.add(
        "current"
    );


    // ==========================================
    // STOP HERE IF AUTO-SCROLL IS NOT REQUESTED
    // ==========================================

    if (!shouldScroll) {

        return;

    }


    // ==========================================
    // WAIT UNTIL BROWSER HAS FINISHED LAYOUT
    // ==========================================

    requestAnimationFrame(
        () => {


            if (
                !currentButton.isConnected ||
                !paletteContainer.isConnected
            ) {

                return;

            }


            // ======================================
            // FIND CURRENT ROW
            // ======================================

           // ==========================================
// ROBUST CURRENT ROW AUTO-SCROLL
// ==========================================

// Find the actual visual position of the
// current button and its entire row.

const currentButtonRect =
    currentButton.getBoundingClientRect();

const paletteRect =
    paletteContainer.getBoundingClientRect();


// ==========================================
// FIND ALL BUTTONS IN CURRENT ROW
// ==========================================

const currentRowButtons =
    paletteButtons.filter(button => {

        const rect =
            button.getBoundingClientRect();

        // Small tolerance is important because
        // browser layout can produce fractional
        // pixel values.

        return Math.abs(
            rect.top -
            currentButtonRect.top
        ) < 2;

    });


if (
    currentRowButtons.length === 0
) {

    return;

}


// ==========================================
// CALCULATE ACTUAL ROW BOUNDARIES
// ==========================================

let rowTop =
    Infinity;

let rowBottom =
    -Infinity;


currentRowButtons.forEach(
    button => {

        const rect =
            button.getBoundingClientRect();

        rowTop =
            Math.min(
                rowTop,
                rect.top
            );

        rowBottom =
            Math.max(
                rowBottom,
                rect.bottom
            );

    }
);


// ==========================================
// PALETTE VISIBLE AREA
// ==========================================

const paletteTop =
    paletteRect.top;

const paletteBottom =
    paletteRect.bottom;


// ==========================================
// SAFE ZONE
// ==========================================

// Keep the current row away from the
// extreme top and bottom edges.

const safeTop =
    paletteTop +
    20;

const safeBottom =
    paletteBottom -
    20;


// ==========================================
// CURRENT ROW IS TOO HIGH
// ==========================================

if (
    rowTop <
    safeTop
) {

    const distance =
        safeTop -
        rowTop;


    paletteContainer.scrollTop =
        Math.max(
            0,
            paletteContainer.scrollTop -
            distance
        );


    return;

}


// ==========================================
// CURRENT ROW IS TOO LOW
// ==========================================

if (
    rowBottom >
    safeBottom
) {

    const distance =
        rowBottom -
        safeBottom;


    const maxScrollTop =
        paletteContainer.scrollHeight -
        paletteContainer.clientHeight;


    paletteContainer.scrollTop =
        Math.min(
            maxScrollTop,
            paletteContainer.scrollTop +
            distance
        );


    return;

}


// ==========================================
// CURRENT ROW IS ALREADY IN SAFE ZONE
// ==========================================

// Do nothing.
        }
    );

}

// ==========================
// Navigation Buttons
// ==========================


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

// pause //

window.pauseExam = async function pauseExam() {

    // --------------------------------------
    // Prevent double-click
    // --------------------------------------

    if (pauseOperationInProgress) {
        return;
    }


    // --------------------------------------
    // Get attempt ID
    // --------------------------------------

    const attemptId =
        sessionStorage.getItem(
            "attemptId"
        );


    if (!attemptId) {

        alert(
            "Exam attempt not found."
        );

        return;
    }


    // --------------------------------------
    // Confirmation
    // --------------------------------------

    const confirmed =
        window.confirm(
            "PAUSE EXAMINATION?\n\n" +
            "Your answers and progress will be saved.\n\n" +
            "The examination timer will stop.\n\n" +
            "You can resume this examination later."
        );


    if (!confirmed) {
        return;
    }


    pauseOperationInProgress =
        true;


    const pauseBtn =
        document.getElementById(
            "pauseBtn"
        );


    if (pauseBtn) {

        pauseBtn.disabled =
            true;

        pauseBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }


    try {

        // ==================================
        // WAIT FOR LAST ANSWER SAVE
        // ==================================

        if (answerSavePromise) {

            await answerSavePromise;

            answerSavePromise =
                null;
        }


        // ==================================
        // NORMAL EXAM TIMER
        // ==================================

        let remainingSeconds =
            null;


        if (
            !isSectionalExam &&
            normalTimerEndTime
        ) {

            remainingSeconds =
                Math.max(
                    0,
                    Math.ceil(
                        (
                            normalTimerEndTime -
                            Date.now()
                        ) / 1000
                    )
                );


            if (timerInterval) {

                clearInterval(
                    timerInterval
                );

                timerInterval =
                    null;
            }
        }


        // ==================================
        // SECTIONAL EXAM TIMER
        // ==================================

        const progressState =
            currentAttemptState &&
            currentAttemptState.progress_state
                ? {
                    ...currentAttemptState.progress_state
                }
                : {};


        const sectionRemainingTimes =
            {
                ...(progressState.sectionRemainingTimes || {})
            };


        if (
            isSectionalExam &&
            sectionTimerEndTime
        ) {

            const sectionRemaining =
                Math.max(
                    0,
                    Math.ceil(
                        (
                            sectionTimerEndTime -
                            Date.now()
                        ) / 1000
                    )
                );


            sectionRemainingTimes[
                String(
                    currentSectionIndex
                )
            ] =
                sectionRemaining;


            remainingSeconds =
                sectionRemaining;


            if (sectionTimerInterval) {

                clearInterval(
                    sectionTimerInterval
                );

                sectionTimerInterval =
                    null;
            }
        }


        // ==================================
        // ACTIVE TIME
        // ==================================

        let activeTimeSeconds =
            Number(
                progressState.activeTimeSeconds ||
                0
            );


        const activeStartedAt =
            sessionStorage.getItem(
                "examActiveStartedAt"
            );


        if (activeStartedAt) {

            const activeSeconds =
                Math.max(
                    0,
                    Math.floor(
                        (
                            Date.now() -
                            new Date(
                                activeStartedAt
                            ).getTime()
                        ) / 1000
                    )
                );


            activeTimeSeconds +=
                activeSeconds;
        }


        // ==================================
        // SAVE PROGRESS STATE
        // ==================================

        progressState.activeTimeSeconds =
            activeTimeSeconds;


        progressState.sectionRemainingTimes =
            sectionRemainingTimes;


        progressState.visitedQuestions =
            Array.isArray(
                visitedQuestions
            )
                ? visitedQuestions
                : [];


        progressState.reviewQuestions =
            Array.isArray(
                reviewQuestions
            )
                ? reviewQuestions
                : [];


        // ==================================
        // SAVE TO SUPABASE
        // ==================================

        const {
            error
        } =
            await supabaseClient

                .from("exam_attempts")

                .update({

                    status:
                        "Paused",

                    paused_at:
                        new Date()
                            .toISOString(),

                    remaining_time_seconds:
                        remainingSeconds,

                    current_question_index:
                        currentQuestion,

                    current_section_index:
                        currentSectionIndex,

                    progress_state:
                        progressState

                })

                .eq(
                    "id",
                    attemptId
                );


        if (error) {

            console.error(
                "Pause Error:",
                error
            );

            throw error;
        }


        // ==================================
        // SAVE LOCAL POSITION
        // ==================================

        sessionStorage.setItem(
            "currentQuestionIndex",
            String(
                currentQuestion
            )
        );


        sessionStorage.setItem(
            "currentSectionIndex",
            String(
                currentSectionIndex
            )
        );


        sessionStorage.removeItem(
            "examActiveStartedAt"
        );


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "Your examination has been paused successfully.\n\n" +
            "Your progress has been saved."
        );


        window.location.replace(
            "exam-list.html"
        );


    } catch (error) {

        console.error(
            "Pause Examination Error:",
            error
        );


        alert(
            "Unable to pause the examination.\n\n" +
            "Please try again."
        );


        if (pauseBtn) {

            pauseBtn.disabled =
                false;

            pauseBtn.innerHTML =
                '<i class="fa-solid fa-pause"></i> Pause Exam';
        }


        pauseOperationInProgress =
            false;
    }
}

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

updateSectionSubmitButton();


// ==========================================
// ACTIVE EXAM TIME TRACKING
// ==========================================

if (
    !sessionStorage.getItem(
        "examActiveStartedAt"
    )
) {

    const existingStart =
        sessionStorage.getItem(
            "examStartTime"
        );

    sessionStorage.setItem(
        "examActiveStartedAt",
        existingStart ||
        new Date().toISOString()
    );
}


// ==========================================
// START / RESTORE CURRENT SECTION TIMER
// ==========================================

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


        // ==========================================
// TIME TAKEN
// PAUSED TIME IS NOT COUNTED
// ==========================================

let timeTaken = 0;


// ------------------------------------------
// Previously accumulated active time
// ------------------------------------------

const savedProgress =
    currentAttemptState &&
    currentAttemptState.progress_state
        ? currentAttemptState.progress_state
        : {};


const previousActiveTime =
    Number(
        savedProgress.activeTimeSeconds ||
        0
    );


// ------------------------------------------
// Current active session time
// ------------------------------------------

const activeStartedAt =
    sessionStorage.getItem(
        "examActiveStartedAt"
    );


let currentActiveTime = 0;


if (activeStartedAt) {

    currentActiveTime =
        Math.max(
            0,
            Math.floor(
                (
                    Date.now() -
                    new Date(
                        activeStartedAt
                    ).getTime()
                ) / 1000
            )
        );

}


// ------------------------------------------
// Total active exam time
// ------------------------------------------

timeTaken =
    previousActiveTime +
    currentActiveTime;

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

    palette.scrollTop = 0;

    updatePalette(true);

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