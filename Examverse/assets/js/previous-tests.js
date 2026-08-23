/* ==========================================
   ExamVerse Previous Tests
   Created by Subhajit Paul
========================================== */


// ==========================================
// ELEMENTS
// ==========================================

const historyTable =
    document.getElementById(
        "historyTable"
    );

const searchTests =
    document.getElementById(
        "searchTests"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const totalHistory =
    document.getElementById(
        "totalHistory"
    );

const filterButtons =
    document.querySelectorAll(
        ".filterBtn"
    );


// ==========================================
// GLOBAL DATA
// ==========================================

let completedAttempts = [];

let examMap =
    new Map();

let currentFilter =
    "all";

let currentSearch =
    "";


// ==========================================
// LOAD PREVIOUS TESTS
// ==========================================

async function loadPreviousTests() {

    try {

        // ======================================
        // CHECK LOGIN
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

            window.location.replace(
                "login.html"
            );

            return;

        }


        const user =
            authData.user;


        // ======================================
        // LOAD COMPLETED ATTEMPTS
        //
        // IMPORTANT:
        // result = Pass / Fail saved when
        // the exam was submitted.
        // ======================================

        const {
            data: attempts,
            error: attemptsError
        } =
            await supabaseClient

                .from(
                    "exam_attempts"
                )

                .select(`
                    id,
                    exam_id,
                    score,
                    percentage,
                    attempted,
                    correct,
                    wrong,
                    skipped,
                    total_questions,
                    status,
                    result,
                    submitted_at,
                    time_taken
                `)

                .eq(
                    "user_id",
                    user.id
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
                );


        if (attemptsError) {

            console.error(
                "Previous tests loading error:",
                attemptsError
            );

            showError();

            return;

        }


        completedAttempts =
            attempts || [];


        // ======================================
        // UPDATE COUNT
        // ======================================

        totalHistory.textContent =
            completedAttempts.length +
            (
                completedAttempts.length === 1
                    ? " Test"
                    : " Tests"
            );


        // ======================================
        // NO TESTS
        // ======================================

        if (
            completedAttempts.length === 0
        ) {

            historyTable.innerHTML = "";

            emptyState.hidden =
                false;

            return;

        }


        // ======================================
        // GET EXAM IDS
        // ======================================

        const examIds = [

            ...new Set(

                completedAttempts

                    .map(
                        attempt =>
                            attempt.exam_id
                    )

                    .filter(Boolean)

            )

        ];


        // ======================================
        // LOAD EXAM INFORMATION
        //
        // passing_marks is used only as a
        // fallback for older attempts where
        // result was not stored.
        // ======================================

        if (
            examIds.length > 0
        ) {

            const {
                data: exams,
                error: examError
            } =
                await supabaseClient

                    .from(
                        "exams"
                    )

                    .select(`
                        id,
                        exam_name,
                        total_marks,
                        passing_marks
                    `)

                    .in(
                        "id",
                        examIds
                    );


            if (examError) {

                console.error(
                    "Exam information error:",
                    examError
                );

            }


            (
                exams || []
            ).forEach(
                exam => {

                    examMap.set(

                        exam.id,

                        {

                            name:
                                exam.exam_name,

                            totalMarks:
                                Number(
                                    exam.total_marks
                                ) || 0,

                            passingMarks:
                                exam.passing_marks !== null &&
                                exam.passing_marks !== undefined

                                    ?

                                    Number(
                                        exam.passing_marks
                                    )

                                    :

                                    null

                        }

                    );

                }
            );

        }


        // ======================================
// RENDER
// ======================================

renderTests();


// ======================================
// RESTORE SAVED BOOKMARK STATUS
// ======================================

await applyAttemptBookmarkStatus();

    }

    catch (error) {

        console.error(
            "Previous Tests error:",
            error
        );

        showError();

    }

}


// ==========================================
// GET ACTUAL RESULT
// ==========================================
//
// Priority:
//
// 1. Saved attempt.result
// 2. Exam passing_marks fallback
// 3. Completed
//
// We NEVER use a generic 40% rule.
// ==========================================

function getAttemptResult(
    attempt,
    examInfo
) {

    const storedResult =
        String(
            attempt.result || ""
        )
            .trim()
            .toLowerCase();


    // ======================================
    // AUTHORITATIVE SAVED RESULT
    // ======================================

    if (
        storedResult === "pass"
    ) {

        return "Pass";

    }


    if (
        storedResult === "fail"
    ) {

        return "Fail";

    }


    // ======================================
    // LEGACY FALLBACK
    //
    // Only used if old attempt does not
    // contain Pass / Fail.
    // ======================================

    if (
        examInfo &&
        examInfo.passingMarks !== null &&
        examInfo.passingMarks !== undefined
    ) {

        const score =
            Number(
                attempt.score
            ) || 0;


        return (

            score >=
            Number(
                examInfo.passingMarks
            )

        )

            ? "Pass"
            : "Fail";

    }


    // ======================================
    // NO PASSING CRITERIA AVAILABLE
    // ======================================

    return "Completed";

}


// ==========================================
// RENDER TESTS
// ==========================================

function renderTests() {

    const filtered =
        completedAttempts.filter(
            attempt => {

                const examInfo =
                    examMap.get(
                        attempt.exam_id
                    ) || {

                        name:
                            "Unknown Exam",

                        totalMarks:
                            0,

                        passingMarks:
                            null

                    };


                // ==================================
                // SEARCH
                // ==================================

                const examName =
                    String(
                        examInfo.name
                    )
                        .toLowerCase();


                const matchesSearch =
                    examName.includes(
                        currentSearch
                            .toLowerCase()
                    );


                if (
                    !matchesSearch
                ) {

                    return false;

                }


                // ==================================
                // ACTUAL RESULT
                // ==================================

                const result =
                    getAttemptResult(
                        attempt,
                        examInfo
                    );


                // ==================================
                // FILTER
                // ==================================

                if (
                    currentFilter ===
                    "passed"
                ) {

                    return (
                        result ===
                        "Pass"
                    );

                }


                if (
                    currentFilter ===
                    "failed"
                ) {

                    return (
                        result ===
                        "Fail"
                    );

                }


                return true;

            }
        );


    // ==========================================
    // EMPTY
    // ==========================================

    if (
        filtered.length === 0
    ) {

        historyTable.innerHTML = "";

        emptyState.hidden =
            false;

        return;

    }


    emptyState.hidden =
        true;


    // ==========================================
    // BUILD TABLE
    // ==========================================

    historyTable.innerHTML = "";


    filtered.forEach(
        attempt => {


            const examInfo =
                examMap.get(
                    attempt.exam_id
                ) || {

                    name:
                        "Unknown Exam",

                    totalMarks:
                        0,

                    passingMarks:
                        null

                };


            // ======================================
            // SCORE
            // ======================================

            const score =
                Number(
                    attempt.score
                ) || 0;


            const totalMarks =
                Number(
                    examInfo.totalMarks
                ) || 0;


            // ======================================
            // PERCENTAGE
            // ======================================

            const percentage =
                Number(
                    attempt.percentage
                ) || 0;


            // ======================================
            // ACCURACY
            // ======================================

            const attempted =
                Number(
                    attempt.attempted
                ) || 0;


            const correct =
                Number(
                    attempt.correct
                ) || 0;


            const accuracy =
                attempted > 0

                    ?

                    (
                        correct /
                        attempted
                    ) * 100

                    :

                    0;


            // ======================================
            // DATE
            // ======================================

            const date =
                attempt.submitted_at

                    ?

                    new Date(
                        attempt.submitted_at
                    ).toLocaleDateString(
                        "en-IN",
                        {
                            day:
                                "2-digit",

                            month:
                                "short",

                            year:
                                "numeric"
                        }
                    )

                    :

                    "N/A";


            // ======================================
            // TIME
            // ======================================

            const timeTaken =
                formatTime(
                    attempt.time_taken
                );


            // ======================================
            // ACTUAL PASS / FAIL
            // ======================================

            const result =
                getAttemptResult(
                    attempt,
                    examInfo
                );


            let statusClass =
                "completed";


            if (
                result === "Pass"
            ) {

                statusClass =
                    "passed";

            }

            else if (
                result === "Fail"
            ) {

                statusClass =
                    "failed";

            }


            // ======================================
            // RESULT DISPLAY
            // ======================================

            const statusText =
                result === "Pass"

                    ? "Passed"

                    : result === "Fail"

                        ? "Failed"

                        : "Completed";


            // ======================================
            // ROW
            // ======================================

            historyTable.innerHTML += `

                <tr
                    class="historyRow"
                    data-attempt-id="${escapeHTML(
                        String(
                            attempt.id
                        )
                    )}"
                    title="View Result"
                >

                    <td>
                        ${date}
                    </td>


                    <td class="examNameCell">

                        <strong>
                            ${escapeHTML(
                                examInfo.name
                            )}
                        </strong>

                    </td>


                    <td>

                        ${score
                            .toFixed(2)
                            .replace(
                                /\.00$/,
                                ""
                            )
                        }

                        /

                        ${totalMarks}

                    </td>


                    <td>

                        <strong>

                            ${percentage
                                .toFixed(2)
                                .replace(
                                    /\.00$/,
                                    ""
                                )
                            }%

                        </strong>

                    </td>


                    <td>

                        ${accuracy
                            .toFixed(2)
                            .replace(
                                /\.00$/,
                                ""
                            )
                        }%

                    </td>


                    <td>

                        ${timeTaken}

                    </td>


                    <td>

    <span
        class="statusBadge ${statusClass}"
    >

        ${statusText}

    </span>

</td>

<td>

    <button
        type="button"
        class="bookmarkAction"
        data-attempt-bookmark="${escapeHTML(
            String(
                attempt.id
            )
        )}"
    >

        <i class="fa-regular fa-bookmark"></i>

        <span class="bookmarkText">
            Save
        </span>

    </button>

</td>

                </tr>

            `;

        }
    );

        // ======================================
    // RESTORE SAVED BOOKMARK STATUS
    // ======================================

    applyAttemptBookmarkStatus();

}


// ==========================================
// FORMAT TIME
// ==========================================

function formatTime(
    seconds
) {

    const totalSeconds =
        Number(seconds) || 0;


    if (
        totalSeconds <= 0
    ) {

        return "N/A";

    }


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


    const secs =
        totalSeconds % 60;


    if (
        hours > 0
    ) {

        return (

            String(hours)
                .padStart(2, "0")

            + ":" +

            String(minutes)
                .padStart(2, "0")

            + ":" +

            String(secs)
                .padStart(2, "0")

        );

    }


    return (

        String(minutes)
            .padStart(2, "0")

        + ":" +

        String(secs)
            .padStart(2, "0")

    );

}


// ==========================================
// SEARCH
// ==========================================

searchTests.addEventListener(
    "input",
    function () {

        currentSearch =
            this.value.trim();

        renderTests();

    }
);


// ==========================================
// FILTER BUTTONS
// ==========================================

filterButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function () {

                filterButtons
                    .forEach(
                        btn => {

                            btn.classList
                                .remove(
                                    "active"
                                );

                        }
                    );


                this.classList.add(
                    "active"
                );


                currentFilter =
                    this.dataset.filter;


                renderTests();

            }
        );

    }
);


// ==========================================
// OPEN RESULT
// ==========================================

historyTable.addEventListener(
    "click",
    function (event) {

        // ======================================
        // IGNORE BOOKMARK BUTTON
        // ======================================

        if (
            event.target.closest(
                "[data-attempt-bookmark]"
            )
        ) {

            return;

        }


        // ======================================
        // FIND TEST ROW
        // ======================================

        const row =
            event.target.closest(
                ".historyRow"
            );


        if (!row) {

            return;

        }


        // ======================================
        // GET ATTEMPT ID
        // ======================================

        const attemptId =
            row.dataset.attemptId;


        if (!attemptId) {

            return;

        }


        // ======================================
        // SAVE RESULT ATTEMPT ID
        // ======================================

        sessionStorage.setItem(
            "resultAttemptId",
            String(
                attemptId
            )
        );


        localStorage.setItem(
            "examVerseResultAttemptId",
            String(
                attemptId
            )
        );


        // ======================================
        // OPEN RESULT PAGE
        // ======================================

        window.location.href =
            "result.html";

    }
);

// ==========================================
// SAFE HTML
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
// ERROR
// ==========================================

function showError() {

    historyTable.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="errorRow"
            >

                Unable to load previous tests.

                <br>

                Please refresh the page.

            </td>

        </tr>

    `;

}


// ==========================================
// NEW TEST
// ==========================================

const newTestBtn =
    document.getElementById(
        "newTestBtn"
    );


if (newTestBtn) {

    newTestBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "exam-list.html";

        }
    );

}


// ==========================================
// LOGOUT
// ==========================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function () {

            await supabaseClient
                .auth
                .signOut();

            window.location.replace(
                "login.html"
            );

        }
    );

}


// ==========================================
// INITIAL LOAD
// ==========================================

loadPreviousTests();

/* =====================================================
   EXAMVERSE
   SAVED ATTEMPTS / BOOKMARK SYSTEM
===================================================== */


/* =====================================================
   SAVE ATTEMPT
===================================================== */

async function saveAttemptBookmark(
    attemptId,
    button
) {

    if (!attemptId) {

        console.error(
            "Missing attempt ID."
        );

        return;

    }


    /* -----------------------------------------
       GET CURRENT USER
    ----------------------------------------- */

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

        alert(
            "Please login again."
        );

        return;

    }


    const user =
        authData.user;


    /* -----------------------------------------
       CHECK WHETHER ALREADY SAVED
    ----------------------------------------- */

    const {
        data: existing,
        error: checkError
    } =
        await supabaseClient

            .from(
                "saved_attempts"
            )

            .select("id")

            .eq(
                "user_id",
                user.id
            )

            .eq(
                "attempt_id",
                attemptId
            )

            .maybeSingle();


    if (checkError) {

        console.error(
            "Bookmark check error:",
            checkError
        );

        alert(
            "Unable to check bookmark."
        );

        return;

    }


    /* -----------------------------------------
       REMOVE IF ALREADY SAVED
    ----------------------------------------- */

    if (existing) {

        const confirmed =
            confirm(
                "Remove this test from Bookmarks?"
            );


        if (!confirmed) {

            return;

        }


        const {
            error
        } =
            await supabaseClient

                .from(
                    "saved_attempts"
                )

                .delete()

                .eq(
                    "id",
                    existing.id
                )

                .eq(
                    "user_id",
                    user.id
                );


        if (error) {

            console.error(
                "Remove bookmark error:",
                error
            );

            alert(
                "Unable to remove bookmark."
            );

            return;

        }


        updateAttemptBookmarkButton(
            button,
            false
        );


        return;

    }


    /* -----------------------------------------
       SAVE
    ----------------------------------------- */

    const {
        error: insertError
    } =
        await supabaseClient

            .from(
                "saved_attempts"
            )

            .insert({

                user_id:
                    user.id,

                attempt_id:
                    attemptId

            });


    if (insertError) {

        console.error(
            "Save bookmark error:",
            insertError
        );


        if (
            insertError.code ===
            "23505"
        ) {

            updateAttemptBookmarkButton(
                button,
                true
            );

            return;

        }


        alert(
            "Unable to save bookmark."
        );

        return;

    }


    updateAttemptBookmarkButton(
        button,
        true
    );

}



/* =====================================================
   UPDATE BUTTON
===================================================== */

function updateAttemptBookmarkButton(
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

            <i class="fa-solid fa-bookmark"></i>

            <span class="bookmarkText">
                Saved
            </span>

        `;

    }

    else {

        button.classList.remove(
            "saved"
        );


        button.innerHTML = `

            <i class="fa-regular fa-bookmark"></i>

            <span class="bookmarkText">
                Save
            </span>

        `;

    }

}



/* =====================================================
   CHECK ALL SAVED ATTEMPTS
===================================================== */

async function loadSavedAttemptIds() {

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

        return new Set();

    }


    const {
        data,
        error
    } =
        await supabaseClient

            .from(
                "saved_attempts"
            )

            .select(
                "attempt_id"
            )

            .eq(
                "user_id",
                authData.user.id
            );


    if (error) {

        console.error(
            "Saved attempts loading error:",
            error
        );

        return new Set();

    }


    return new Set(

        (data || [])
            .map(
                item =>
                    String(
                        item.attempt_id
                    )
            )

    );

}



/* =====================================================
   APPLY BOOKMARK STATUS
===================================================== */

async function applyAttemptBookmarkStatus() {

    const savedIds =
        await loadSavedAttemptIds();


    document
        .querySelectorAll(
            "[data-attempt-bookmark]"
        )
        .forEach(
            button => {

                const attemptId =
                    String(
                        button.dataset
                            .attemptBookmark
                    );


                updateAttemptBookmarkButton(

                    button,

                    savedIds.has(
                        attemptId
                    )

                );

            }
        );

}



/* =====================================================
   CLICK HANDLER
===================================================== */

document.addEventListener(
    "click",
    async function (event) {

        const button =
            event.target.closest(
                "[data-attempt-bookmark]"
            );


        if (!button) {

            return;

        }


        /*
         * VERY IMPORTANT:
         *
         * Bookmark button must NOT
         * trigger the table-row
         * "View Result" click.
         */

        event.preventDefault();

        event.stopPropagation();


        const attemptId =
            button.dataset
                .attemptBookmark;


        button.disabled =
            true;


        try {

            await saveAttemptBookmark(
                attemptId,
                button
            );

        }

        finally {

            button.disabled =
                false;

        }

    }

);