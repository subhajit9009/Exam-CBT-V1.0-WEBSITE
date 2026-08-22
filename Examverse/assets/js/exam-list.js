/* ==========================================
   ExamVerse Available Exams
   Created by Subhajit Paul
========================================== */

//==========================================
// Elements
//==========================================

const examContainer =
document.getElementById("examContainer");

const searchExam =
document.getElementById("searchExam");

//==========================================
// CLEAR STALE EXAM PAGE SESSION
//==========================================

// Being on the Exam List means the user
// is NOT currently entering an exam.

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

//==========================================
// Load Exams
//==========================================

async function loadExams(search = "") {

    examContainer.innerHTML =
        `<div class="loading">Loading Exams...</div>`;

    const {
    data: exams,
    error
} = await supabaseClient
    .from("exams")
    .select("*")
    .eq("status", "Live")
    .order("exam_name");


if (error) {

    console.error(
        "Exam loading error:",
        error
    );

    examContainer.innerHTML =
        `<div class="loading">
            Failed to load exams.
        </div>`;

    return;
}

// ==========================================
// SELECTED PREFERRED EXAM
// ==========================================

const selectedPreferredExam =
    sessionStorage.getItem(
        "selectedPreferredExam"
    );

    if (error) {
        examContainer.innerHTML =
            `<div class="loading">Failed to load exams.</div>`;
        return;
    }

    const {
        data: auth
    } = await supabaseClient.auth.getUser();

    const user = auth?.user;

    let pausedAttempts = [];
let completedAttempts = [];

if (user) {

    // ==========================================
    // PAUSED ATTEMPTS
    // ==========================================

    const {
        data: pausedData,
        error: pausedError
    } = await supabaseClient

        .from("exam_attempts")

        .select(`
            id,
            exam_id,
            status,
            remaining_time_seconds
        `)

        .eq(
            "user_id",
            user.id
        )

        .eq(
            "status",
            "Paused"
        );


    if (pausedError) {

        console.error(
            "Paused attempts error:",
            pausedError
        );

    }

    pausedAttempts =
        pausedData || [];


    // ==========================================
    // COMPLETED ATTEMPTS
    // ==========================================

    const {
        data: completedData,
        error: completedError
    } = await supabaseClient

        .from("exam_attempts")

        .select(`
            id,
            exam_id,
            status
        `)

        .eq(
            "user_id",
            user.id
        )

        .eq(
            "status",
            "Completed"
        );


    if (completedError) {

        console.error(
            "Completed attempts error:",
            completedError
        );

    }

    completedAttempts =
        completedData || [];

}

    examContainer.innerHTML = "";

    // ==========================================
// FILTER EXAMS
// ==========================================

let filtered =
    exams.filter(exam =>
        exam.exam_name
            .toLowerCase()
            .includes(
                search.toLowerCase()
            )
    );


// ==========================================
// FILTER BY SELECTED PREFERRED EXAM
// ==========================================

if (
    selectedPreferredExam &&
    search.trim() === ""
) {

    const preferredName =
        selectedPreferredExam
            .trim()
            .toLowerCase();


    filtered =
        filtered.filter(
            exam => {

                const examName =
                    exam.exam_name
                        .trim()
                        .toLowerCase();


                // ==================================
                // EXACT MATCH
                // ==================================

                if (
                    examName ===
                    preferredName
                ) {

                    return true;

                }


                // ==================================
                // RELATED EXAM MATCH
                //
                // Example:
                // SSC CGL
                // SSC CGL (01)
                // SSC CGL (02)
                // SSC CGL Mock Test
                // ==================================

                if (
                    examName.startsWith(
                        preferredName
                    )
                ) {

                    return true;

                }


                return false;

            }
        );

}

    if (filtered.length === 0) {
        examContainer.innerHTML =
            `<div class="loading">No Live Exams Found.</div>`;
        return;
    }

    filtered.forEach(exam => {

        const paused =
    pausedAttempts.find(
        p => p.exam_id === exam.id
    );

const completed =
    completedAttempts.find(
        c => c.exam_id === exam.id
    );

        examContainer.innerHTML += `

        <div class="examCard">

    <!-- SHARE EXAM -->
    <button
        class="shareExamBtn"
        onclick="shareExam('${exam.id}')"
        title="Share this examination"
        aria-label="Share this examination"
    >
         🔗
        <i class="fa-solid fa-share-nodes"></i>
    </button>


    <h2>

    ${exam.exam_name}

    ${
    selectedPreferredExam &&
    exam.exam_name
        .trim()
        .toLowerCase()
        .startsWith(
            selectedPreferredExam
                .trim()
                .toLowerCase()
        )

    ? `
        <span class="preferredBadge">
            ⭐ Preferred
        </span>
      `

    : ""
}

</h2>

            <p class="examInfo">
                📂 Category :
                <b>${exam.category}</b>
            </p>

            <p class="examInfo">
                📝 Questions :
                <b>${exam.total_questions}</b>
            </p>

            <p class="examInfo">
                ⏱ Duration :
                <b>${exam.duration} Minutes</b>
            </p>

            <p class="examInfo">
                🏆 Total Marks :
                <b>${exam.total_marks}</b>
            </p>

            <span class="status">
                ${paused ? "⏸ PAUSED" : "🟢 LIVE"}
            </span>

            <div class="exam-card-actions">

    ${
    paused

    ? `

    <button
        class="startBtn resumeBtn"
        onclick="resumeExam(
            '${paused.id}',
            '${exam.id}'
        )"
    >
        ↻ Resume Exam
    </button>

    `

    : completed

    ? `

    <button
        class="startBtn retakeBtn"
        onclick="retakeExam(
            '${exam.id}'
        )"
    >
        ↻ Retake Exam
    </button>

    `

    : `

    <button
        class="startBtn"
        onclick="startExam(
            '${exam.id}'
        )"
    >
        ▶ Start Exam
    </button>

    `
}


</div>

        </div>`;

    });

}

//==========================================
// Start Exam
//==========================================

function startExam(examId) {

    sessionStorage.setItem(
        "selectedExam",
        examId
    );

    window.location.href =
    "instructions.html";

}

//==========================================
// RETAKE EXAM
//==========================================

function retakeExam(examId) {

    // Clear old attempt/session state

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


    // Select the exam

    sessionStorage.setItem(
        "selectedExam",
        examId
    );


    // Open instructions

    window.location.replace(
        "instructions.html"
    );

}

//==========================================
// SHARE EXAM
//==========================================

async function shareExam(examId) {

    // Create direct instruction-page URL
    const shareUrl =
        new URL(
            "instructions.html",
            window.location.href
        );

    shareUrl.searchParams.set(
        "exam",
        examId
    );


    // ======================================
    // Native Share
    // ======================================

    if (
        navigator.share
    ) {

        try {

            await navigator.share({

                title:
                    "ExamVerse Examination",

                text:
                    "Join this examination on ExamVerse.",

                url:
                    shareUrl.href

            });

            return;

        } catch (error) {

            // User cancelled the share menu
            if (
                error.name ===
                "AbortError"
            ) {
                return;
            }

            console.error(
                "Share failed:",
                error
            );

        }

    }


    // ======================================
    // Copy Link Fallback
    // ======================================

    try {

        await navigator.clipboard.writeText(
            shareUrl.href
        );

        alert(
            "Exam link copied successfully!"
        );

    } catch (error) {

        console.error(
            "Clipboard error:",
            error
        );

        window.prompt(
            "Copy this examination link:",
            shareUrl.href
        );

    }

}

//==========================================
// RESUME PAUSED EXAM
//==========================================

function resumeExam(
    attemptId,
    examId
) {

    sessionStorage.setItem(
        "attemptId",
        attemptId
    );

    sessionStorage.setItem(
        "selectedExam",
        examId
    );

    // This is NOT a new attempt
    sessionStorage.removeItem(
        "attemptStartedFresh"
    );

    // Open the existing attempt
    window.location.href =
        "exam.html";
}

//==========================================
// Search
//==========================================

searchExam.addEventListener(

"keyup",

e => {

loadExams(e.target.value);

}

);

//==========================================
// Initial Load
//==========================================

loadExams();