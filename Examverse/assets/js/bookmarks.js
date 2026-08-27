/* =====================================================
   ExamVerse
   Professional Bookmark System

   SAVED ATTEMPTS
   SAVED EXAMS
===================================================== */


/* =====================================================
   GLOBAL STATE
===================================================== */

let currentUser = null;

let savedAttempts = [];

let savedExams = [];

let savedAttemptExamMap = new Map();


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initBookmarks
);


async function initBookmarks() {

    try {

        await getCurrentUser();

        if (!currentUser) {
            return;
        }

        await loadBookmarks();

        setupControls();

        setupSidebar();

    }

    catch (error) {

        console.error(
            "Bookmarks initialization error:",
            error
        );

        showGlobalError(
            "Unable to load bookmarks."
        );

    }

}


/* =====================================================
   AUTH
===================================================== */

async function getCurrentUser() {

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getUser();


    if (
        error ||
        !data ||
        !data.user
    ) {

        window.location.replace(
            "login.html"
        );

        return;

    }


    currentUser =
        data.user;

}


/* =====================================================
   LOAD ALL BOOKMARKS
===================================================== */

async function loadBookmarks() {

    showLoading();

    await Promise.all([
        loadSavedAttempts(),
        loadSavedExams()
    ]);

    updateSummary();

    renderSavedAttempts();

    renderSavedExams();

}


/* =====================================================
   LOAD SAVED ATTEMPTS
===================================================== */

async function loadSavedAttempts() {

    const {
        data,
        error
    } =
        await supabaseClient

            .from("saved_attempts")

            .select(`
                id,
                attempt_id,
                saved_at,

                exam_attempts (
                    id,
                    exam_id,
                    score,
                    percentage,
                    attempted,
                    correct,
                    wrong,
                    skipped,
                    total_questions,
                    result,
                    status,
                    submitted_at,
                    time_taken
                )
            `)

            .eq(
                "user_id",
                currentUser.id
            )

            .order(
                "saved_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Saved attempts error:",
            error
        );

        savedAttempts = [];

        return;

    }


    savedAttempts =
        data || [];


    /* =================================================
       IMPORTANT

       Load the exam information separately.

       A saved attempt is NOT the same thing as
       a saved exam.

       Therefore we MUST NOT depend on saved_exams
       to get the exam name.
    ================================================= */

    savedAttemptExamMap =
        new Map();


    const examIds = [
        ...new Set(

            savedAttempts

                .map(
                    item =>
                        item
                            .exam_attempts
                            ?.exam_id
                )

                .filter(Boolean)

        )
    ];


    if (
        examIds.length === 0
    ) {

        return;

    }


    const {
        data: exams,
        error: examError
    } =
        await supabaseClient

            .from("exams")

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
            "Saved attempt exam information error:",
            examError
        );

        return;

    }


    (exams || []).forEach(
        exam => {

            savedAttemptExamMap.set(

                String(
                    exam.id
                ),

                exam

            );

        }
    );

}


/* =====================================================
   LOAD SAVED EXAMS
===================================================== */

async function loadSavedExams() {

    // ==========================================
    // GET SAVED EXAM RECORDS
    // ==========================================

    const {
        data: savedData,
        error: savedError
    } =
        await supabaseClient

            .from("saved_exams")

            .select(`
                id,
                exam_id,
                saved_at
            `)

            .eq(
                "user_id",
                currentUser.id
            )

            .order(
                "saved_at",
                {
                    ascending: false
                }
            );


    if (savedError) {

        console.error(
            "Saved exams error:",
            savedError
        );

        savedExams = [];

        return;

    }


    // ==========================================
    // NOTHING SAVED
    // ==========================================

    if (
        !savedData ||
        savedData.length === 0
    ) {

        savedExams = [];

        return;

    }


    // ==========================================
    // GET EXAM IDs
    // ==========================================

    const examIds = [
        ...new Set(

            savedData

                .map(
                    item =>
                        item.exam_id
                )

                .filter(Boolean)

        )
    ];


    if (
        examIds.length === 0
    ) {

        savedExams = [];

        return;

    }


    // ==========================================
    // GET REAL EXAM INFORMATION
    // ==========================================

    const {
        data: exams,
        error: examError
    } =
        await supabaseClient

            .from("exams")

            .select(`
                id,
                exam_name,
                total_marks,
                total_questions,
                duration,
                passing_marks,
                status
            `)

            .in(
                "id",
                examIds
            );


    if (examError) {

        console.error(
            "Saved exam details error:",
            examError
        );

        savedExams = [];

        return;

    }


    // ==========================================
    // COMBINE SAVED RECORD + EXAM INFORMATION
    // ==========================================

    const examMap =
        new Map();


    (exams || []).forEach(
        exam => {

            examMap.set(
                String(exam.id),
                exam
            );

        }
    );


    savedExams =
        savedData

            .map(
                item => {

                    const exam =
                        examMap.get(
                            String(
                                item.exam_id
                            )
                        );


                    if (!exam) {

                        return null;

                    }


                    return {

                        id:
                            item.id,

                        exam_id:
                            item.exam_id,

                        saved_at:
                            item.saved_at,

                        exams:
                            exam

                    };

                }
            )

            .filter(Boolean);


    console.log(
        "Saved exams loaded:",
        savedExams
    );

    console.log(
    "SAVED EXAMS COUNT:",
    savedExams.length
);

console.log(
    "SAVED EXAMS DATA:",
    JSON.stringify(
        savedExams,
        null,
        2
    )
);

}


/* =====================================================
   SUMMARY
===================================================== */

function updateSummary() {

    const attempts =
        savedAttempts.length;


    const exams =
        savedExams.length;


    const attemptsCount =
        document.getElementById(
            "savedAttemptsCount"
        );


    const examsCount =
        document.getElementById(
            "savedExamsCount"
        );


    const totalCount =
        document.getElementById(
            "totalSavedCount"
        );


    const attemptBadge =
        document.getElementById(
            "attemptBadge"
        );


    const examBadge =
        document.getElementById(
            "examBadge"
        );


    if (attemptsCount) {

        attemptsCount.textContent =
            attempts;

    }


    if (examsCount) {

        examsCount.textContent =
            exams;

    }


    if (totalCount) {

        totalCount.textContent =
            attempts + exams;

    }


    if (attemptBadge) {

        attemptBadge.textContent =
            attempts;

    }


    if (examBadge) {

        examBadge.textContent =
            exams;

    }

}


/* =====================================================
   RENDER SAVED ATTEMPTS
===================================================== */

function renderSavedAttempts() {

    const container =
        document.getElementById(
            "savedAttemptsContainer"
        );


    if (!container) {
        return;
    }


    const search =
        (
            document.getElementById(
                "attemptSearch"
            )?.value || ""
        )
            .trim()
            .toLowerCase();


    const filter =
        document.getElementById(
            "attemptFilter"
        )?.value || "";


    let items =
        [...savedAttempts];


    /* =================================================
       SEARCH
    ================================================= */

    if (search) {

        items =
            items.filter(
                item => {

                    const attempt =
                        item.exam_attempts;


                    const examName =
                        getExamName(
                            attempt?.exam_id
                        );


                    return (

                        examName
                            .toLowerCase()
                            .includes(
                                search
                            )

                        ||

                        String(
                            attempt?.score ?? ""
                        )
                            .includes(
                                search
                            )

                    );

                }
            );

    }


    /* =================================================
       RESULT FILTER
    ================================================= */

    if (filter) {

        items =
            items.filter(
                item => {

                    const result =
                        String(
                            item
                                .exam_attempts
                                ?.result || ""
                        )
                            .trim()
                            .toLowerCase();


                    return (
                        result ===
                        filter
                            .toLowerCase()
                    );

                }
            );

    }


    /* =================================================
       EMPTY
    ================================================= */

    if (
        items.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">

                    <i class="fa-solid fa-file-circle-check"></i>

                </div>

                <h3>

                    ${
                        savedAttempts.length
                            ? "No Matching Attempts"
                            : "No Saved Attempts Yet"
                    }

                </h3>

                <p>

                    ${
                        savedAttempts.length

                            ? "Try changing your search or filter."

                            : "Save a completed test from Previous Tests to access it quickly here."
                    }

                </p>


                ${
                    savedAttempts.length

                        ? ""

                        : `

                            <a
                                href="previous-tests.html"
                                class="empty-action"
                            >
                                View Previous Tests
                            </a>

                        `
                }

            </div>

        `;

        return;

    }


    /* =================================================
       RENDER
    ================================================= */

    container.innerHTML =
        items
            .map(
                createAttemptCard
            )
            .join("");

}


/* =====================================================
   CREATE SAVED ATTEMPT CARD
===================================================== */

function createAttemptCard(
    item
) {

    const attempt =
        item.exam_attempts;


    if (!attempt) {

        return "";

    }


    /* =================================================
       GET REAL EXAM NAME
    ================================================= */

    const examName =
        getExamName(
            attempt.exam_id
        );


    const percentage =
        Number(
            attempt.percentage
        ) || 0;


    const accuracy =
        calculateAccuracy(
            attempt
        );


    const result =
        String(
            attempt.result ||
            "Completed"
        )
            .trim();


    const isPassed =
        result.toLowerCase() ===
        "pass";


    const statusClass =
        isPassed
            ? "status-pass"
            : "status-fail";


    const date =
        formatDate(
            attempt.submitted_at
        );


    const savedDate =
        formatDate(
            item.saved_at
        );


    const time =
        formatTime(
            attempt.time_taken
        );


    return `

        <article
            class="saved-card"
        >

            <div
                class="saved-card-top"
            >

                <div
                    class="saved-title"
                >

                    <div
                        class="saved-title-icon"
                    >

                        <i
                            class="fa-solid fa-file-circle-check"
                        ></i>

                    </div>


                    <div>

                        <h3>

                            ${escapeHTML(
                                examName
                            )}

                        </h3>


                        <p>

                            Completed
                            ${date}

                            • Saved
                            ${savedDate}

                        </p>

                    </div>

                </div>


                <span
                    class="
                        status-badge
                        ${statusClass}
                    "
                >

                    <i
                        class="
                            fa-solid
                            ${
                                isPassed
                                    ? "fa-circle-check"
                                    : "fa-circle-xmark"
                            }
                        "
                    ></i>


                    ${
                        isPassed
                            ? "Passed"
                            : "Failed"
                    }

                </span>

            </div>


            <div
                class="saved-stats"
            >

                <span
                    class="stat-pill"
                >

                    Score

                    <strong>

                        ${formatNumber(
                            attempt.score
                        )}

                    </strong>

                </span>


                <span
                    class="stat-pill"
                >

                    Percentage

                    <strong>

                        ${formatPercent(
                            percentage
                        )}

                    </strong>

                </span>


                <span
                    class="stat-pill"
                >

                    Accuracy

                    <strong>

                        ${formatPercent(
                            accuracy
                        )}

                    </strong>

                </span>


                <span
                    class="stat-pill"
                >

                    Attempted

                    <strong>

                        ${
                            Number(
                                attempt.attempted
                            ) || 0
                        }

                    </strong>

                </span>


                <span
                    class="stat-pill"
                >

                    Time

                    <strong>

                        ${time}

                    </strong>

                </span>

            </div>


            <div
                class="saved-actions"
            >

                <button
                    type="button"
                    class="
                        saved-btn
                        view-btn
                    "
                    data-view-attempt="${escapeHTML(
                        String(
                            attempt.id
                        )
                    )}"
                >

                    <i
                        class="fa-solid fa-chart-simple"
                    ></i>

                    View Result

                </button>


                <button
                    type="button"
                    class="
                        saved-btn
                        remove-btn
                    "
                    data-remove-attempt="${escapeHTML(
                        String(
                            item.id
                        )
                    )}"
                >

                    <i
                        class="fa-solid fa-bookmark-slash"
                    ></i>

                    Remove

                </button>

            </div>

        </article>

    `;

}


/* =====================================================
   RENDER SAVED EXAMS
===================================================== */

function renderSavedExams() {

    const container =
        document.getElementById(
            "savedExamsContainer"
        );


    if (!container) {
        return;
    }


    const search =
        (
            document.getElementById(
                "examSearch"
            )?.value || ""
        )
            .trim()
            .toLowerCase();


    let items =
        [...savedExams];


    if (search) {

        items =
            items.filter(
                item => {

                    const exam =
                        item.exams;


                    return (

                        exam &&

                        String(
                            exam.exam_name
                        )
                            .toLowerCase()
                            .includes(
                                search
                            )

                    );

                }
            );

    }


    if (
        items.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">

                    <i class="fa-solid fa-bookmark"></i>

                </div>


                <h3>

                    ${
                        savedExams.length
                            ? "No Matching Exams"
                            : "No Saved Exams Yet"
                    }

                </h3>


                <p>

                    ${
                        savedExams.length
                            ? "Try another search."
                            : "Save an exam from the Exam List when you want to take it later."
                    }

                </p>


                ${
                    savedExams.length
                        ? ""

                        : `

                            <a
                                href="exam-list.html"
                                class="empty-action"
                            >
                                Browse Exams
                            </a>

                        `
                }

            </div>

        `;

        return;

    }


    container.innerHTML =
        items
            .map(
                createExamCard
            )
            .join("");

}


/* =====================================================
   CREATE SAVED EXAM CARD
===================================================== */

function createExamCard(
    item
) {

    const exam =
        item.exams;


    if (!exam) {

        return "";

    }


    const totalQuestions =
        Number(
            exam.total_questions
        ) || 0;


    const duration =
        Number(
            exam.duration_minutes ??
            exam.duration ??
            0
        );


    const savedDate =
        formatDate(
            item.saved_at
        );


    return `

        <article
            class="saved-card"
        >

            <div
                class="saved-card-top"
            >

                <div
                    class="saved-title"
                >

                    <div
                        class="saved-title-icon"
                    >

                        <i
                            class="fa-solid fa-book-open"
                        ></i>

                    </div>


                    <div>

                        <h3>

                            ${escapeHTML(
                                exam.exam_name
                            )}

                        </h3>


                        <p>

                            Saved
                            ${savedDate}

                        </p>

                    </div>

                </div>


                <span
                    class="status-badge status-pass"
                >

                    <i
                        class="fa-solid fa-bookmark"
                    ></i>

                    Saved for Later

                </span>

            </div>


            <div
                class="saved-stats"
            >

                ${
                    totalQuestions

                        ? `

                            <span
                                class="stat-pill"
                            >

                                Questions

                                <strong>
                                    ${totalQuestions}
                                </strong>

                            </span>

                        `

                        : ""
                }


                ${
                    duration

                        ? `

                            <span
                                class="stat-pill"
                            >

                                Duration

                                <strong>
                                    ${duration} min
                                </strong>

                            </span>

                        `

                        : ""
                }


                ${
                    exam.total_marks !== null &&
                    exam.total_marks !== undefined

                        ? `

                            <span
                                class="stat-pill"
                            >

                                Total Marks

                                <strong>
                                    ${escapeHTML(
                                        exam.total_marks
                                    )}
                                </strong>

                            </span>

                        `

                        : ""
                }


                ${
                    exam.passing_marks !== null &&
                    exam.passing_marks !== undefined

                        ? `

                            <span
                                class="stat-pill"
                            >

                                Pass Marks

                                <strong>
                                    ${escapeHTML(
                                        exam.passing_marks
                                    )}
                                </strong>

                            </span>

                        `

                        : ""
                }

            </div>


            <div
                class="saved-actions"
            >

                <button
                    type="button"
                    class="
                        saved-btn
                        start-btn
                    "
                    data-start-exam="${escapeHTML(
                        String(
                            exam.id
                        )
                    )}"
                >

                    <i
                        class="fa-solid fa-play"
                    ></i>

                    Start Test

                </button>


                <button
                    type="button"
                    class="
                        saved-btn
                        remove-btn
                    "
                    data-remove-exam="${escapeHTML(
                        String(
                            item.id
                        )
                    )}"
                >

                    <i
                        class="fa-solid fa-bookmark-slash"
                    ></i>

                    Remove

                </button>

            </div>

        </article>

    `;

}


/* =====================================================
   CONTROLS
===================================================== */

function setupControls() {


    document
        .getElementById(
            "attemptSearch"
        )
        ?.addEventListener(
            "input",
            renderSavedAttempts
        );


    document
        .getElementById(
            "attemptFilter"
        )
        ?.addEventListener(
            "change",
            renderSavedAttempts
        );


    document
        .getElementById(
            "examSearch"
        )
        ?.addEventListener(
            "input",
            renderSavedExams
        );


    document
        .getElementById(
            "refreshBtn"
        )
        ?.addEventListener(
            "click",
            async function () {

                await loadBookmarks();

            }
        );


    document.addEventListener(
        "click",
        handleBookmarkActions
    );

}


/* =====================================================
   ACTION HANDLER
===================================================== */

async function handleBookmarkActions(
    event
) {


    /* =================================================
       VIEW SAVED ATTEMPT RESULT
    ================================================= */

    const viewAttempt =
        event.target.closest(
            "[data-view-attempt]"
        );


    if (viewAttempt) {

        const attemptId =
            viewAttempt.dataset
                .viewAttempt;


        if (!attemptId) {
            return;
        }


        /*
         * result.js primarily reads attemptId.
         *
         * Previous Tests also uses resultAttemptId.
         * Store all three for compatibility.
         */

        sessionStorage.setItem(
            "attemptId",
            String(
                attemptId
            )
        );


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


        window.location.href =
            "result.html";


        return;

    }


    /* =================================================
       REMOVE SAVED ATTEMPT
    ================================================= */

    const removeAttempt =
        event.target.closest(
            "[data-remove-attempt]"
        );


    if (removeAttempt) {

        await removeSavedAttempt(
            removeAttempt.dataset
                .removeAttempt
        );

        return;

    }


    /* =================================================
       START SAVED EXAM
    ================================================= */

    const startExam =
        event.target.closest(
            "[data-start-exam]"
        );


    if (startExam) {

        startSavedExam(
            startExam.dataset
                .startExam
        );

        return;

    }


    /* =================================================
       REMOVE SAVED EXAM
    ================================================= */

    const removeExam =
        event.target.closest(
            "[data-remove-exam]"
        );


    if (removeExam) {

        await removeSavedExam(
            removeExam.dataset
                .removeExam
        );

        return;

    }

}


/* =====================================================
   REMOVE SAVED ATTEMPT
===================================================== */

async function removeSavedAttempt(
    bookmarkId
) {

    const confirmed = await showConfirm(
    "Remove Saved Attempt?",
    "Are you sure you want to remove this attempt from your bookmarks?",
    null,
    {
        confirmText: "Remove",
        cancelText: "Cancel"
    }
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
                bookmarkId
            )

            .eq(
                "user_id",
                currentUser.id
            );


    if (error) {

        console.error(
            "Remove saved attempt error:",
            error
        );

        showPopup(
    "error",
    "Unable to Remove",
    "We couldn't remove this bookmark. Please try again."
);

        return;

    }


    await loadBookmarks();

}


/* =====================================================
   REMOVE SAVED EXAM
===================================================== */

async function removeSavedExam(
    bookmarkId
) {

    const confirmed = await showConfirm(
    "Remove Saved Exam?",
    "Are you sure you want to remove this exam from your saved exams?",
    null,
    {
        confirmText: "Remove",
        cancelText: "Cancel"
    }
);

if (!confirmed) {

    return;

}


    const {
        error
    } =
        await supabaseClient

            .from(
                "saved_exams"
            )

            .delete()

            .eq(
                "id",
                bookmarkId
            )

            .eq(
                "user_id",
                currentUser.id
            );


    if (error) {

        console.error(
            "Remove saved exam error:",
            error
        );

        showPopup(
    "error",
    "Unable to Remove",
    "We couldn't remove this bookmark. Please try again."
);

        return;

    }


    await loadBookmarks();

}


/* =====================================================
   START SAVED EXAM
===================================================== */

function startSavedExam(
    examId
) {

    if (!examId) {
        return;
    }


    /*
     * A saved exam is starting a NEW attempt.
     * Do not reuse the previous attempt ID.
     */

    sessionStorage.removeItem(
        "attemptId"
    );


    sessionStorage.removeItem(
        "resultAttemptId"
    );


    sessionStorage.removeItem(
        "attemptStartedFresh"
    );


    sessionStorage.setItem(
        "selectedExam",
        String(
            examId
        )
    );


    window.location.href =
        "instructions.html";

}


/* =====================================================
   SIDEBAR
===================================================== */

function setupSidebar() {


    document
        .getElementById(
            "sidebarDashboard"
        )
        ?.addEventListener(
            "click",
            function () {

                window.location.href =
                    "dashboard.html";

            }
        );


    document
    .getElementById(
        "sidebarNewTest"
    )
    ?.addEventListener(
        "click",
        function () {

            sessionStorage.removeItem(
                "selectedPreferredExam"
            );

            window.location.href =
                "exam-list.html";

        }
    );

    document
        .getElementById(
            "sidebarPreviousTests"
        )
        ?.addEventListener(
            "click",
            function () {

                window.location.href =
                    "previous-tests.html";

            }
        );


    document
        .getElementById(
            "sidebarPerformance"
        )
        ?.addEventListener(
            "click",
            function () {

                window.location.href =
                    "performance.html";

            }
        );


    document
        .getElementById(
            "sidebarBookmarks"
        )
        ?.addEventListener(
            "click",
            function () {

                window.location.href =
                    "bookmarks.html";

            }
        );


    document
        .getElementById(
            "sidebarSettings"
        )
        ?.addEventListener(
            "click",
            function () {

                window.location.href =
                    "settings.html";

            }
        );



}


/* =====================================================
   LOGOUT
===================================================== */

async function logoutUser() {

    const confirmed = await showConfirm(
        "Logout from ExamVerse?",
        "Are you sure you want to log out of your ExamVerse account?",
        null,
        {
            confirmText: "Logout",
            cancelText: "Cancel"
        }
    );

    if (!confirmed) {

        return;

    }


    try {

        const {
            error
        } =
            await supabaseClient
                .auth
                .signOut();


        if (error) {

            console.error(
                "Supabase Logout Error:",
                error
            );

        }


        sessionStorage.clear();


        window.location.replace(
            "login.html"
        );

    }

    catch (error) {

        console.error(
            "Logout error:",
            error
        );


        window.location.replace(
            "login.html"
        );

    }

}


/* =====================================================
   GET REAL EXAM NAME
===================================================== */

function getExamName(
    examId
) {

    if (!examId) {

        return "Unknown Examination";

    }


    /*
     * PRIMARY SOURCE
     *
     * Exam information loaded directly from
     * the exams table using exam_attempts.exam_id.
     *
     * This is the important fix.
     */

    const attemptExam =
        savedAttemptExamMap.get(
            String(
                examId
            )
        );


    if (
        attemptExam &&
        attemptExam.exam_name
    ) {

        return String(
            attemptExam.exam_name
        );

    }


    /*
     * SECONDARY FALLBACK
     *
     * The exam might also be present in
     * saved_exams.
     */

    const savedExam =
        savedExams.find(
            item =>
                String(
                    item.exam_id
                ) ===
                String(
                    examId
                )
        );


    if (
        savedExam &&
        savedExam.exams &&
        savedExam.exams.exam_name
    ) {

        return String(
            savedExam.exams.exam_name
        );

    }


    return "Unknown Examination";

}


/* =====================================================
   ACCURACY
===================================================== */

function calculateAccuracy(
    attempt
) {

    const attempted =
        Number(
            attempt?.attempted
        ) || 0;


    const correct =
        Number(
            attempt?.correct
        ) || 0;


    if (
        attempted <= 0
    ) {

        return 0;

    }


    return (
        correct /
        attempted
    ) * 100;

}


/* =====================================================
   FORMAT PERCENT
===================================================== */

function formatPercent(
    value
) {

    const number =
        Number(
            value
        ) || 0;


    return (
        number
            .toFixed(2)
            .replace(
                /\.00$/,
                ""
            )
    ) + "%";

}


/* =====================================================
   FORMAT NUMBER
===================================================== */

function formatNumber(
    value
) {

    const number =
        Number(
            value
        );


    if (
        Number.isNaN(
            number
        )
    ) {

        return "0";

    }


    return number
        .toFixed(2)
        .replace(
            /\.00$/,
            ""
        );

}


/* =====================================================
   FORMAT TIME
===================================================== */

function formatTime(
    value
) {

    const seconds =
        Number(
            value
        ) || 0;


    if (
        seconds <= 0
    ) {

        return "—";

    }


    const hours =
        Math.floor(
            seconds / 3600
        );


    const minutes =
        Math.floor(
            (
                seconds % 3600
            ) / 60
        );


    const secs =
        Math.floor(
            seconds % 60
        );


    if (
        hours > 0
    ) {

        return (

            String(
                hours
            )
                .padStart(
                    2,
                    "0"
                )

            +

            ":"

            +

            String(
                minutes
            )
                .padStart(
                    2,
                    "0"
                )

            +

            ":"

            +

            String(
                secs
            )
                .padStart(
                    2,
                    "0"
                )

        );

    }


    return (

        String(
            minutes
        )
            .padStart(
                2,
                "0"
            )

        +

        ":"

        +

        String(
            secs
        )
            .padStart(
                2,
                "0"
            )

    );

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(
    value
) {

    if (!value) {

        return "—";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

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


/* =====================================================
   LOADING
===================================================== */

function showLoading() {

    const attemptsContainer =
        document.getElementById(
            "savedAttemptsContainer"
        );


    const examsContainer =
        document.getElementById(
            "savedExamsContainer"
        );


    if (attemptsContainer) {

        attemptsContainer.innerHTML = `

            <div class="loading-state">

                <div class="mini-spinner"></div>

                Loading saved attempts...

            </div>

        `;

    }


    if (examsContainer) {

        examsContainer.innerHTML = `

            <div class="loading-state">

                <div class="mini-spinner"></div>

                Loading saved exams...

            </div>

        `;

    }

}


/* =====================================================
   GLOBAL ERROR
===================================================== */

function showGlobalError(
    message
) {

    const container =
        document.getElementById(
            "savedAttemptsContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">

                <i
                    class="fa-solid fa-triangle-exclamation"
                ></i>

            </div>


            <h3>
                Something went wrong
            </h3>


            <p>

                ${escapeHTML(
                    message
                )}

            </p>

        </div>

    `;

}