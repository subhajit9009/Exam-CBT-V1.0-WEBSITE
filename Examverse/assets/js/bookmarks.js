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

let allExams = [];



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
   LOAD BOOKMARKS
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

            .from(
                "saved_attempts"
            )

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

}



/* =====================================================
   LOAD SAVED EXAMS
===================================================== */

async function loadSavedExams() {

    const {
        data,
        error
    } =
        await supabaseClient

            .from(
                "saved_exams"
            )

            .select(`
                id,
                exam_id,
                saved_at,
                exams (
                    id,
                    exam_name,
                    total_marks,
                    total_questions,
                    duration,
                    duration_minutes,
                    passing_marks,
                    status
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
            "Saved exams error:",
            error
        );

        savedExams = [];

        return;

    }


    savedExams =
        data || [];

}



/* =====================================================
   SUMMARY
===================================================== */

function updateSummary() {

    const attempts =
        savedAttempts.length;

    const exams =
        savedExams.length;


    document.getElementById(
        "savedAttemptsCount"
    ).textContent =
        attempts;


    document.getElementById(
        "savedExamsCount"
    ).textContent =
        exams;


    document.getElementById(
        "totalSavedCount"
    ).textContent =
        attempts + exams;


    document.getElementById(
        "attemptBadge"
    ).textContent =
        attempts;


    document.getElementById(
        "examBadge"
    ).textContent =
        exams;

}



/* =====================================================
   RENDER SAVED ATTEMPTS
===================================================== */

function renderSavedAttempts() {

    const container =
        document.getElementById(
            "savedAttemptsContainer"
        );


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


    /* SEARCH */

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


    /* RESULT FILTER */

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
                        .toLowerCase();


                    return (
                        result ===
                        filter.toLowerCase()
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


    container.innerHTML =
        items
            .map(
                createAttemptCard
            )
            .join("");

}



/* =====================================================
   CREATE ATTEMPT CARD
===================================================== */

function createAttemptCard(
    item
) {

    const attempt =
        item.exam_attempts;


    if (!attempt) {

        return "";

    }


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
        );


    const isPassed =
        result.toLowerCase()
            === "pass";


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
                    class="
                        saved-btn
                        view-btn
                    "
                    data-view-attempt="
                        ${attempt.id}
                    "
                >

                    <i
                        class="fa-solid fa-chart-simple"
                    ></i>

                    View Result

                </button>


                <button
                    class="
                        saved-btn
                        remove-btn
                    "
                    data-remove-attempt="
                        ${item.id}
                    "
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
   CREATE EXAM CARD
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
                    exam.total_marks !==
                    null &&
                    exam.total_marks !==
                    undefined
                        ? `
                            <span
                                class="stat-pill"
                            >

                                Total Marks

                                <strong>
                                    ${exam.total_marks}
                                </strong>

                            </span>
                        `
                        : ""
                }


                ${
                    exam.passing_marks !==
                    null &&
                    exam.passing_marks !==
                    undefined
                        ? `
                            <span
                                class="stat-pill"
                            >

                                Pass Marks

                                <strong>
                                    ${exam.passing_marks}
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
                    class="
                        saved-btn
                        start-btn
                    "
                    data-start-exam="
                        ${exam.id}
                    "
                >

                    <i
                        class="fa-solid fa-play"
                    ></i>

                    Start Test

                </button>


                <button
                    class="
                        saved-btn
                        remove-btn
                    "
                    data-remove-exam="
                        ${item.id}
                    "
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
   EVENTS
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
            async () => {

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


    const viewAttempt =
        event.target.closest(
            "[data-view-attempt]"
        );


    if (viewAttempt) {

        const attemptId =
            viewAttempt.dataset
                .viewAttempt;


        sessionStorage.setItem(
            "attemptId",
            attemptId
        );


        window.location.href =
            "result.html";


        return;

    }



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

    if (
        !confirm(
            "Remove this attempt from Bookmarks?"
        )
    ) {

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

        console.error(error);

        alert(
            "Unable to remove bookmark."
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

    if (
        !confirm(
            "Remove this exam from Saved Exams?"
        )
    ) {

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

        console.error(error);

        alert(
            "Unable to remove saved exam."
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

    sessionStorage.removeItem(
        "attemptId"
    );

    sessionStorage.removeItem(
        "selectedPreferredExam"
    );


    sessionStorage.setItem(
        "selectedExam",
        examId
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
            () =>
                window.location.href =
                    "dashboard.html"
        );


    document
        .getElementById(
            "sidebarNewTest"
        )
        ?.addEventListener(
            "click",
            () =>
                window.location.href =
                    "exam-list.html"
        );


    document
        .getElementById(
            "sidebarPreviousTests"
        )
        ?.addEventListener(
            "click",
            () =>
                window.location.href =
                    "previous-tests.html"
        );


    document
        .getElementById(
            "sidebarPerformance"
        )
        ?.addEventListener(
            "click",
            () =>
                window.location.href =
                    "performance.html"
        );


    document
        .getElementById(
            "sidebarBookmarks"
        )
        ?.addEventListener(
            "click",
            () =>
                window.location.href =
                    "bookmarks.html"
        );


    document
        .getElementById(
            "sidebarSettings"
        )
        ?.addEventListener(
            "click",
            () =>
                window.location.href =
                    "settings.html"
        );


    document
        .getElementById(
            "sidebarLogout"
        )
        ?.addEventListener(
            "click",
            logoutUser
        );

}



/* =====================================================
   LOGOUT
===================================================== */

async function logoutUser() {

    if (
        !confirm(
            "Logout from ExamVerse?"
        )
    ) {

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
   HELPERS
===================================================== */

function getExamName(
    examId
) {

    const saved =
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
        saved &&
        saved.exams
    ) {

        return saved.exams.exam_name;

    }


    return "Saved Examination";

}



function calculateAccuracy(
    attempt
) {

    const attempted =
        Number(
            attempt.attempted
        ) || 0;


    const correct =
        Number(
            attempt.correct
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



function formatPercent(
    value
) {

    const number =
        Number(value) || 0;


    return (
        number
            .toFixed(2)
            .replace(
                /\.00$/,
                ""
            )
    ) + "%";

}



function formatNumber(
    value
) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
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



function formatTime(
    value
) {

    const seconds =
        Number(value) || 0;


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


    if (hours > 0) {

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



function formatDate(
    value
) {

    if (!value) {

        return "—";

    }


    const date =
        new Date(value);


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

    document.getElementById(
        "savedAttemptsContainer"
    ).innerHTML = `

        <div class="loading-state">

            <div class="mini-spinner"></div>

            Loading saved attempts...

        </div>

    `;


    document.getElementById(
        "savedExamsContainer"
    ).innerHTML = `

        <div class="loading-state">

            <div class="mini-spinner"></div>

            Loading saved exams...

        </div>

    `;

}



/* =====================================================
   ERROR
===================================================== */

function showGlobalError(
    message
) {

    const container =
        document.getElementById(
            "savedAttemptsContainer"
        );


    if (container) {

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

}