/* ==========================================
   ExamVerse Instructions
   Created by Subhajit Paul
   Updated CBT Review/Scoring Behavior
========================================== */


const examDetails =
    document.getElementById("examDetails");


const agree =
    document.getElementById("agree");


const startExamBtn =
    document.getElementById("startExamBtn");


let selectedExam = null;

let pausedAttempt = null;

let completedAttempt = null;


// ==========================================
// Load Exam Details
// ==========================================

async function loadExam() {

    // ==========================================
    // AUTHENTICATION CHECK
    // ==========================================

    const {
        data: authData,
        error: authError
    } = await supabaseClient.auth.getUser();


    // ------------------------------------------
    // User is NOT logged in
    // ------------------------------------------

    if (
        authError ||
        !authData ||
        !authData.user
    ) {

        showPopup(
    "warning",
    "Login Required",
    "Please login to access this examination."
);


        // Remember the shared exam URL
        // so we know which exam was requested

        sessionStorage.setItem(
            "examLoginReturnUrl",
            window.location.href
        );


        window.location.replace(
            "login.html"
        );

        return;
    }


    // ==========================================
    // USER IS LOGGED IN
    // Continue normally
    // ==========================================


    // ==========================================
// GET EXAM ID
// ==========================================

// Check whether this is a shared exam link
const urlParams =
    new URLSearchParams(
        window.location.search
    );

const sharedExamId =
    urlParams.get("exam");


// First use shared URL if available
let examId =
    sharedExamId ||
    sessionStorage.getItem(
        "selectedExam"
    );


// ==========================================
// SAVE SHARED EXAM ID
// ==========================================

if (sharedExamId) {

    sessionStorage.setItem(
        "selectedExam",
        sharedExamId
    );

}


    if (!examId) {

        showPopup(
    "warning",
    "No Exam Selected",
    "Please select an examination before continuing."
);


        window.location.replace(
            "exam-list.html"
        );


        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .from("exams")

                .select("*")

                .eq(
                    "id",
                    examId
                )

                .single();


        if (error) {

            console.error(
                "Exam Load Error:",
                error
            );


            showPopup(
    "error",
    "Exam Not Found",
    "The requested examination could not be found."
);


            window.location.replace(
                "exam-list.html"
            );


            return;

        }


        selectedExam =
            data;

            // ==========================================
// CHECK EXISTING PAUSED ATTEMPT
// ==========================================

const {
    data: authForAttempt
} =
await supabaseClient.auth.getUser();

const loggedUser =
    authForAttempt?.user;

pausedAttempt = null;

if (loggedUser) {

    const {
        data: existingPausedAttempt,
        error: pausedAttemptError
    } =
    await supabaseClient

        .from("exam_attempts")

        .select(`
            id,
            exam_id,
            status,
            remaining_time_seconds,
            current_question_index,
            current_section_index
        `)

        .eq(
            "user_id",
            loggedUser.id
        )

        .eq(
            "exam_id",
            data.id
        )

        .eq(
            "status",
            "Paused"
        )

        .order(
            "paused_at",
            {
                ascending: false
            }
        )

        .limit(1)
        .maybeSingle();


    if (pausedAttemptError) {

        console.error(
            "Paused attempt check error:",
            pausedAttemptError
        );

    } else {

        pausedAttempt =
            existingPausedAttempt ||
            null;

    }

}

            await loadSectionPattern(
    data.id
);

// ==========================================
// CHECK EXISTING COMPLETED ATTEMPT
// ==========================================

completedAttempt = null;

if (loggedUser) {

    const {
        data: existingCompletedAttempt,
        error: completedAttemptError
    } =
    await supabaseClient

        .from("exam_attempts")

        .select(`
            id,
            exam_id,
            status
        `)

        .eq(
            "user_id",
            loggedUser.id
        )

        .eq(
            "exam_id",
            data.id
        )

        .eq(
            "status",
            "Completed"
        )

        .order(
            "submitted_at",
            {
                ascending: false
            }
        )

        .limit(1)
        .maybeSingle();


    if (completedAttemptError) {

        console.error(
            "Completed attempt check error:",
            completedAttemptError
        );

    } else {

        completedAttempt =
            existingCompletedAttempt ||
            null;

    }

}

// ==========================================
// CHANGE BUTTON FOR PAUSED ATTEMPT
// ==========================================

// ==========================================
// SET BUTTON ACCORDING TO ATTEMPT STATE
// ==========================================

if (pausedAttempt) {

    startExamBtn.innerHTML =
        "↻ Resume Exam";

    startExamBtn.classList.add(
        "resumeBtn"
    );

}

else if (completedAttempt) {

    startExamBtn.innerHTML =
        "↻ Retake Exam";

    startExamBtn.classList.add(
        "retakeBtn"
    );

}

// ==========================================
// CHECK FOR SECTIONAL EXAM
// ==========================================

const {
    data: examSections,
    error: examSectionsError
} = await supabaseClient
    .from("exam_sections")
    .select("id")
    .eq(
        "exam_id",
        data.id
    )
    .limit(1);


if (examSectionsError) {

    console.error(
        "Unable to check exam sections:",
        examSectionsError
    );

}


const hasSections =
    Array.isArray(examSections) &&
    examSections.length > 0;


        // ==========================================
        // Display Exam Information
        // ==========================================

        examDetails.innerHTML = `

            <div class="exam-info">

                <h2>
                    ${escapeHTML(
                        data.exam_name ||
                        "Examination"
                    )}
                </h2>


                <p>
                    Review the examination details
                    before starting.
                </p>


                <div class="exam-info-grid">


                    <!-- Category -->

                    <div class="info-box">

                        <span>
                            Category
                        </span>

                        <strong>
                            ${escapeHTML(
                                data.category ||
                                "—"
                            )}
                        </strong>

                    </div>


                    <!-- Total Questions -->

                    <div class="info-box">

                        <span>
                            Total Questions
                        </span>

                        <strong>
                            ${data.total_questions ?? 0}
                        </strong>

                    </div>


                    <!-- Duration -->

                    <div class="info-box">

                        <span>
                            Duration
                        </span>

                        <strong>
                            ${data.duration ?? 0}
                            Minutes
                        </strong>

                    </div>


                    <!-- Total Marks -->

                    <div class="info-box">

                        <span>
                            Total Marks
                        </span>

                        <strong>
                            ${data.total_marks ?? 0}
                        </strong>

                    </div>


                    <!-- Positive Marks -->

<div class="info-box">
    <span>
        Positive Marks
    </span>

    <strong>
        ${hasSections
            ? "Section-wise"
            : `+${data.positive_marks ?? 0}`
        }
    </strong>
</div>


                    <!-- Negative Marks -->

<div class="info-box">
    <span>
        Negative Marks
    </span>

    <strong>
        ${hasSections
            ? "Section-wise"
            : formatNegativeMarks(
                data.negative_marks
            )
        }
    </strong>
</div>


                    <!-- Passing Marks -->

                    <div class="info-box">

                        <span>
                            Passing Marks
                        </span>

                        <strong>
                            ${data.passing_marks ?? 0}
                        </strong>

                    </div>


                    <!-- Exam Name -->

                    <div class="info-box">

                        <span>
                            Exam Name
                        </span>

                        <strong>
                            ${escapeHTML(
                                data.exam_name ||
                                "—"
                            )}
                        </strong>

                    </div>


                </div>

            </div>

        `;

    }


    catch (error) {

        console.error(
            "Instruction Page Error:",
            error
        );


        showPopup(
    "error",
    "Unable to Load Exam",
    "Unable to load the examination details. Please try again."
);

    }

}


// ==========================================
// Escape HTML
// ==========================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ==========================================
// Format Negative Marks
// ==========================================

function formatNegativeMarks(
    value
) {

    const number =
        Number(
            value ?? 0
        );


    if (!number) {

        return "0";

    }


    /*
       Your Supabase negative_marks
       should now normally be stored
       as a positive number.

       Example:

       0.25

       This function displays:

       -0.25
    */

    return number > 0

        ? `-${number}`

        : String(number);

}


// ==========================================
// Enable Start Button
// ==========================================

agree.addEventListener(
    "change",
    () => {

        startExamBtn.disabled =
            !agree.checked;

    }
);


// ==========================================
// Start Exam
// ==========================================

startExamBtn.addEventListener(
    "click",
    startExam
);


// ==========================================
// Create Exam Attempt
// ==========================================

async function startExam() {

    

    if (!selectedExam) {

        showPopup(
    "warning",
    "Please Wait",
    "Examination details are still loading. Please wait a moment and try again."
);

        return;

    }

    // ==========================================
// RESUME EXISTING PAUSED ATTEMPT
// ==========================================

if (pausedAttempt) {

    sessionStorage.setItem(
        "attemptId",
        pausedAttempt.id
    );

    sessionStorage.setItem(
        "selectedExam",
        selectedExam.id
    );

    // This is NOT a fresh attempt
    sessionStorage.removeItem(
        "attemptStartedFresh"
    );

    window.location.replace(
        "exam.html"
    );

    return;
}


    // Prevent double-click

    startExamBtn.disabled =
        true;


    try {


        // ==========================================
        // Get Logged-in User
        // ==========================================

        const {
            data,
            error: authError
        } =
            await supabaseClient
                .auth
                .getUser();


        if (
            authError ||
            !data.user
        ) {

            showPopup(
    "warning",
    "Login Required",
    "Your login session has expired. Please login again."
);


            window.location.replace(
                "login.html"
            );


            return;

        }


        const user =
            data.user;


        // ==========================================
        // Create Exam Attempt
        // ==========================================

        const {
    data: attempt,
    error
} =
    await supabaseClient.rpc(
        "create_exam_attempt",
        {
            p_exam_id:
                selectedExam.id,

            p_total_questions:
                selectedExam.total_questions
        }
    );


        if (error) {

            console.error(
                "Attempt Creation Error:",
                error
            );


            showPopup(
    "error",
    "Unable to Start Exam",
    error.message
);

            startExamBtn.disabled =
                false;


            return;

        }


        // ==========================================
        // Clear Previous Exam Session
        // ==========================================

        sessionStorage.removeItem(
            "examSubmitted"
        );


        sessionStorage.removeItem(
            "examResult"
        );


        sessionStorage.removeItem(
            "attemptId"
        );


        sessionStorage.removeItem(
            "examStartTime"
        );


        // ==========================================
        // Save New Attempt ID
        // ==========================================

        sessionStorage.setItem(
            "attemptId",
            attempt.id
        );


        // ==========================================
// NEW ATTEMPT TIMER
// ==========================================
// IMPORTANT:
// Do NOT start the exam timer here.
//
// The timer will start in exam.js
// after questions and CBT interface
// are fully loaded.
//
// This prevents network/loading time
// from being deducted from the exam.

sessionStorage.removeItem(
    "examStartTime"
);

        // ==========================================
// RESET CBT STATE FOR NEW ATTEMPT
// ==========================================

sessionStorage.removeItem("currentSectionIndex");
sessionStorage.removeItem("currentSection");
sessionStorage.removeItem("currentQuestion");
sessionStorage.removeItem("currentQuestionIndex");
sessionStorage.removeItem("sectionIndex");
sessionStorage.removeItem("sectionalState");
sessionStorage.removeItem("sectionState");


// Save fresh attempt-specific state
sessionStorage.setItem(
    "attemptStartedFresh",
    "true"
);

        // ==========================================
        // Save Selected Exam
        // ==========================================

        localStorage.setItem(
            "selectedExam",
            JSON.stringify(
                selectedExam
            )
        );


        // ==========================================
        // Open Examination
        // ==========================================

        /*
           replace() is used instead of href
           so the instruction page is not
           unnecessarily kept in the history
           for this exam start.
        */

        window.location.replace(
            "exam.html"
        );

    }


    catch (error) {

        console.error(
            "Start Exam Error:",
            error
        );


        showPopup(
    "error",
    "Unable to Start Exam",
    "Unable to start the examination. Please try again."
);


        startExamBtn.disabled =
            false;

    }

}


// ==========================================
// Initial Load
// ==========================================

loadExam();

// ==========================================
// LOAD SECTION-WISE EXAMINATION PATTERN
// ==========================================

async function loadSectionPattern(examId) {

    const sectionCard =
        document.getElementById(
            "sectionPatternCard"
        );

    const sectionContent =
        document.getElementById(
            "sectionPatternContent"
        );


    if (
        !sectionCard ||
        !sectionContent
    ) {
        return;
    }


    // ------------------------------------------
    // Hide by default
    // ------------------------------------------

    sectionCard.style.display =
        "none";

    sectionContent.innerHTML =
        "";


    if (!examId) {
        return;
    }


    try {

        // ==========================================
        // LOAD SECTIONS
        // ==========================================

        const {
            data: sections,
            error: sectionError
        } =
            await supabaseClient

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
                    examId
                )

                .order(
                    "section_order",
                    {
                        ascending: true
                    }
                );


        if (sectionError) {

            console.error(
                "Section pattern loading error:",
                sectionError
            );

            return;
        }


        // ==========================================
        // NORMAL EXAM
        // ==========================================

        if (
            !sections ||
            sections.length === 0
        ) {

            sectionCard.style.display =
                "none";

            return;
        }


        // ==========================================
        // LOAD QUESTIONS
        //
        // Marks are stored per question.
        // Questions are ordered by question_no.
        // Section question counts determine which
        // questions belong to each section.
        // ==========================================

        const {
            data: questions,
            error: questionError
        } =
            await supabaseClient

                .from("questions")

                .select(`
                    question_no,
                    marks,
                    negative_marks
                `)

                .eq(
                    "exam_id",
                    examId
                )

                .order(
                    "question_no",
                    {
                        ascending: true
                    }
                );


        if (questionError) {

            console.error(
                "Section marking scheme loading error:",
                questionError
            );

            return;
        }


        const questionList =
            Array.isArray(questions)
                ? questions
                : [];


        // ==========================================
        // SHOW SECTION CARD
        // ==========================================

        sectionCard.style.display =
            "block";

        sectionContent.innerHTML =
            "";


        // ==========================================
        // TRACK QUESTION POSITION
        // ==========================================

        let questionOffset = 0;


        // ==========================================
        // RENDER EACH SECTION
        // ==========================================

        sections.forEach(
            (
                section,
                index
            ) => {

                const questionCount =
                    Number(
                        section.question_count || 0
                    );


                // ----------------------------------
                // Get questions belonging to section
                // ----------------------------------

                const sectionQuestions =
                    questionList.slice(
                        questionOffset,
                        questionOffset +
                        questionCount
                    );


                questionOffset +=
                    questionCount;


                // ----------------------------------
                // Determine section marking scheme
                // ----------------------------------

                let positiveMarks = null;

                let negativeMarks = null;


                if (
                    sectionQuestions.length > 0
                ) {

                    const firstQuestion =
                        sectionQuestions[0];


                    positiveMarks =
                        Number(
                            firstQuestion.marks
                        );

                    negativeMarks =
                        Number(
                            firstQuestion.negative_marks
                        );


                    // ------------------------------
                    // Check whether all questions
                    // in this section have the
                    // same marking scheme.
                    // ------------------------------

                    const allSamePositive =
                        sectionQuestions.every(
                            question =>
                                Number(
                                    question.marks
                                ) ===
                                positiveMarks
                        );


                    const allSameNegative =
                        sectionQuestions.every(
                            question =>
                                Number(
                                    question.negative_marks
                                ) ===
                                negativeMarks
                        );


                    if (
                        !allSamePositive
                    ) {

                        positiveMarks =
                            null;

                    }


                    if (
                        !allSameNegative
                    ) {

                        negativeMarks =
                            null;

                    }

                }


                // ----------------------------------
                // Format Positive Marks
                // ----------------------------------

                const positiveText =
                    positiveMarks !== null &&
                    Number.isFinite(
                        positiveMarks
                    )

                        ? `+${positiveMarks}`

                        : "Varies";


                // ----------------------------------
                // Format Negative Marks
                // ----------------------------------

                let negativeText =
                    "Varies";


                if (
                    negativeMarks !== null &&
                    Number.isFinite(
                        negativeMarks
                    )
                ) {

                    if (
                        negativeMarks === 0
                    ) {

                        negativeText =
                            "0";

                    }

                    else {

                        negativeText =
                            `-${negativeMarks}`;

                    }

                }


                // ==================================
                // CREATE SECTION ROW
                // ==================================

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "instruction-section-row";


                row.innerHTML = `

                    <div class="section-number">
                        ${index + 1}
                    </div>


                    <div class="section-main">

                        <strong>
                            ${escapeHTML(
                                section.section_name
                            )}
                        </strong>


                        <span>
                            ${questionCount}
                            Questions
                        </span>


                        <div
                            style="
                                margin-top:6px;
                                font-size:13px;
                                font-weight:600;
                                color:#475569;
                            "
                        >
                            Correct:
                            <strong>
                                ${positiveText}
                            </strong>
                            &nbsp; | &nbsp;
                            Incorrect:
                            <strong>
                                ${negativeText}
                            </strong>
                        </div>

                    </div>


                    <div class="section-time">

                        <i
                            class="fa-regular fa-clock"
                        ></i>

                        ${Number(
                            section.duration_minutes || 0
                        )}
                        min

                    </div>

                `;


                sectionContent.appendChild(
                    row
                );

            }
        );


    }

    catch (error) {

        console.error(
            "Unexpected section pattern error:",
            error
        );

    }

}