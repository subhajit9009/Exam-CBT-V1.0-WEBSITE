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
let selectedSectionResults = [];

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
} =
    await supabaseClient.rpc(
        "get_admin_results"
    );

if (attemptsError) {
    throw attemptsError;
}

        // ==========================================
        // 2. LOAD EXAMS
        // ==========================================

        // ==========================================
// 2. BUILD EXAM MAP
// ==========================================

examsById =
    new Map(
        (attempts || []).map(
            attempt => [
                String(attempt.exam_id),
                {
                    id:
                        attempt.exam_id,

                    exam_name:
                        attempt.exam_name,

                    total_marks:
                        attempt.total_marks,

                    passing_marks:
                        attempt.passing_marks
                }
            ]
        )
    );

        // ==========================================
// 3. BUILD PROFILE MAP
// ==========================================

profilesById =
    new Map(
        (attempts || []).map(
            attempt => [
                String(attempt.user_id),
                {
                    id:
                        attempt.user_id,

                    first_name:
                        attempt.first_name,

                    middle_name:
                        attempt.middle_name,

                    last_name:
                        attempt.last_name,

                    email:
                        attempt.email
                }
            ]
        )
    );
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

async function loadQuestionAnalysis(
    attempt
) {

    selectedAnswers = [];
    selectedQuestions = [];

    try {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "get_admin_result_details",
                {
                    p_attempt_id:
                        attempt.id
                }
            );


        if (error) {
            throw error;
        }


        const details =
            data || [];


        selectedAnswers =
            details.map(
                item => ({
                    question_id:
                        item.question_id,

                    selected_option:
                        item.selected_option
                })
            );


        selectedQuestions =
            details.map(
                item => {

                    const question =
                        item.question_data ||
                        {};

                    return {
                        ...question,

                        _section_name:
                            item.section_name ||
                            null,

                        _section_order:
                            item.section_order ??
                            null,

                        _section_question_count:
                            item.section_question_count ??
                            null,

                        _section_start_question:
                            item.section_start_question ??
                            null,

                        _section_end_question:
                            item.section_end_question ??
                            null
                    };

                }
            );

                    buildSectionResults(
            details
        );


        renderQuestionAnalysis();


        renderSectionalResults();


        renderQuestionAnalysis();

    }
    catch (error) {

        console.error(
            "Result Question Analysis Error:",
            error
        );


        if ($("detailQuestionCount")) {

            $("detailQuestionCount")
                .textContent =
                "Unable to load";

        }


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


/* =========================================================
   QUESTION ANALYSIS
   ========================================================= */

function renderQuestionAnalysis() {

    const container =
        $("detailQuestions");


    if (!container) {
        return;
    }


    if (!selectedQuestions.length) {

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
            selectedQuestions.length === 1
                ? ""
                : "s"
        }`;

            /* =====================================================
       NON-SECTIONAL EXAM
       ===================================================== */

    const hasSections =
        selectedQuestions.some(
            question =>
                question._section_name ||
                question._section_order !== null &&
                question._section_order !== undefined
        );

    if (!hasSections) {

        container.innerHTML =
            selectedQuestions
                .map(
                    (
                        question,
                        index
                    ) =>
                        renderSingleResultQuestion(
                            question,
                            index
                        )
                )
                .join("");

        return;
    }


    /* =====================================================
       GROUP QUESTIONS BY SECTION
       ===================================================== */

    const groupedSections =
        new Map();


    selectedQuestions.forEach(
        (
            question,
            index
        ) => {

            const sectionOrder =
                question._section_order ??
                999999;


            const sectionName =
                question._section_name ||
                "General";


            const key =
                String(sectionOrder);


            if (
                !groupedSections.has(key)
            ) {

                groupedSections.set(
                    key,
                    {
                        sectionName,

                        sectionOrder,

                        startQuestion:
                            question._section_start_question,

                        endQuestion:
                            question._section_end_question,

                        questions: []
                    }
                );

            }


            groupedSections
                .get(key)
                .questions
                .push({
                    question,
                    originalIndex: index
                });

        }
    );


    const sections =
        Array.from(
            groupedSections.values()
        )
        .sort(
            (
                a,
                b
            ) =>
                Number(a.sectionOrder) -
                Number(b.sectionOrder)
        );


    /* =====================================================
       RENDER SECTION + QUESTIONS
       ===================================================== */

    container.innerHTML =
        sections
            .map(
                section => {

                    const range =
                        section.startQuestion &&
                        section.endQuestion

                            ? `Questions ${section.startQuestion}–${section.endQuestion}`

                            : `${section.questions.length} Questions`;


                    return `

                        <div class="result-question-section">

                            <div class="result-question-section-header">

                                <div>

                                    <div class="result-question-section-title">
                                        ${escapeHTML(
                                            section.sectionName
                                        )}
                                    </div>

                                    <div class="result-question-section-range">
                                        ${range}
                                    </div>

                                </div>

                                <div class="result-question-section-count">
                                    ${section.questions.length}
                                    Questions
                                </div>

                            </div>


                            <div class="result-question-section-list">

                                ${
                                    section.questions
                                        .map(
                                            item =>
                                                renderSingleResultQuestion(
                                                    item.question,
                                                    item.originalIndex
                                                )
                                        )
                                        .join("")
                                }

                            </div>

                        </div>

                    `;

                }
            )
            .join("");
}

function renderSingleResultQuestion(
    question,
    index
) {

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


    const questionNumber =
        question.question_no ??
        (index + 1);


    return `

        <div class="detail-question-card">

            <div class="detail-question-top">

                <span class="detail-question-number">
                    Question ${questionNumber}
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
                        correct || "—"
                    )}
                </strong>

            </div>

        </div>

    `;
}

function buildSectionResults(
    details
) {

    const sections =
        new Map();


    details.forEach(
        detail => {

            if (
                !detail.section_name
            ) {
                return;
            }


            const key =
                String(
                    detail.section_order
                );


            if (
                !sections.has(key)
            ) {

                sections.set(
                    key,
                    {
                        section_name:
                            detail.section_name,

                        section_order:
                            Number(
                                detail.section_order
                            ),

                        total_questions:
                            Number(
                                detail.section_question_count ||
                                0
                            ),

                        attempted:
                            0,

                        correct:
                            0,

                        wrong:
                            0,

                        skipped:
                            0,

                        score:
                            0
                    }
                );

            }


            const section =
                sections.get(key);


            const question =
                detail.question_data ||
                {};


            const selected =
                detail.selected_option;


            const isSkipped =
                selected === null ||
                selected === undefined ||
                String(
                    selected
                ).trim() === "";


            if (isSkipped) {

                section.skipped++;

                return;

            }


            section.attempted++;


            const correctAnswer =
                firstDefined(
                    question,
                    [
                        "correct_answer",
                        "correct_option",
                        "correctAnswer",
                        "answer"
                    ],
                    ""
                );


            if (
                normalize(
                    selected
                ) ===
                normalize(
                    correctAnswer
                )
            ) {

                section.correct++;


                section.score +=
                    Number(
                        question.marks || 0
                    );

            }

            else {

                section.wrong++;


                section.score -=
                    Math.abs(
                        Number(
                            question.negative_marks ||
                            0
                        )
                    );

            }

        }
    );


    selectedSectionResults =
        Array.from(
            sections.values()
        )
        .sort(
            (
                a,
                b
            ) =>
                a.section_order -
                b.section_order
        );


    selectedSectionResults
        .forEach(
            section => {

                section.score =
                    Number(
                        section.score.toFixed(
                            2
                        )
                    );

            }
        );
}

function renderSectionalResults() {

    const questionsContainer =
        $("detailQuestions");


    if (
        !questionsContainer
    ) {
        return;
    }


    const existing =
        document.getElementById(
            "detailSectionResults"
        );


    if (existing) {
        existing.remove();
    }


    if (
        !selectedSectionResults.length
    ) {
        return;
    }


    const sectionContainer =
        document.createElement(
            "div"
        );


    sectionContainer.id =
        "detailSectionResults";

    sectionContainer.className =
        "detail-section-results";


    sectionContainer.innerHTML = `

        <div class="detail-section-heading">
            <div>
                <h3>
                    Section-wise Result
                </h3>

                <p>
                    Performance by examination section
                </p>
            </div>
        </div>


        <div class="detail-section-grid">

            ${
                selectedSectionResults
                    .map(
                        section => {

                            const percentage =
                                section.total_questions > 0
                                    ? (
                                        section.correct /
                                        section.total_questions
                                    ) * 100
                                    : 0;


                            return `

                                <div class="detail-section-card">

                                    <div class="detail-section-card-top">

                                        <strong>
                                            ${escapeHTML(
                                                section.section_name
                                            )}
                                        </strong>

                                        <span>
                                            ${section.total_questions}
                                            Questions
                                        </span>

                                    </div>


                                    <div class="detail-section-score">

                                        <strong>
                                            ${section.score.toFixed(2)}
                                        </strong>

                                        <small>
                                            Score
                                        </small>

                                    </div>


                                    <div class="detail-section-stats">

                                        <div class="section-stat correct">

                                            <strong>
                                                ${section.correct}
                                            </strong>

                                            <span>
                                                Correct
                                            </span>

                                        </div>


                                        <div class="section-stat wrong">

                                            <strong>
                                                ${section.wrong}
                                            </strong>

                                            <span>
                                                Wrong
                                            </span>

                                        </div>


                                        <div class="section-stat skipped">

                                            <strong>
                                                ${section.skipped}
                                            </strong>

                                            <span>
                                                Skipped
                                            </span>

                                        </div>


                                        <div class="section-stat percentage">

                                            <strong>
                                                ${percentage.toFixed(1)}%
                                            </strong>

                                            <span>
                                                Accuracy
                                            </span>

                                        </div>

                                    </div>

                                </div>

                            `;

                        }
                    )
                    .join("")
            }

        </div>
    `;


    questionsContainer.parentNode.insertBefore(
        sectionContainer,
        questionsContainer
    );
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