/* =========================================================
   EXAMVERSE ADMIN RESULTS
   Permission: results.view
   Read-only admin result management.
   ========================================================= */

let allResults = [];
let filteredResults = [];

let examsById = new Map();
let profilesById = new Map();

let currentPage = 1;
const RESULTS_PER_PAGE = 15;

let selectedAttempt = null;
let selectedAnswers = [];
let selectedQuestions = [];

const $ = id => document.getElementById(id);


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();
}


function firstDefined(
    object,
    keys,
    fallback = null
) {

    for (const key of keys) {

        if (
            object &&
            object[key] !== undefined &&
            object[key] !== null &&
            object[key] !== ""
        ) {
            return object[key];
        }

    }

    return fallback;
}


/* =========================================================
   USER / PROFILE
   ========================================================= */

function getFullName(profile) {

    if (!profile) {
        return "Student";
    }

    const name = [
        profile.first_name,
        profile.middle_name,
        profile.last_name
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return (
        name ||
        profile.full_name ||
        "Student"
    );
}


function getProfile(attempt) {

    if (!attempt?.user_id) {
        return null;
    }

    return (
        profilesById.get(
            String(attempt.user_id)
        ) || null
    );
}


function getStudentName(attempt) {

    return getFullName(
        getProfile(attempt)
    );
}


function getStudentEmail(attempt) {

    const profile =
        getProfile(attempt);

    return (
        profile?.email ||
        profile?.user_email ||
        attempt?.email ||
        "—"
    );
}


/* =========================================================
   DATE / TIME
   ========================================================= */

function getAttemptDate(attempt) {

    return firstDefined(
        attempt,
        [
            "submitted_at",
            "completed_at",
            "finished_at",
            "updated_at",
            "created_at"
        ],
        null
    );
}


function formatDate(value) {

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
        return String(value);
    }

    return date.toLocaleString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function formatTime(seconds) {

    const total =
        Number(seconds || 0);

    if (
        !Number.isFinite(total) ||
        total <= 0
    ) {
        return "00:00:00";
    }

    const hours =
        Math.floor(total / 3600);

    const minutes =
        Math.floor(
            (total % 3600) / 60
        );

    const secs =
        Math.floor(total % 60);

    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
    );
}


/* =========================================================
   EXAM
   ========================================================= */

function getExamName(attempt) {

    return (
        examsById.get(
            String(attempt?.exam_id)
        )?.exam_name ||

        attempt?.exam_name ||

        "Unknown Exam"
    );
}


/* =========================================================
   RESULT CALCULATIONS
   ========================================================= */

function getPercentage(
    attempt,
    exam
) {

    const explicit =
        firstDefined(
            attempt,
            [
                "percentage",
                "percent"
            ],
            null
        );

    if (
        explicit !== null
    ) {

        const number =
            Number(explicit);

        return Number.isFinite(
            number
        )
            ? number
            : 0;
    }

    const score =
        Number(
            attempt?.score || 0
        );

    const totalMarks =
        Number(
            exam?.total_marks || 0
        );

    if (
        totalMarks > 0
    ) {

        return (
            score /
            totalMarks
        ) * 100;
    }

    return 0;
}


function getResultText(
    attempt,
    exam
) {

    const explicit =
        firstDefined(
            attempt,
            [
                "result",
                "outcome"
            ],
            null
        );

    if (explicit) {
        return String(explicit);
    }

    const passingMarks =
        Number(
            exam?.passing_marks || 0
        );

    const score =
        Number(
            attempt?.score || 0
        );

    if (
        passingMarks > 0
    ) {

        return score >= passingMarks
            ? "Passed"
            : "Failed";
    }

    return "Completed";
}


function getResultClass(
    attempt,
    exam
) {

    const result =
        normalize(
            getResultText(
                attempt,
                exam
            )
        );

    if (
        result.includes("pass") ||
        result.includes("success")
    ) {
        return "passed";
    }

    if (
        result.includes("fail") ||
        result.includes("unsuccess")
    ) {
        return "failed";
    }

    return "completed";
}


function getAttemptStatus(attempt) {

    return String(
        attempt?.status ||
        "Completed"
    );
}


function isCompleted(attempt) {

    const status =
        normalize(
            getAttemptStatus(
                attempt
            )
        );

    return (
        status === "completed" ||
        status === "complete" ||
        status === "submitted" ||
        status === "finished" ||
        status === "success"
    );
}


/* =========================================================
   PERMISSION
   ========================================================= */

function hasViewPermission() {

    return (
        window.examVerseAdmin &&
        typeof
            window.examVerseAdmin.hasPermission ===
            "function" &&
        window.examVerseAdmin.hasPermission(
            "results.view"
        ) === true
    );
}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

async function initResultsPage() {

    try {

        if (
            window.examVerseAdminReady
        ) {
            await window.examVerseAdminReady;
        }

    }
    catch (error) {

        console.error(
            "Admin auth initialization error:",
            error
        );

    }


    if (!hasViewPermission()) {

        if ($("resultsContent")) {
            $("resultsContent").hidden =
                true;
        }

        if ($("resultsAccessDenied")) {
            $("resultsAccessDenied").hidden =
                false;
        }

        const resultsNav =
            document.querySelector(
                'a[href="admin-results.html"]'
            );

        if (resultsNav) {
            resultsNav.remove();
        }

        return;
    }


    setupEventListeners();

    await loadResults();
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

    $("refreshResultsBtn")
        ?.addEventListener(
            "click",
            loadResults
        );


    $("resultSearch")
        ?.addEventListener(
            "input",
            applyFilters
        );


    $("examFilter")
        ?.addEventListener(
            "change",
            applyFilters
        );


    $("statusFilter")
        ?.addEventListener(
            "change",
            applyFilters
        );


    $("clearFiltersBtn")
        ?.addEventListener(
            "click",
            clearFilters
        );


    $("exportResultsBtn")
        ?.addEventListener(
            "click",
            exportCSV
        );


    $("prevPageBtn")
        ?.addEventListener(
            "click",
            () => {

                if (
                    currentPage > 1
                ) {

                    currentPage--;

                    renderResults();
                }

            }
        );


    $("nextPageBtn")
        ?.addEventListener(
            "click",
            () => {

                const totalPages =
                    Math.max(
                        1,
                        Math.ceil(
                            filteredResults.length /
                            RESULTS_PER_PAGE
                        )
                    );

                if (
                    currentPage <
                    totalPages
                ) {

                    currentPage++;

                    renderResults();
                }

            }
        );


    $("closeResultDetailBtn")
        ?.addEventListener(
            "click",
            closeResultDetail
        );


    $("closeResultDetailBtnBottom")
        ?.addEventListener(
            "click",
            closeResultDetail
        );


    $("resultDetailModal")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    $("resultDetailModal")
                ) {

                    closeResultDetail();
                }

            }
        );


    $("resultsTableBody")
        ?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        ".result-view-btn"
                    );

                if (!button) {
                    return;
                }

                const attemptId =
                    button.dataset.attemptId;

                openResultDetail(
                    attemptId
                );
            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                $("resultDetailModal") &&
                !$("resultDetailModal").hidden
            ) {

                closeResultDetail();
            }

        }
    );
}


/* =========================================================
   LOAD RESULTS
   ========================================================= */

async function loadResults() {

    if (!hasViewPermission()) {
        return;
    }

    setLoadingState();

    try {

        // ==========================================
        // 1. LOAD COMPLETED EXAM ATTEMPTS
        // ==========================================

        const {
            data: attempts,
            error: attemptsError
        } = await supabaseClient
            .from("exam_attempts")
            .select(`
                id,
                user_id,
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
                start_time,
                end_time,
                submitted_at,
                time_taken,
                created_at
            `)
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
            throw attemptsError;
        }


        // ==========================================
        // 2. LOAD EXAMS
        // ==========================================

        const {
            data: exams,
            error: examsError
        } = await supabaseClient
            .from("exams")
            .select(`
                id,
                exam_name,
                total_marks,
                passing_marks
            `);


        if (examsError) {
            throw examsError;
        }


        // ==========================================
        // 3. BUILD EXAM MAP
        // ==========================================

        examsById =
            new Map(
                (exams || []).map(
                    exam => [
                        String(exam.id),
                        exam
                    ]
                )
            );


        // ==========================================
        // 4. LOAD PROFILES
        // ==========================================

        const userIds = [
            ...new Set(
                (attempts || [])
                    .map(
                        attempt =>
                            attempt.user_id
                    )
                    .filter(Boolean)
            )
        ];


        profilesById =
            new Map();


        if (
            userIds.length > 0
        ) {

            const {
                data: profiles,
                error: profilesError
            } = await supabaseClient
                .from("profiles")
                .select(`
                    id,
                    first_name,
                    middle_name,
                    last_name,
                    full_name,
                    email
                `)
                .in(
                    "id",
                    userIds
                );


            /*
             * Profile access must NOT prevent
             * result records from appearing.
             */

            if (profilesError) {

                console.warn(
                    "Admin Results: profiles unavailable:",
                    profilesError
                );

            }
            else {

                profilesById =
                    new Map(
                        (profiles || []).map(
                            profile => [
                                String(
                                    profile.id
                                ),
                                profile
                            ]
                        )
                    );
            }
        }


        // ==========================================
        // 5. STORE RESULTS
        // ==========================================

        allResults =
            attempts || [];


        filteredResults =
            [...allResults];


        currentPage =
            1;


        // ==========================================
        // 6. UPDATE UI
        // ==========================================

        populateExamFilter();

        updateStats();

        applyFilters();


    }
    catch (error) {

        console.error(
            "ADMIN RESULTS LOAD ERROR:",
            error
        );


        renderTableMessage(
            "Unable to load results.",
            "error"
        );


        if (
            typeof showPopup ===
            "function"
        ) {

            showPopup(
                "error",
                "Results Loading Failed",
                error.message ||
                "Unable to load examination results."
            );

        }
    }
}


/* =========================================================
   EXAM FILTER
   ========================================================= */

function populateExamFilter() {

    const select =
        $("examFilter");

    if (!select) {
        return;
    }


    const current =
        select.value;


    const exams =
        Array.from(
            examsById.values()
        )
            .sort(
                (a, b) =>
                    String(
                        a.exam_name ||
                        ""
                    ).localeCompare(
                        String(
                            b.exam_name ||
                            ""
                        )
                    )
            );


    select.innerHTML =
        `<option value="">All Exams</option>` +

        exams
            .map(
                exam => `
                    <option value="${escapeHTML(
                        exam.id
                    )}">
                        ${escapeHTML(
                            exam.exam_name ||
                            "Unnamed Exam"
                        )}
                    </option>
                `
            )
            .join("");


    if (
        exams.some(
            exam =>
                String(
                    exam.id
                ) ===
                String(current)
        )
    ) {

        select.value =
            current;
    }
}


/* =========================================================
   FILTER
   ========================================================= */

function applyFilters() {

    const search =
        normalize(
            $("resultSearch")
                ?.value
        );


    const examId =
        String(
            $("examFilter")
                ?.value ||
            ""
        );


    const status =
        normalize(
            $("statusFilter")
                ?.value
        );


    filteredResults =
        allResults.filter(
            attempt => {

                const exam =
                    examsById.get(
                        String(
                            attempt.exam_id
                        )
                    );


                const name =
                    normalize(
                        getStudentName(
                            attempt
                        )
                    );


                const email =
                    normalize(
                        getStudentEmail(
                            attempt
                        )
                    );


                const examName =
                    normalize(
                        getExamName(
                            attempt
                        )
                    );


                const resultClass =
                    getResultClass(
                        attempt,
                        exam
                    );


                const attemptStatus =
                    normalize(
                        getAttemptStatus(
                            attempt
                        )
                    );


                const matchesSearch =
                    !search ||

                    name.includes(
                        search
                    ) ||

                    email.includes(
                        search
                    ) ||

                    examName.includes(
                        search
                    );


                const matchesExam =
                    !examId ||

                    String(
                        attempt.exam_id
                    ) ===
                    examId;


                let matchesStatus =
                    true;


                if (
                    status ===
                    "passed"
                ) {

                    matchesStatus =
                        resultClass ===
                        "passed";
                }


                else if (
                    status ===
                    "failed"
                ) {

                    matchesStatus =
                        resultClass ===
                        "failed";
                }


                else if (
                    status ===
                    "completed"
                ) {

                    matchesStatus =
                        attemptStatus ===
                            "completed" ||

                        attemptStatus ===
                            "complete";
                }


                return (
                    matchesSearch &&
                    matchesExam &&
                    matchesStatus
                );
            }
        );


    currentPage =
        1;


    updateStats();

    renderResults();
}


/* =========================================================
   CLEAR FILTERS
   ========================================================= */

function clearFilters() {

    if ($("resultSearch")) {
        $("resultSearch").value =
            "";
    }


    if ($("examFilter")) {
        $("examFilter").value =
            "";
    }


    if ($("statusFilter")) {
        $("statusFilter").value =
            "";
    }


    applyFilters();
}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateStats() {

    const total =
        allResults.length;


    let passed =
        0;

    let failed =
        0;

    let percentageTotal =
        0;


    allResults.forEach(
        attempt => {

            const exam =
                examsById.get(
                    String(
                        attempt.exam_id
                    )
                );


            const resultClass =
                getResultClass(
                    attempt,
                    exam
                );


            if (
                resultClass ===
                "passed"
            ) {

                passed++;
            }


            if (
                resultClass ===
                "failed"
            ) {

                failed++;
            }


            percentageTotal +=
                getPercentage(
                    attempt,
                    exam
                );
        }
    );


    const average =
        total > 0
            ? percentageTotal /
              total
            : 0;


    if ($("totalResults")) {
        $("totalResults")
            .textContent =
            total;
    }


    if ($("passedResults")) {
        $("passedResults")
            .textContent =
            passed;
    }


    if ($("failedResults")) {
        $("failedResults")
            .textContent =
            failed;
    }


    if ($("averageScore")) {
        $("averageScore")
            .textContent =
            `${average.toFixed(1)}%`;
    }
}


/* =========================================================
   RENDER TABLE
   ========================================================= */

function renderResults() {

    const tbody =
        $("resultsTableBody");

    if (!tbody) {
        return;
    }


    const total =
        filteredResults.length;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                RESULTS_PER_PAGE
            )
        );


    if (
        currentPage >
        totalPages
    ) {

        currentPage =
            totalPages;
    }


    const start =
        (
            currentPage -
            1
        ) *
        RESULTS_PER_PAGE;


    const pageResults =
        filteredResults.slice(
            start,
            start +
            RESULTS_PER_PAGE
        );


    if ($("resultCountLabel")) {

        $("resultCountLabel")
            .textContent =
            `${total} result${
                total === 1
                    ? ""
                    : "s"
            }`;
    }


    if ($("pageLabel")) {

        $("pageLabel")
            .textContent =
            `Page ${currentPage} of ${totalPages}`;
    }


    if ($("prevPageBtn")) {

        $("prevPageBtn")
            .disabled =
            currentPage <= 1;
    }


    if ($("nextPageBtn")) {

        $("nextPageBtn")
            .disabled =
            currentPage >=
            totalPages;
    }


    if (
        pageResults.length === 0
    ) {

        renderTableMessage(
            "No examination results found.",
            "empty"
        );

        return;
    }


    tbody.innerHTML =
        pageResults
            .map(
                renderResultRow
            )
            .join("");
}


/* =========================================================
   RESULT ROW
   ========================================================= */

function renderResultRow(
    attempt
) {

    const exam =
        examsById.get(
            String(
                attempt.exam_id
            )
        );


    const score =
        Number(
            attempt.score || 0
        );


    const totalMarks =
        Number(
            exam?.total_marks ||
            0
        );


    const percentage =
        getPercentage(
            attempt,
            exam
        );


    const resultClass =
        getResultClass(
            attempt,
            exam
        );


    const resultText =
        getResultText(
            attempt,
            exam
        );


    const attempted =
        Number(
            attempt.attempted ??
            0
        );


    const correct =
        Number(
            attempt.correct ??
            0
        );


    const wrong =
        Number(
            attempt.wrong ??
            0
        );


    return `
        <tr>

            <td>
                <strong class="results-student-name">
                    ${escapeHTML(
                        getStudentName(
                            attempt
                        )
                    )}
                </strong>
            </td>


            <td>
                <span class="results-student-email">
                    ${escapeHTML(
                        getStudentEmail(
                            attempt
                        )
                    )}
                </span>
            </td>


            <td>
                ${escapeHTML(
                    getExamName(
                        attempt
                    )
                )}
            </td>


            <td>
                <span class="results-score">
                    ${score.toFixed(2)}

                    ${
                        totalMarks > 0
                            ? ` / ${totalMarks}`
                            : ""
                    }
                </span>
            </td>


            <td>
                <span class="results-percentage">
                    ${percentage.toFixed(1)}%
                </span>
            </td>


            <td>
                ${correct}
            </td>


            <td>
                ${wrong}
            </td>


            <td>
                ${attempted}
            </td>


            <td>
                <span class="result-status-badge ${resultClass}">
                    ${escapeHTML(
                        resultText
                    )}
                </span>
            </td>


            <td>
                ${escapeHTML(
                    formatDate(
                        getAttemptDate(
                            attempt
                        )
                    )
                )}
            </td>


            <td>
                <button
                    type="button"
                    class="result-view-btn"
                    data-attempt-id="${escapeHTML(
                        attempt.id
                    )}"
                >
                    <i class="fa-solid fa-eye"></i>
                    View
                </button>
            </td>

        </tr>
    `;
}


/* =========================================================
   TABLE STATES
   ========================================================= */

function setLoadingState() {

    const tbody =
        $("resultsTableBody");

    if (!tbody) {
        return;
    }


    tbody.innerHTML = `
        <tr>
            <td
                colspan="11"
                class="results-loading-cell"
            >
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading results...
            </td>
        </tr>
    `;
}


function renderTableMessage(
    message,
    type
) {

    const tbody =
        $("resultsTableBody");

    if (!tbody) {
        return;
    }


    const className =
        type === "error"
            ? "results-error-cell"
            : type === "empty"
                ? "results-empty-cell"
                : "results-loading-cell";


    tbody.innerHTML = `
        <tr>
            <td
                colspan="11"
                class="${className}"
            >
                ${
                    type === "error"
                        ? '<i class="fa-solid fa-circle-exclamation"></i> '
                        : ""
                }

                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}


/* =========================================================
   RESULT DETAIL
   ========================================================= */

async function openResultDetail(
    attemptId
) {

    if (
        !hasViewPermission()
    ) {
        return;
    }


    const attempt =
        allResults.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    attemptId
                )
        );


    if (!attempt) {
        return;
    }


    selectedAttempt =
        attempt;


    const exam =
        examsById.get(
            String(
                attempt.exam_id
            )
        );


    $("detailExamName")
        .textContent =
        getExamName(
            attempt
        );


    $("detailStudentName")
        .textContent =
        getStudentName(
            attempt
        );


    $("detailScore")
        .textContent =
        Number(
            attempt.score || 0
        ).toFixed(2);


    $("detailPercentage")
        .textContent =
        `${getPercentage(
            attempt,
            exam
        ).toFixed(1)}%`;


    $("detailCorrect")
        .textContent =
        Number(
            attempt.correct ??
            0
        );


    $("detailWrong")
        .textContent =
        Number(
            attempt.wrong ??
            0
        );


    $("detailAttempted")
        .textContent =
        Number(
            attempt.attempted ??
            0
        );


    $("detailTimeTaken")
        .textContent =
        formatTime(
            attempt.time_taken
        );


    $("detailEmail")
        .textContent =
        getStudentEmail(
            attempt
        );


    $("detailResult")
        .textContent =
        getResultText(
            attempt,
            exam
        );


    $("detailStatus")
        .textContent =
        getAttemptStatus(
            attempt
        );


    $("detailSubmitted")
        .textContent =
        formatDate(
            getAttemptDate(
                attempt
            )
        );


    $("detailQuestions")
        .innerHTML = `
            <div class="detail-empty">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading question analysis...
            </div>
        `;


    $("resultDetailModal")
        .hidden =
        false;


    document.body.style.overflow =
        "hidden";


    await loadQuestionAnalysis(
        attempt
    );
}


/* =========================================================
   QUESTION ANALYSIS
   ========================================================= */

async function loadQuestionAnalysis(
    attempt
) {

    selectedAnswers = [];

    selectedQuestions = [];


    try {

        const [
            answersResult,
            questionsResult
        ] = await Promise.all([

            supabaseClient
                .from("user_answers")
                .select("*")
                .eq(
                    "attempt_id",
                    attempt.id
                ),

            supabaseClient
                .from("questions")
                .select("*")
                .eq(
                    "exam_id",
                    attempt.exam_id
                )

        ]);


        if (
            answersResult.error
        ) {

            throw answersResult.error;
        }


        if (
            questionsResult.error
        ) {

            throw questionsResult.error;
        }


        selectedAnswers =
            answersResult.data ||
            [];


        selectedQuestions =
            questionsResult.data ||
            [];


        renderQuestionAnalysis();

    }
    catch (error) {

        console.error(
            "Result Question Analysis Error:",
            error
        );


        if ($("detailQuestions")) {

            $("detailQuestions")
                .innerHTML = `
                    <div class="detail-empty">
                        Unable to load question analysis.
                    </div>
                `;
        }
    }
}


function getQuestionText(
    question
) {

    return firstDefined(
        question,
        [
            "question_text",
            "question",
            "text"
        ],
        "Question"
    );
}


function getCorrectAnswer(
    question
) {

    return firstDefined(
        question,
        [
            "correct_answer",
            "correct_option",
            "correctAnswer",
            "answer"
        ],
        ""
    );
}


function findAnswer(
    questionId
) {

    return selectedAnswers.find(
        answer =>
            String(
                answer.question_id
            ) ===
            String(
                questionId
            )
    );
}


function renderQuestionAnalysis() {

    const container =
        $("detailQuestions");

    if (!container) {
        return;
    }


    if (
        !selectedQuestions.length
    ) {

        $("detailQuestionCount")
            .textContent =
            "0 questions";


        container.innerHTML = `
            <div class="detail-empty">
                No question analysis is available for this result.
            </div>
        `;

        return;
    }


    $("detailQuestionCount")
        .textContent =
        `${selectedQuestions.length} question${
            selectedQuestions.length ===
            1
                ? ""
                : "s"
        }`;


    container.innerHTML =
        selectedQuestions
            .map(
                (
                    question,
                    index
                ) => {

                    const answer =
                        findAnswer(
                            question.id
                        );


                    const selected =
                        answer?.selected_option ??
                        answer?.selected_answer ??
                        "";


                    const correct =
                        getCorrectAnswer(
                            question
                        );


                    const isSkipped =
                        selected === null ||
                        selected === undefined ||
                        String(
                            selected
                        ).trim() === "";


                    const isCorrect =
                        !isSkipped &&

                        normalize(
                            selected
                        ) ===

                        normalize(
                            correct
                        );


                    const state =
                        isSkipped
                            ? "Skipped"
                            : isCorrect
                                ? "Correct"
                                : "Wrong";


                    const stateClass =
                        isSkipped
                            ? "skipped"
                            : isCorrect
                                ? "correct"
                                : "wrong";


                    return `
                        <div class="detail-question-card">

                            <div class="detail-question-top">

                                <span class="detail-question-number">
                                    Question ${index + 1}
                                </span>

                                <span class="detail-question-state ${stateClass}">
                                    ${state}
                                </span>

                            </div>


                            <div class="detail-question-text">
                                ${escapeHTML(
                                    getQuestionText(
                                        question
                                    )
                                )}
                            </div>


                            <div class="detail-answer-line">

                                <span>
                                    Selected Answer
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        isSkipped
                                            ? "Not answered"
                                            : String(
                                                selected
                                            )
                                    )}
                                </strong>

                            </div>


                            <div class="detail-answer-line">

                                <span>
                                    Correct Answer
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        correct ||
                                        "—"
                                    )}
                                </strong>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   CLOSE DETAIL
   ========================================================= */

function closeResultDetail() {

    if (
        $("resultDetailModal")
    ) {

        $("resultDetailModal")
            .hidden =
            true;
    }


    document.body.style.overflow =
        "";
}


/* =========================================================
   CSV EXPORT
   ========================================================= */

function exportCSV() {

    if (
        !hasViewPermission()
    ) {
        return;
    }


    if (
        !filteredResults.length
    ) {

        if (
            typeof showPopup ===
            "function"
        ) {

            showPopup(
                "info",
                "Nothing to Export",
                "There are no results matching the current filters."
            );
        }

        return;
    }


    const headers = [

        "Student",

        "Email",

        "Exam",

        "Score",

        "Total Marks",

        "Percentage",

        "Correct",

        "Wrong",

        "Attempted",

        "Status",

        "Result",

        "Submitted"

    ];


    const rows =
        filteredResults.map(
            attempt => {

                const exam =
                    examsById.get(
                        String(
                            attempt.exam_id
                        )
                    );


                return [

                    getStudentName(
                        attempt
                    ),

                    getStudentEmail(
                        attempt
                    ),

                    getExamName(
                        attempt
                    ),

                    Number(
                        attempt.score ||
                        0
                    ).toFixed(2),

                    exam?.total_marks ??
                    "",

                    getPercentage(
                        attempt,
                        exam
                    ).toFixed(1),

                    Number(
                        attempt.correct ??
                        0
                    ),

                    Number(
                        attempt.wrong ??
                        0
                    ),

                    Number(
                        attempt.attempted ??
                        0
                    ),

                    getAttemptStatus(
                        attempt
                    ),

                    getResultText(
                        attempt,
                        exam
                    ),

                    formatDate(
                        getAttemptDate(
                            attempt
                        )
                    )

                ];
            }
        );


    const csv =
        [
            headers,
            ...rows
        ]
            .map(
                row =>
                    row
                        .map(
                            csvEscape
                        )
                        .join(",")
            )
            .join("\n");


    const blob =
        new Blob(
            [
                "\uFEFF" +
                csv
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `examverse-results-${new Date()
            .toISOString()
            .slice(
                0,
                10
            )}.csv`;


    link.style.display =
        "none";


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    /*
     * Give the browser time to
     * finish the download before
     * releasing the object URL.
     */
    setTimeout(
        () => {
            URL.revokeObjectURL(
                url
            );
        },
        1000
    );
}


function csvEscape(value) {

    const text =
        String(
            value ?? ""
        );

    return (
        '"' +
        text.replace(
            /"/g,
            '""'
        ) +
        '"'
    );
}


/* =========================================================
   START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initResultsPage
    );

}
else {

    initResultsPage();

}