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

// ==========================================
// SAVED EXAM STATE
// ==========================================

let savedExamIds = new Set();

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

// ==========================================
// SAVED EXAMS
// ==========================================

savedExamIds = new Set();

if (user) {

    // ==========================================
    // SAVED EXAMS
    // ==========================================

    const {
        data: savedExamData,
        error: savedExamError
    } = await supabaseClient

        .from("saved_exams")

        .select("exam_id")

        .eq(
            "user_id",
            user.id
        );


    if (savedExamError) {

        console.error(
            "Saved exams loading error:",
            savedExamError
        );

    }
    else {

        savedExamIds =
            new Set(

                (savedExamData || [])
                    .map(
                        item =>
                            String(
                                item.exam_id
                            )
                    )

            );

    }


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

            <!-- BOOKMARK EXAM -->

    <button
        type="button"
        class="examBookmarkBtn ${
            savedExamIds.has(
                String(exam.id)
            )
                ? "saved"
                : ""
        }"
        data-exam-bookmark="${exam.id}"
        title="${
            savedExamIds.has(
                String(exam.id)
            )
                ? "Remove from Bookmarks"
                : "Save to Bookmarks"
        }"
        aria-label="Save examination"
    >

        <span class="bookmarkIcon">🔖</span>

    </button>

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


    <div
    class="exam-title-wrapper"
    data-full-title="${String(exam.exam_name)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}"
>

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

</div>

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

//==========================================
// EXAM BOOKMARK
// SAVE / REMOVE
//==========================================

//==========================================
// SAVE / REMOVE EXAM BOOKMARK
//==========================================

async function toggleExamBookmark(
    examId,
    button
) {

    if (
        !examId ||
        !button
    ) {

        return;

    }


    console.log(
        "Processing bookmark:",
        examId
    );


    // ======================================
    // GET USER
    // ======================================

    const {
        data: authData,
        error: authError
    } =
        await supabaseClient
            .auth
            .getUser();


    if (
        authError ||
        !authData ||
        !authData.user
    ) {

        console.error(
            "User error:",
            authError
        );

        alert(
            "Please login again."
        );

        return;

    }


    const userId =
        authData.user.id;


    button.disabled =
        true;


    try {

        // ==================================
        // CHECK CURRENT BOOKMARK
        // ==================================

        const {
            data: existing,
            error: checkError
        } =
            await supabaseClient

                .from("saved_exams")

                .select("id")

                .eq(
                    "user_id",
                    userId
                )

                .eq(
                    "exam_id",
                    examId
                )

                .maybeSingle();


        if (checkError) {

            console.error(
                "Bookmark check failed:",
                checkError
            );

            alert(
                "Unable to check saved exam."
            );

            return;

        }


        // ==================================
        // ALREADY SAVED → REMOVE
        // ==================================

        if (existing) {

            console.log(
                "Removing bookmark:",
                existing.id
            );


            const {
                error: deleteError
            } =
                await supabaseClient

                    .from("saved_exams")

                    .delete()

                    .eq(
                        "id",
                        existing.id
                    )

                    .eq(
                        "user_id",
                        userId
                    );


            if (deleteError) {

                console.error(
                    "Bookmark delete failed:",
                    deleteError
                );

                alert(
                    "Unable to remove bookmark."
                );

                return;

            }


            // Update local state

            savedExamIds.delete(
                String(
                    examId
                )
            );


            // Update button immediately

            updateExamBookmarkButton(
                button,
                false
            );


            console.log(
                "Bookmark removed successfully."
            );


            return;

        }


        // ==================================
        // NOT SAVED → SAVE
        // ==================================

        console.log(
            "Saving exam:",
            examId
        );


        const {
            data: inserted,
            error: insertError
        } =
            await supabaseClient

                .from("saved_exams")

                .insert({

                    user_id:
                        userId,

                    exam_id:
                        examId

                })

                .select()
                .single();


        if (insertError) {

            console.error(
                "Bookmark insert failed:",
                insertError
            );

            alert(
                "Unable to save exam.\n\n" +
                insertError.message
            );

            return;

        }


        console.log(
            "Bookmark saved:",
            inserted
        );


        // ==================================
        // UPDATE LOCAL STATE
        // ==================================

        savedExamIds.add(
            String(
                examId
            )
        );


        // ==================================
        // UPDATE BUTTON IMMEDIATELY
        // ==================================

        updateExamBookmarkButton(
            button,
            true
        );


        console.log(
            "Bookmark button updated."
        );

    }

    catch (error) {

    console.error(
        "Bookmark system error:",
        error
    );

    alert(
        "Bookmark operation failed.\n\n" +
        (
            error?.message ||
            String(error)
        )
    );

}

    finally {

        button.disabled =
            false;

    }

}

//==========================================
// UPDATE BOOKMARK BUTTON
//==========================================

function updateExamBookmarkButton(
    button,
    saved
) {

    if (!button) {

        return;

    }


    if (saved) {

        button.classList.add(
            "saved"
        );


        button.innerHTML = `

            <span class="bookmarkIcon">
                🔖
            </span>

        `;


        button.title =
            "Remove from Bookmarks";

    }

    else {

        button.classList.remove(
            "saved"
        );


        button.innerHTML = `

            <span class="bookmarkIcon">
                🔖
            </span>

        `;


        button.title =
            "Save to Bookmarks";

    }

}

//==========================================
// EXAM BOOKMARK CLICK HANDLER
//==========================================

document.addEventListener(
    "click",
    async function (event) {

        const button =
            event.target.closest(
                "[data-exam-bookmark]"
            );


        // Not a bookmark click
        if (!button) {

            return;

        }


        // Stop the click from affecting
        // the exam card or other buttons

        event.preventDefault();

        event.stopPropagation();


        const examId =
            button.getAttribute(
                "data-exam-bookmark"
            );


        if (!examId) {

            console.error(
                "Exam bookmark: exam ID missing."
            );

            return;

        }


        console.log(
            "Exam bookmark clicked:",
            examId
        );


        await toggleExamBookmark(
            examId,
            button
        );

    }
);