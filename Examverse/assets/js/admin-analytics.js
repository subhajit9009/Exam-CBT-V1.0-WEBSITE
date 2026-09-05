/* =========================================================
   EXAMVERSE ADMIN ANALYTICS
   Deep Examination Analytics
   Permission: analytics.view
   ========================================================= */

"use strict";


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let analyticsData = null;

let performanceTrendChart = null;
let passFailChart = null;
let scoreDistributionChart = null;
let difficultyChart = null;

const analyticsUserMap = new Map();

let examDetailModal = null;


/* =========================================================
   BASIC HELPERS
   ========================================================= */

const $ = id =>
    document.getElementById(id);


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function numberValue(
    value,
    fallback = 0
) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


function formatNumber(
    value,
    digits = 0
) {

    return numberValue(value)
        .toLocaleString(
            undefined,
            {
                minimumFractionDigits: digits,
                maximumFractionDigits: digits
            }
        );
}


function percentage(
    value,
    digits = 1
) {

    return (
        numberValue(value)
            .toFixed(digits)
        + "%"
    );
}


function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();
}


function resultIsPassed(result) {

    const value =
        normalize(result);

    return (
        value === "pass" ||
        value === "passed" ||
        value.includes("pass")
    );
}


function resultIsFailed(result) {

    const value =
        normalize(result);

    return (
        value === "fail" ||
        value === "failed" ||
        value.includes("fail")
    );
}


function formatTime(seconds) {

    const total =
        Math.max(
            0,
            Math.floor(
                numberValue(seconds)
            )
        );

    if (total <= 0) {
        return "—";
    }

    const hours =
        Math.floor(
            total / 3600
        );

    const minutes =
        Math.floor(
            (total % 3600) / 60
        );

    const secs =
        total % 60;

    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
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

    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "2-digit"
        }
    );
}


function formatDateTime(value) {

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


/* =========================================================
   PERMISSION
   ========================================================= */

function hasAnalyticsPermission() {

    return (
        window.examVerseAdmin &&
        typeof
            window.examVerseAdmin.hasPermission ===
            "function" &&
        window.examVerseAdmin.hasPermission(
            "analytics.view"
        ) === true
    );
}


/* =========================================================
   ACCESS DENIED
   ========================================================= */

function showAccessDenied() {

    if ($("analyticsContent")) {

        $("analyticsContent").hidden =
            true;
    }

    if ($("analyticsAccessDenied")) {

        $("analyticsAccessDenied").hidden =
            false;
    }

    const nav =
        document.querySelector(
            'a[href="admin-analytics.html"]'
        );

    if (nav) {
        nav.remove();
    }
}


/* =========================================================
   USER DIRECTORY
   ========================================================= */

async function loadAnalyticsUserDirectory() {

    analyticsUserMap.clear();

    try {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "get_admin_user_directory"
            );

        if (error) {

            console.warn(
                "Analytics user directory error:",
                error
            );

            return;
        }

        const users =
            Array.isArray(data)
                ? data
                : [];

        users.forEach(
            user => {

                if (!user?.id) {
                    return;
                }

                const name =
                    [
                        user.first_name,
                        user.middle_name,
                        user.last_name
                    ]
                        .map(
                            value =>
                                String(
                                    value ?? ""
                                ).trim()
                        )
                        .filter(Boolean)
                        .join(" ")
                        .trim();

                const finalName =
                    name ||
                    String(
                        user.full_name ?? ""
                    ).trim() ||
                    String(
                        user.email ?? ""
                    ).trim();

                if (finalName) {

                    analyticsUserMap.set(
                        String(user.id),
                        finalName
                    );
                }
            }
        );

    }
    catch (error) {

        console.warn(
            "Unable to load analytics users:",
            error
        );
    }
}


function getStudentName(row) {

    if (!row) {
        return "Unknown Student";
    }

    const mapped =
        analyticsUserMap.get(
            String(
                row.user_id || ""
            )
        );

    if (mapped) {
        return mapped;
    }

    const name =
        [
            row.first_name,
            row.middle_name,
            row.last_name
        ]
            .map(
                value =>
                    String(
                        value ?? ""
                    ).trim()
            )
            .filter(Boolean)
            .join(" ")
            .trim();

    if (name) {
        return name;
    }

    if (
        row.full_name &&
        String(row.full_name).trim()
    ) {
        return String(
            row.full_name
        ).trim();
    }

    if (
        row.student_name &&
        String(row.student_name).trim()
    ) {
        return String(
            row.student_name
        ).trim();
    }

    if (
        row.email &&
        String(row.email).trim()
    ) {
        return String(
            row.email
        ).trim();
    }

    return "Unknown Student";
}


/* =========================================================
   RPC RESPONSE
   ========================================================= */

function normalizeAnalyticsResponse(data) {

    return {

        overview:
            data?.overview || {},

        exam_wise:
            Array.isArray(
                data?.exam_wise
            )
                ? data.exam_wise
                : [],

        daily_trend:
            Array.isArray(
                data?.daily_trend
            )
                ? data.daily_trend
                : [],

        difficulty:
            Array.isArray(
                data?.difficulty
            )
                ? data.difficulty
                : [],

        recent_results:
            Array.isArray(
                data?.recent_results
            )
                ? data.recent_results
                : []
    };
}

/* =========================================================
   LOAD EXAM AVERAGE TIMES
   ========================================================= */

async function loadExamAverageTimes() {
    try {
        const {
            data,
            error
        } = await supabaseClient.rpc(
            "get_admin_exam_average_times"
        );

        if (error) {
            throw error;
        }

        const timeRows =
            Array.isArray(data)
                ? data
                : [];

        const timeMap =
            new Map(
                timeRows.map(
                    row => [
                        String(
                            row.exam_id
                        ),
                        numberValue(
                            row.average_time
                        )
                    ]
                )
            );

        if (
            analyticsData &&
            Array.isArray(
                analyticsData.exam_wise
            )
        ) {
            analyticsData.exam_wise =
                analyticsData.exam_wise.map(
                    exam => ({
                        ...exam,
                        average_time:
                            timeMap.get(
                                String(
                                    exam.exam_id
                                )
                            ) ?? 0
                    })
                );
        }
    }
    catch (error) {
        console.error(
            "ADMIN EXAM AVERAGE TIME ERROR:",
            error
        );
    }
}


/* =========================================================
   LOAD ANALYTICS
   ========================================================= */

async function loadAnalytics() {

    if (!hasAnalyticsPermission()) {
        return;
    }

    setAnalyticsLoading(true);

    try {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "get_admin_analytics"
            );

        if (error) {
            throw error;
        }

        analyticsData =
    normalizeAnalyticsResponse(
        data
    );

await loadExamAverageTimes();

await loadAnalyticsUserDirectory();

populateExamFilter();

renderAnalytics();

        setupTableSliders();

    }
    catch (error) {

        console.error(
            "ADMIN ANALYTICS ERROR:",
            error
        );

        renderAnalyticsError(
            error?.message ||
            "Unable to load analytics."
        );

    }
    finally {

        setAnalyticsLoading(
            false
        );
    }
}


/* =========================================================
   LOADING BUTTON
   ========================================================= */

function setAnalyticsLoading(
    loading
) {

    const button =
        $("refreshAnalyticsBtn");

    if (!button) {
        return;
    }

    if (loading) {

        button.disabled =
            true;

        button.innerHTML =
            `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading...
            `;
    }
    else {

        button.disabled =
            false;

        button.innerHTML =
            `
            <i class="fa-solid fa-rotate"></i>
            Refresh
            `;
    }
}


/* =========================================================
   ERROR
   ========================================================= */

function renderAnalyticsError(
    message
) {

    const tables = [

        [
            "examAnalyticsTableBody",
            13
        ],

        [
            "difficultyAnalyticsTableBody",
            8
        ],

        [
            "topPerformersTableBody",
            5
        ],

        [
            "recentResultsTableBody",
            5
        ]
    ];

    tables.forEach(
        ([id, colspan]) => {

            const tbody =
                $(id);

            if (!tbody) {
                return;
            }

            tbody.innerHTML =
                `
                <tr>
                    <td
                        colspan="${colspan}"
                        class="analytics-error-cell"
                    >
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        ${escapeHTML(message)}
                    </td>
                </tr>
                `;
        }
    );
}


/* =========================================================
   EXAM FILTER
   ========================================================= */

function populateExamFilter() {

    const select =
        $("analyticsExamFilter");

    if (
        !select ||
        !analyticsData
    ) {
        return;
    }

    const current =
        select.value;

    const exams =
        analyticsData.exam_wise
            .filter(
                exam =>
                    exam.exam_id
            )
            .sort(
                (a, b) =>
                    String(
                        a.exam_name || ""
                    ).localeCompare(
                        String(
                            b.exam_name || ""
                        )
                    )
            );

    select.innerHTML =
        `
        <option value="">
            All Exams
        </option>
        ` +
        exams
            .map(
                exam =>
                    `
                    <option
                        value="${escapeHTML(
                            exam.exam_id
                        )}"
                    >
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
                    exam.exam_id
                ) ===
                String(current)
        )
    ) {

        select.value =
            current;
    }
}


/* =========================================================
   FILTERS
   ========================================================= */

function getSelectedExamId() {

    return String(
        $("analyticsExamFilter")
            ?.value ||
        ""
    );
}


function getSelectedPeriod() {

    return String(
        $("analyticsPeriodFilter")
            ?.value ||
        "30"
    );
}


function getSelectedResult() {

    return normalize(
        $("analyticsResultFilter")
            ?.value ||
        ""
    );
}


function getPeriodStart() {

    const period =
        getSelectedPeriod();

    if (
        !period ||
        period === "all"
    ) {
        return null;
    }

    const days =
        Number(period);

    if (
        !Number.isFinite(days) ||
        days <= 0
    ) {
        return null;
    }

    const start =
        new Date();

    start.setHours(
        0,
        0,
        0,
        0
    );

    start.setDate(
        start.getDate() -
        days +
        1
    );

    return start;
}


function dateMatchesPeriod(
    value
) {

    const start =
        getPeriodStart();

    if (!start) {
        return true;
    }

    if (!value) {
        return false;
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return false;
    }

    return date >= start;
}


/* =========================================================
   FILTERED EXAM DATA
   ========================================================= */

function getFilteredExamRows() {

    const examId =
        getSelectedExamId();

    return (
        analyticsData?.exam_wise ||
        []
    )
        .filter(
            exam =>
                !examId ||
                String(
                    exam.exam_id
                ) === examId
        );
}


/* =========================================================
   FILTERED ATTEMPTS
   ========================================================= */

function getFilteredRecentResults() {

    const examId =
        getSelectedExamId();

    const resultFilter =
        getSelectedResult();

    return (
        analyticsData?.recent_results ||
        []
    )
        .filter(
            row => {

                if (
                    examId &&
                    String(
                        row.exam_id
                    ) !== examId
                ) {
                    return false;
                }

                if (
                    !dateMatchesPeriod(
                        row.submitted_at
                    )
                ) {
                    return false;
                }

                if (
                    resultFilter === "passed" &&
                    !resultIsPassed(
                        row.result
                    )
                ) {
                    return false;
                }

                if (
                    resultFilter === "failed" &&
                    !resultIsFailed(
                        row.result
                    )
                ) {
                    return false;
                }

                return true;
            }
        );
}


function getFilteredAttemptRows() {

    return getFilteredRecentResults();
}


/* =========================================================
   PASS / FAIL TOTALS
   ========================================================= */

function getPassFailTotals() {

    const attempts =
        getFilteredAttemptRows();

    let passed = 0;
    let failed = 0;

    attempts.forEach(
        row => {

            if (
                resultIsPassed(
                    row.result
                )
            ) {
                passed++;
            }
            else if (
                resultIsFailed(
                    row.result
                )
            ) {
                failed++;
            }
        }
    );


    /*
     * If recent_results is limited or empty,
     * use exam-wise totals.
     */

    if (
        passed === 0 &&
        failed === 0
    ) {

        const exams =
            getFilteredExamRows();

        exams.forEach(
            row => {

                passed +=
                    numberValue(
                        row.passed
                    );

                failed +=
                    numberValue(
                        row.failed
                    );
            }
        );
    }


    /*
     * Final fallback to overview.
     */

    if (
        passed === 0 &&
        failed === 0
    ) {

        passed =
            numberValue(
                analyticsData
                    ?.overview
                    ?.passed_attempts
            );

        failed =
            numberValue(
                analyticsData
                    ?.overview
                    ?.failed_attempts
            );
    }


    return {
        passed,
        failed
    };
}


/* =========================================================
   BEHAVIOUR TOTALS
   ========================================================= */

function getBehaviourTotals() {

    const rows =
        getFilteredAttemptRows();

    let attempted = 0;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;


    rows.forEach(
        row => {

            attempted +=
                numberValue(
                    row.attempted
                );

            correct +=
                numberValue(
                    row.correct
                );

            wrong +=
                numberValue(
                    row.wrong
                );

            skipped +=
                numberValue(
                    row.skipped
                );
        }
    );


    /*
     * When filtered recent results are empty,
     * calculate from exam-wise averages.
     */

    if (
        attempted === 0 &&
        correct === 0 &&
        wrong === 0 &&
        skipped === 0
    ) {

        getFilteredExamRows()
            .forEach(
                row => {

                    const attempts =
                        numberValue(
                            row.attempts
                        );

                    attempted +=
                        numberValue(
                            row.average_attempted
                        ) *
                        attempts;

                    correct +=
                        numberValue(
                            row.average_correct
                        ) *
                        attempts;

                    wrong +=
                        numberValue(
                            row.average_wrong
                        ) *
                        attempts;

                    skipped +=
                        numberValue(
                            row.average_skipped
                        ) *
                        attempts;
                }
            );
    }


    return {
        attempted,
        correct,
        wrong,
        skipped
    };
}


/* =========================================================
   VISIBLE METRICS
   ========================================================= */

function calculateVisibleMetrics() {

    const overview =
        analyticsData?.overview ||
        {};

    const examRows =
        getFilteredExamRows();

    const attempts =
        getFilteredAttemptRows();


    let completed = 0;
    let passed = 0;
    let failed = 0;

    let percentageTotal = 0;
    let scoreTotal = 0;
    let timeTotal = 0;


    if (attempts.length) {

        completed =
            attempts.length;

        attempts.forEach(
            row => {

                if (
                    resultIsPassed(
                        row.result
                    )
                ) {
                    passed++;
                }

                if (
                    resultIsFailed(
                        row.result
                    )
                ) {
                    failed++;
                }

                percentageTotal +=
                    numberValue(
                        row.percentage
                    );

                scoreTotal +=
                    numberValue(
                        row.score
                    );

                timeTotal +=
                    numberValue(
                        row.time_taken
                    );
            }
        );
    }
    else {

        examRows.forEach(
            row => {

                const count =
                    numberValue(
                        row.attempts
                    );

                completed +=
                    count;

                passed +=
                    numberValue(
                        row.passed
                    );

                failed +=
                    numberValue(
                        row.failed
                    );

                percentageTotal +=
                    numberValue(
                        row.average_percentage
                    ) *
                    count;

                scoreTotal +=
                    numberValue(
                        row.average_score
                    ) *
                    count;

                timeTotal +=
                    numberValue(
                        row.average_time
                    ) *
                    count;
            }
        );
    }


    if (
        completed === 0
    ) {

        completed =
            numberValue(
                overview.completed_attempts
            );

        passed =
            numberValue(
                overview.passed_attempts
            );

        failed =
            numberValue(
                overview.failed_attempts
            );

        percentageTotal =
            numberValue(
                overview.average_percentage
            ) *
            completed;

        scoreTotal =
            numberValue(
                overview.average_score
            ) *
            completed;

        timeTotal =
            numberValue(
                overview.average_time
            ) *
            completed;
    }


    const behaviour =
        getBehaviourTotals();


    return {

        overview,

        completed,

        passed,

        failed,

        averagePercentage:
            completed > 0
                ? percentageTotal /
                  completed
                : 0,

        averageScore:
            completed > 0
                ? scoreTotal /
                  completed
                : 0,

        averageTime:
            completed > 0
                ? timeTotal /
                  completed
                : 0,

        attempted:
            behaviour.attempted,

        correct:
            behaviour.correct,

        wrong:
            behaviour.wrong,

        skipped:
            behaviour.skipped
    };
}


/* =========================================================
   MAIN RENDER
   ========================================================= */

function renderAnalytics() {

    renderOverview();

    renderBehaviourMetrics();

    renderCharts();

    renderExamTable();

    renderDifficultyTable();

    renderTopPerformers();

    renderRecentResults();

    renderInsights();
}


/* =========================================================
   OVERVIEW
   ========================================================= */

function renderOverview() {

    if (!analyticsData) {
        return;
    }

    const metrics =
        calculateVisibleMetrics();


    const passRate =
        metrics.completed > 0
            ? (
                metrics.passed /
                metrics.completed
            ) * 100
            : 0;


    if ($("analyticsTotalUsers")) {

        $("analyticsTotalUsers")
            .textContent =
            formatNumber(
                metrics.overview.total_users
            );
    }


    if ($("analyticsTotalExams")) {

        $("analyticsTotalExams")
            .textContent =
            formatNumber(
                metrics.overview.total_exams
            );
    }


    if ($("analyticsTotalQuestions")) {

        $("analyticsTotalQuestions")
            .textContent =
            formatNumber(
                metrics.overview.total_questions
            );
    }


    if ($("analyticsCompletedAttempts")) {

        $("analyticsCompletedAttempts")
            .textContent =
            formatNumber(
                metrics.completed
            );
    }


    if ($("analyticsPassRate")) {

        $("analyticsPassRate")
            .textContent =
            percentage(
                passRate
            );
    }


    if ($("analyticsAveragePercentage")) {

        $("analyticsAveragePercentage")
            .textContent =
            percentage(
                metrics.averagePercentage
            );
    }


    if ($("analyticsAverageScore")) {

        $("analyticsAverageScore")
            .textContent =
            formatNumber(
                metrics.averageScore,
                2
            );
    }


    if ($("analyticsAverageTime")) {

        $("analyticsAverageTime")
            .textContent =
            formatTime(
                metrics.averageTime
            );
    }
}


/* =========================================================
   BEHAVIOUR
   ========================================================= */

function renderBehaviourMetrics() {

    const metrics =
        calculateVisibleMetrics();


    const attempted =
        metrics.attempted;

    const correct =
        metrics.correct;

    const wrong =
        metrics.wrong;

    const skipped =
        metrics.skipped;


    const total =
        attempted +
        skipped;


    const answered =
        correct +
        wrong;


    const accuracy =
        answered > 0
            ? (
                correct /
                answered
            ) * 100
            : 0;


    const skipRate =
        total > 0
            ? (
                skipped /
                total
            ) * 100
            : 0;


    const wrongRate =
        total > 0
            ? (
                wrong /
                total
            ) * 100
            : 0;


    const attemptRate =
        total > 0
            ? (
                attempted /
                total
            ) * 100
            : 0;


    if ($("analyticsAccuracyRate")) {

        $("analyticsAccuracyRate")
            .textContent =
            percentage(
                accuracy
            );
    }


    if ($("analyticsSkipRate")) {

        $("analyticsSkipRate")
            .textContent =
            percentage(
                skipRate
            );
    }


    if ($("analyticsWrongRate")) {

        $("analyticsWrongRate")
            .textContent =
            percentage(
                wrongRate
            );
    }


    if ($("analyticsAttemptRate")) {

        $("analyticsAttemptRate")
            .textContent =
            percentage(
                attemptRate
            );
    }
}


/* =========================================================
   CHART CLEANUP
   ========================================================= */

function destroyCharts() {

    if (performanceTrendChart) {

        performanceTrendChart.destroy();

        performanceTrendChart =
            null;
    }


    if (passFailChart) {

        passFailChart.destroy();

        passFailChart =
            null;
    }


    if (scoreDistributionChart) {

        scoreDistributionChart.destroy();

        scoreDistributionChart =
            null;
    }


    if (difficultyChart) {

        difficultyChart.destroy();

        difficultyChart =
            null;
    }
}


/* =========================================================
   CHART LEGEND
   ========================================================= */

function chartLegend() {

    return {

        position: "bottom",

        labels: {

            usePointStyle:
                true,

            padding:
                18,

            color:
                "#334155",

            font: {
                size: 12,
                weight: "600"
            }
        },

        onClick:
            function () {
                return;
            }
    };
}


/* =========================================================
   CHARTS
   ========================================================= */

function renderCharts() {

    if (!analyticsData) {
        return;
    }

    destroyCharts();

    renderPerformanceTrendChart();

    renderPassFailChart();

    renderScoreDistributionChart();

    renderDifficultyChart();
}


/* =========================================================
   PERFORMANCE TREND
   ========================================================= */

function renderPerformanceTrendChart() {

    const canvas =
        $("performanceTrendChart");

    if (
        !canvas ||
        !window.Chart
    ) {
        return;
    }


    let rows =
        (
            analyticsData
                .daily_trend ||
            []
        )
        .filter(
            row =>
                dateMatchesPeriod(
                    row.date
                )
        )
        .sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );


    const selectedExam =
        getSelectedExamId();


    if (selectedExam) {

        const selected =
            getFilteredRecentResults()
                .slice()
                .sort(
                    (a, b) =>
                        new Date(
                            a.submitted_at
                        ) -
                        new Date(
                            b.submitted_at
                        )
                );


        const grouped =
            new Map();


        selected.forEach(
            row => {

                if (!row.submitted_at) {
                    return;
                }

                const key =
                    new Date(
                        row.submitted_at
                    )
                        .toISOString()
                        .slice(
                            0,
                            10
                        );


                if (
                    !grouped.has(key)
                ) {

                    grouped.set(
                        key,
                        {
                            total: 0,
                            percentage: 0
                        }
                    );
                }


                const item =
                    grouped.get(key);


                item.total++;


                item.percentage +=
                    numberValue(
                        row.percentage
                    );
            }
        );


        if (grouped.size) {

            rows =
                Array.from(
                    grouped.entries()
                )
                .map(
                    ([date, value]) => ({

                        date,

                        average_percentage:
                            value.total > 0
                                ? value.percentage /
                                  value.total
                                : 0,

                        attempts:
                            value.total
                    })
                );
        }
    }


    performanceTrendChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "line",

                data: {

                    labels:
                        rows.map(
                            row =>
                                formatDate(
                                    row.date
                                )
                        ),

                    datasets: [

                        {

                            label:
                                "Average Percentage",

                            data:
                                rows.map(
                                    row =>
                                        numberValue(
                                            row.average_percentage
                                        )
                                ),

                            tension:
                                0.35,

                            borderWidth:
                                3,

                            pointRadius:
                                4,

                            pointHoverRadius:
                                7,

                            fill:
                                false
                        },


                        {

                            label:
                                "Attempts",

                            data:
                                rows.map(
                                    row =>
                                        numberValue(
                                            row.attempts
                                        )
                                ),

                            tension:
                                0.35,

                            borderWidth:
                                2,

                            pointRadius:
                                3,

                            pointHoverRadius:
                                6,

                            yAxisID:
                                "attemptAxis",

                            fill:
                                false
                        }
                    ]
                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        mode:
                            "index",

                        intersect:
                            false
                    },


                    plugins: {

                        legend:
                            chartLegend(),

                        tooltip: {
                            enabled:
                                true
                        }
                    },


                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            max:
                                100,

                            ticks: {
                                color:
                                    "#475569"
                            },

                            title: {

                                display:
                                    true,

                                text:
                                    "Percentage",

                                color:
                                    "#475569"
                            }
                        },


                        attemptAxis: {

                            beginAtZero:
                                true,

                            position:
                                "right",

                            ticks: {
                                color:
                                    "#475569"
                            },

                            grid: {

                                drawOnChartArea:
                                    false
                            },

                            title: {

                                display:
                                    true,

                                text:
                                    "Attempts",

                                color:
                                    "#475569"
                            }
                        },


                        x: {

                            ticks: {
                                color:
                                    "#475569"
                            },

                            grid: {
                                color:
                                    "#e2e8f0"
                            }
                        }
                    }
                }
            }
        );
}


/* =========================================================
   PASS / FAIL
   ========================================================= */

function renderPassFailChart() {

    const canvas =
        $("passFailChart");

    if (
        !canvas ||
        !window.Chart
    ) {
        return;
    }


    /* =====================================================
       FIND THE ORIGINAL CHART CONTAINER

       IMPORTANT:
       Do NOT use canvas.parentElement here.

       The previous implementation changed the canvas
       parent after every render, causing nested layouts
       after refresh/filter changes.
       ===================================================== */

    const root =
        canvas.closest(
            ".analytics-doughnut-container"
        ) ||
        canvas.parentElement;


    if (!root) {
        return;
    }


    /* =====================================================
       DESTROY PREVIOUS CHART
       ===================================================== */

    if (passFailChart) {

        passFailChart.destroy();

        passFailChart = null;
    }


    /* =====================================================
       ALWAYS REBUILD THE LAYOUT CLEANLY
       ===================================================== */

    let layout =
        root.querySelector(
            ".analytics-passfail-layout"
        );


    if (!layout) {

        layout =
            document.createElement(
                "div"
            );

        layout.className =
            "analytics-passfail-layout";


        const chartArea =
            document.createElement(
                "div"
            );

        chartArea.className =
            "analytics-passfail-chart-area";


        const infoArea =
            document.createElement(
                "div"
            );

        infoArea.className =
            "analytics-passfail-info";


        layout.appendChild(
            chartArea
        );

        layout.appendChild(
            infoArea
        );


        root.appendChild(
            layout
        );


        chartArea.appendChild(
            canvas
        );

    }
    else {

        /*
         * Existing layout:
         * make absolutely sure the canvas is in
         * the chart area and not nested somewhere else.
         */

        const chartArea =
            layout.querySelector(
                ".analytics-passfail-chart-area"
            );


        if (
            chartArea &&
            canvas.parentElement !==
                chartArea
        ) {

            chartArea.appendChild(
                canvas
            );
        }
    }


    /* =====================================================
       DATA
       ===================================================== */

    const totals =
        getPassFailTotals();


    const passed =
        numberValue(
            totals.passed
        );


    const failed =
        numberValue(
            totals.failed
        );


    const total =
        passed +
        failed;


    const behaviour =
        getBehaviourTotals();


    const attempted =
        numberValue(
            behaviour.attempted
        );


    const correct =
        numberValue(
            behaviour.correct
        );


    const wrong =
        numberValue(
            behaviour.wrong
        );


    const skipped =
        numberValue(
            behaviour.skipped
        );


    const passRate =
        total > 0
            ? (
                passed /
                total
            ) * 100
            : 0;


    const failRate =
        total > 0
            ? (
                failed /
                total
            ) * 100
            : 0;


    /* =====================================================
       RIGHT-SIDE INFORMATION
       ===================================================== */

    const infoArea =
        layout.querySelector(
            ".analytics-passfail-info"
        );


    if (!infoArea) {
        return;
    }


    infoArea.innerHTML = `
        <div class="analytics-passfail-summary-title">

            <span>
                RESULT SUMMARY
            </span>

            <strong>
                Completed Attempts
            </strong>

        </div>


        <div class="analytics-passfail-stat-grid">

            <div class="
                analytics-passfail-stat
                total
            ">

                <span>
                    <i class="
                        fa-solid
                        fa-users
                    "></i>

                    Total Attempts
                </span>

                <strong>
                    ${formatNumber(total)}
                </strong>

                <small>
                    Completed
                </small>

            </div>


            <div class="
                analytics-passfail-stat
                pass
            ">

                <span>
                    <i class="
                        fa-solid
                        fa-circle-check
                    "></i>

                    Passed
                </span>

                <strong>
                    ${formatNumber(passed)}
                </strong>

                <small>
                    ${passRate.toFixed(1)}%
                </small>

            </div>


            <div class="
                analytics-passfail-stat
                fail
            ">

                <span>
                    <i class="
                        fa-solid
                        fa-circle-xmark
                    "></i>

                    Failed
                </span>

                <strong>
                    ${formatNumber(failed)}
                </strong>

                <small>
                    ${failRate.toFixed(1)}%
                </small>

            </div>

        </div>


        <div class="
            analytics-passfail-ratio
        ">

            <div class="
                analytics-passfail-ratio-header
            ">

                <strong>
                    Pass / Fail Ratio
                </strong>

                <span>
                    ${passRate.toFixed(1)}
                    /
                    ${failRate.toFixed(1)}
                </span>

            </div>


            <div class="
                analytics-passfail-ratio-track
            ">

                <div
                    class="
                        analytics-passfail-ratio-pass
                    "
                    style="
                        width:${passRate}%;
                    "
                ></div>

                <div
                    class="
                        analytics-passfail-ratio-fail
                    "
                    style="
                        width:${failRate}%;
                    "
                ></div>

            </div>

        </div>


        <div class="
            analytics-passfail-behaviour
        ">

            <div>
                <span>
                    Attempted
                </span>

                <strong>
                    ${formatNumber(attempted)}
                </strong>
            </div>


            <div>
                <span>
                    Correct
                </span>

                <strong>
                    ${formatNumber(correct)}
                </strong>
            </div>


            <div>
                <span>
                    Wrong
                </span>

                <strong>
                    ${formatNumber(wrong)}
                </strong>
            </div>


            <div>
                <span>
                    Skipped
                </span>

                <strong>
                    ${formatNumber(skipped)}
                </strong>
            </div>

        </div>
    `;


    /* =====================================================
       NO RESULT STATE
       ===================================================== */

    if (total <= 0) {

        infoArea.innerHTML = `
            <div class="
                analytics-passfail-empty
            ">

                <i class="
                    fa-solid
                    fa-chart-pie
                "></i>

                <strong>
                    No completed results
                </strong>

                <span>
                    Pass and fail statistics
                    will appear after students
                    complete an examination.
                </span>

            </div>
        `;


        const ctx =
            canvas.getContext("2d");


        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        return;
    }


    /* =====================================================
       CREATE DONUT
       ===================================================== */

    passFailChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type:
                    "doughnut",


                data: {

                    labels: [
                        "Passed",
                        "Failed"
                    ],


                    datasets: [

                        {
                            data: [
                                passed,
                                failed
                            ],

                            backgroundColor: [
                                "#22c55e",
                                "#ef4444"
                            ],

                            borderColor: [
                                "#ffffff",
                                "#ffffff"
                            ],

                            borderWidth:
                                4,

                            hoverOffset:
                                8
                        }

                    ]

                },


                plugins: [

                    {

                        id:
                            "passFailCenterText",


                        afterDraw:
                            function(chart) {

                                const meta =
                                    chart.getDatasetMeta(
                                        0
                                    );


                                if (
                                    !meta ||
                                    !meta.data ||
                                    !meta.data.length
                                ) {
                                    return;
                                }


                                const point =
                                    meta.data[0];


                                const ctx =
                                    chart.ctx;


                                ctx.save();


                                ctx.textAlign =
                                    "center";


                                ctx.textBaseline =
                                    "middle";


                                ctx.fillStyle =
                                    "#111827";


                                ctx.font =
                                    "800 30px Poppins, sans-serif";


                                ctx.fillText(
                                    String(total),
                                    point.x,
                                    point.y - 15
                                );


                                ctx.fillStyle =
                                    "#64748b";


                                ctx.font =
                                    "700 10px Poppins, sans-serif";


                                ctx.fillText(
                                    "TOTAL ATTEMPTS",
                                    point.x,
                                    point.y + 9
                                );


                                ctx.fillStyle =
                                    "#16a34a";


                                ctx.font =
                                    "800 11px Poppins, sans-serif";


                                ctx.fillText(
                                    `${passRate.toFixed(1)}% PASS`,
                                    point.x,
                                    point.y + 29
                                );


                                ctx.restore();

                            }

                    }

                ],


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    cutout:
                        "66%",


                    plugins: {

                        legend:
                            chartLegend(),


                        tooltip: {

                            callbacks: {

                                label:
                                    function(
                                        context
                                    ) {

                                        const value =
                                            numberValue(
                                                context.raw
                                            );


                                        const rate =
                                            total > 0
                                                ? (
                                                    value /
                                                    total
                                                ) * 100
                                                : 0;


                                        return (
                                            `${context.label}: ` +
                                            `${value} ` +
                                            `(${rate.toFixed(1)}%)`
                                        );

                                    }

                            }

                        }

                    }

                }

            }
        );
}


/* =========================================================
   SCORE DISTRIBUTION
   ========================================================= */

function renderScoreDistributionChart() {

    const canvas =
        $("scoreDistributionChart");

    if (
        !canvas ||
        !window.Chart
    ) {
        return;
    }


    const buckets = {

        "0–20%": 0,

        "21–40%": 0,

        "41–60%": 0,

        "61–80%": 0,

        "81–100%": 0
    };


    getFilteredRecentResults()
        .forEach(
            row => {

                const value =
                    numberValue(
                        row.percentage
                    );


                if (
                    value <= 20
                ) {

                    buckets["0–20%"]++;
                }

                else if (
                    value <= 40
                ) {

                    buckets["21–40%"]++;
                }

                else if (
                    value <= 60
                ) {

                    buckets["41–60%"]++;
                }

                else if (
                    value <= 80
                ) {

                    buckets["61–80%"]++;
                }

                else {

                    buckets["81–100%"]++;
                }
            }
        );


    scoreDistributionChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type:
                    "bar",

                data: {

                    labels:
                        Object.keys(
                            buckets
                        ),

                    datasets: [

                        {

                            label:
                                "Completed Attempts",

                            data:
                                Object.values(
                                    buckets
                                ),

                            borderWidth:
                                1,

                            borderRadius:
                                7
                        }
                    ]
                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,


                    scales: {

                        x: {

                            ticks: {
                                color:
                                    "#475569"
                            },

                            grid: {
                                color:
                                    "#e2e8f0"
                            }
                        },


                        y: {

                            beginAtZero:
                                true,

                            ticks: {
                                color:
                                    "#475569",
                                precision:
                                    0
                            },

                            grid: {
                                color:
                                    "#e2e8f0"
                            }
                        }
                    },


                    plugins: {

                        legend: {
                            display:
                                false
                        }
                    }
                }
            }
        );
}


/* =========================================================
   DIFFICULTY
   ========================================================= */

function renderDifficultyChart() {

    const canvas =
        $("difficultyChart");

    if (
        !canvas ||
        !window.Chart
    ) {
        return;
    }


    const rows =
        analyticsData
            ?.difficulty ||
        [];


    if (!rows.length) {

        showChartMessage(
            canvas,
            "No difficulty data available"
        );

        return;
    }


    difficultyChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type:
                    "bar",

                data: {

                    labels:
                        rows.map(
                            row =>
                                row.difficulty ||
                                "Unknown"
                        ),

                    datasets: [

                        {

                            label:
                                "Accuracy %",

                            data:
                                rows.map(
                                    row =>
                                        numberValue(
                                            row.accuracy
                                        )
                                ),

                            borderWidth:
                                1,

                            borderRadius:
                                7
                        },


                        {

                            label:
                                "Skip Rate %",

                            data:
                                rows.map(
                                    row =>
                                        numberValue(
                                            row.skip_rate
                                        )
                                ),

                            borderWidth:
                                1,

                            borderRadius:
                                7
                        }
                    ]
                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,


                    interaction: {

                        mode:
                            "index",

                        intersect:
                            false
                    },


                    plugins: {

                        legend:
                            chartLegend(),

                        tooltip: {
                            enabled:
                                true
                        }
                    },


                    scales: {

                        x: {

                            ticks: {
                                color:
                                    "#475569"
                            },

                            grid: {
                                color:
                                    "#e2e8f0"
                            }
                        },


                        y: {

                            beginAtZero:
                                true,

                            max:
                                100,

                            ticks: {
                                color:
                                    "#475569"
                            },

                            title: {

                                display:
                                    true,

                                text:
                                    "Percentage",

                                color:
                                    "#475569"
                            }
                        }
                    }
                }
            }
        );
}


/* =========================================================
   CHART MESSAGE
   ========================================================= */

function showChartMessage(
    canvas,
    message
) {

    const parent =
        canvas.parentElement;

    if (!parent) {
        return;
    }

    parent.classList.add(
        "analytics-chart-empty"
    );


    let element =
        parent.querySelector(
            ".analytics-chart-empty-message"
        );


    if (!element) {

        element =
            document.createElement(
                "div"
            );

        element.className =
            "analytics-chart-empty-message";

        parent.appendChild(
            element
        );
    }


    element.innerHTML =
        `
        <i class="fa-solid fa-chart-pie"></i>
        <span>
            ${escapeHTML(message)}
        </span>
        `;


    canvas.style.visibility =
        "hidden";
}


function hideChartMessage(
    canvas
) {

    const parent =
        canvas.parentElement;

    if (!parent) {
        return;
    }


    parent.classList.remove(
        "analytics-chart-empty"
    );


    const element =
        parent.querySelector(
            ".analytics-chart-empty-message"
        );


    if (element) {
        element.remove();
    }


    canvas.style.visibility =
        "visible";
}


/* =========================================================
   EXAMINATION TABLE
   ========================================================= */

function renderExamTable() {

    const tbody =
        $("examAnalyticsTableBody");

    if (!tbody) {
        return;
    }


    const rows =
        getFilteredExamRows();


    if (!rows.length) {

        tbody.innerHTML =
            `
            <tr>
                <td
                    colspan="13"
                    class="analytics-empty-cell"
                >
                    No examination analytics available.
                </td>
            </tr>
            `;

        return;
    }


    tbody.innerHTML =
        rows
            .map(
                row => {

                    const passed =
                        numberValue(
                            row.passed
                        );

                    const failed =
                        numberValue(
                            row.failed
                        );

                    const calculatedPassRate =
                        passed +
                        failed >
                        0
                            ? (
                                passed /
                                (
                                    passed +
                                    failed
                                )
                            ) *
                              100
                            : numberValue(
                                row.pass_rate
                            );


                    return `
                    <tr

                        class="analytics-exam-row"

                        data-exam-id="${escapeHTML(
                            row.exam_id
                        )}"

                        data-exam-name="${escapeHTML(
                            row.exam_name ||
                            "Unnamed Exam"
                        )}"

                        tabindex="0"

                        role="button"

                        title="Click to view in-depth examination analytics"
                    >

                        <td>

                            <strong>
                                ${escapeHTML(
                                    row.exam_name ||
                                    "Unnamed Exam"
                                )}
                            </strong>

                            <span
                                class="analytics-row-open-hint"
                            >
                                <i class="
                                    fa-solid
                                    fa-arrow-up-right-from-square
                                "></i>
                            </span>

                        </td>


                        <td>
                            ${formatNumber(
                                row.attempts
                            )}
                        </td>


                        <td>
                            ${formatNumber(
                                row.unique_students
                            )}
                        </td>


                        <td>
                            ${formatNumber(
                                row.average_score,
                                2
                            )}
                        </td>


                        <td>
                            ${percentage(
                                row.average_percentage
                            )}
                        </td>


                        <td>
                            ${percentage(
                                row.highest_percentage
                            )}
                        </td>


                        <td>
                            ${percentage(
                                row.lowest_percentage
                            )}
                        </td>


                        <td>

                            <span
                                class="
                                    analytics-result-badge
                                    passed
                                "
                            >
                                ${percentage(
                                    calculatedPassRate
                                )}
                            </span>

                        </td>


                        <td>
                            ${formatNumber(
                                row.average_attempted,
                                1
                            )}
                        </td>


                        <td>
                            ${formatNumber(
                                row.average_correct,
                                1
                            )}
                        </td>


                        <td>
                            ${formatNumber(
                                row.average_wrong,
                                1
                            )}
                        </td>


                        <td>
                            ${formatNumber(
                                row.average_skipped,
                                1
                            )}
                        </td>


                        <td>
                            ${formatTime(
                                row.average_time
                            )}
                        </td>

                    </tr>
                    `;
                }
            )
            .join("");


    tbody
        .querySelectorAll(
            ".analytics-exam-row"
        )
        .forEach(
            row => {

                row.addEventListener(
                    "click",
                    () => {

                        openExamAnalytics(
                            row.dataset.examId,
                            row.dataset.examName
                        );
                    }
                );


                row.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key ===
                                "Enter" ||
                            event.key ===
                                " "
                        ) {

                            event.preventDefault();

                            openExamAnalytics(
                                row.dataset.examId,
                                row.dataset.examName
                            );
                        }
                    }
                );
            }
        );
}


/* =========================================================
   DIFFICULTY TABLE
   ========================================================= */

function renderDifficultyTable() {

    const tbody =
        $("difficultyAnalyticsTableBody");

    if (!tbody) {
        return;
    }


    const rows =
        analyticsData
            ?.difficulty ||
        [];


    if (!rows.length) {

        tbody.innerHTML =
            `
            <tr>
                <td
                    colspan="8"
                    class="analytics-empty-cell"
                >
                    No difficulty analytics available.
                </td>
            </tr>
            `;

        return;
    }


    tbody.innerHTML =
        rows
            .map(
                row =>
                    `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    row.difficulty ||
                                    "Unknown"
                                )}
                            </strong>
                        </td>

                        <td>
                            ${formatNumber(
                                row.question_count
                            )}
                        </td>

                        <td>
                            ${formatNumber(
                                row.answer_attempts
                            )}
                        </td>

                        <td>
                            ${formatNumber(
                                row.correct
                            )}
                        </td>

                        <td>
                            ${formatNumber(
                                row.wrong
                            )}
                        </td>

                        <td>
                            ${formatNumber(
                                row.skipped
                            )}
                        </td>

                        <td>
                            ${percentage(
                                row.accuracy
                            )}
                        </td>

                        <td>
                            ${percentage(
                                row.skip_rate
                            )}
                        </td>

                    </tr>
                    `
            )
            .join("");
}


/* =========================================================
   TOP PERFORMERS
   ========================================================= */

function renderTopPerformers() {

    const tbody =
        $("topPerformersTableBody");

    if (!tbody) {
        return;
    }


    const rows =
        getFilteredRecentResults()
            .slice()
            .sort(
                (a, b) =>
                    numberValue(
                        b.percentage
                    ) -
                    numberValue(
                        a.percentage
                    )
            )
            .slice(
                0,
                10
            );


    if (!rows.length) {

        tbody.innerHTML =
            `
            <tr>
                <td
                    colspan="5"
                    class="analytics-empty-cell"
                >
                    No recent performance data available.
                </td>
            </tr>
            `;

        return;
    }


    tbody.innerHTML =
        rows
            .map(
                row =>
                    `
                    <tr>

                        <td>

                            <strong>
                                ${escapeHTML(
                                    getStudentName(
                                        row
                                    )
                                )}
                            </strong>

                        </td>


                        <td>
                            ${escapeHTML(
                                row.exam_name ||
                                "Unnamed Exam"
                            )}
                        </td>


                        <td>
                            ${formatNumber(
                                row.score,
                                2
                            )}
                        </td>


                        <td>

                            <strong>
                                ${percentage(
                                    row.percentage
                                )}
                            </strong>

                        </td>


                        <td>

                            <span
                                class="
                                    analytics-result-badge
                                    ${
                                        resultIsPassed(
                                            row.result
                                        )
                                            ? "passed"
                                            : "failed"
                                    }
                                "
                            >
                                ${escapeHTML(
                                    row.result ||
                                    "—"
                                )}
                            </span>

                        </td>

                    </tr>
                    `
            )
            .join("");
}


/* =========================================================
   RECENT RESULTS
   ========================================================= */

function renderRecentResults() {

    const tbody =
        $("recentResultsTableBody");

    if (!tbody) {
        return;
    }


    const rows =
        getFilteredRecentResults()
            .slice()
            .sort(
                (a, b) =>
                    new Date(
                        b.submitted_at
                    ) -
                    new Date(
                        a.submitted_at
                    )
            )
            .slice(
                0,
                10
            );


    if (!rows.length) {

        tbody.innerHTML =
            `
            <tr>
                <td
                    colspan="5"
                    class="analytics-empty-cell"
                >
                    No recent results available.
                </td>
            </tr>
            `;

        return;
    }


    tbody.innerHTML =
        rows
            .map(
                row =>
                    `
                    <tr>

                        <td>

                            <strong>
                                ${escapeHTML(
                                    getStudentName(
                                        row
                                    )
                                )}
                            </strong>

                        </td>


                        <td>
                            ${escapeHTML(
                                row.exam_name ||
                                "Unnamed Exam"
                            )}
                        </td>


                        <td>

                            <strong>
                                ${percentage(
                                    row.percentage
                                )}
                            </strong>

                        </td>


                        <td>

                            <span
                                class="
                                    analytics-result-badge
                                    ${
                                        resultIsPassed(
                                            row.result
                                        )
                                            ? "passed"
                                            : "failed"
                                    }
                                "
                            >
                                ${escapeHTML(
                                    row.result ||
                                    "—"
                                )}
                            </span>

                        </td>


                        <td>
                            ${formatDateTime(
                                row.submitted_at
                            )}
                        </td>

                    </tr>
                    `
            )
            .join("");
}


/* =========================================================
   INSIGHTS
   ========================================================= */

function renderInsights() {

    const container =
        $("analyticsInsights");

    if (!container) {
        return;
    }


    const metrics =
        calculateVisibleMetrics();


    const exams =
        getFilteredExamRows();


    const difficulty =
        analyticsData
            ?.difficulty ||
        [];


    const insights = [];


    if (
        metrics.completed >
        0
    ) {

        const passRate =
            (
                metrics.passed /
                metrics.completed
            ) *
            100;


        insights.push({

            icon:
                "fa-trophy",

            title:
                "Pass Rate",

            text:
                `The current dataset shows a ${passRate.toFixed(1)}% pass rate across ${formatNumber(metrics.completed)} completed attempts.`
        });
    }


    if (exams.length) {

        const strongest =
            exams
                .slice()
                .sort(
                    (a, b) =>
                        numberValue(
                            b.average_percentage
                        ) -
                        numberValue(
                            a.average_percentage
                        )
                )[0];


        if (strongest) {

            insights.push({

                icon:
                    "fa-chart-line",

                title:
                    "Strongest Examination",

                text:
                    `${strongest.exam_name || "Unnamed Exam"} has the highest average percentage at ${numberValue(strongest.average_percentage).toFixed(1)}%.`
            });
        }


        const weakest =
            exams
                .slice()
                .sort(
                    (a, b) =>
                        numberValue(
                            a.average_percentage
                        ) -
                        numberValue(
                            b.average_percentage
                        )
                )[0];


        if (weakest) {

            insights.push({

                icon:
                    "fa-triangle-exclamation",

                title:
                    "Lowest Average Performance",

                text:
                    `${weakest.exam_name || "Unnamed Exam"} has the lowest average percentage at ${numberValue(weakest.average_percentage).toFixed(1)}%.`
            });
        }
    }


    if (difficulty.length) {

        const hardest =
            difficulty
                .slice()
                .sort(
                    (a, b) =>
                        numberValue(
                            a.accuracy
                        ) -
                        numberValue(
                            b.accuracy
                        )
                )[0];


        if (hardest) {

            insights.push({

                icon:
                    "fa-circle-question",

                title:
                    "Lowest Accuracy Difficulty",

                text:
                    `${hardest.difficulty || "Unknown"} questions have the lowest observed accuracy at ${numberValue(hardest.accuracy).toFixed(1)}%.`
            });
        }


        const skipped =
            difficulty
                .slice()
                .sort(
                    (a, b) =>
                        numberValue(
                            b.skip_rate
                        ) -
                        numberValue(
                            a.skip_rate
                        )
                )[0];


        if (skipped) {

            insights.push({

                icon:
                    "fa-forward",

                title:
                    "Highest Skip Behaviour",

                text:
                    `${skipped.difficulty || "Unknown"} questions have the highest observed skip rate at ${numberValue(skipped.skip_rate).toFixed(1)}%.`
            });
        }
    }


    if (!insights.length) {

        container.innerHTML =
            `
            <div class="analytics-empty-state">
                Insufficient data to generate analytical findings.
            </div>
            `;

        return;
    }


    container.innerHTML =
        insights
            .map(
                insight =>
                    `
                    <div
                        class="analytics-insight-row"
                    >

                        <div
                            class="analytics-insight-row-icon"
                        >

                            <i
                                class="
                                    fa-solid
                                    ${escapeHTML(
                                        insight.icon
                                    )}
                                "
                            ></i>

                        </div>


                        <div>

                            <strong>
                                ${escapeHTML(
                                    insight.title
                                )}
                            </strong>


                            <p>
                                ${escapeHTML(
                                    insight.text
                                )}
                            </p>

                        </div>

                    </div>
                    `
            )
            .join("");
}


/* =========================================================
   TABLE SLIDERS
   ========================================================= */

function setupTableSliders() {

    document
        .querySelectorAll(
            ".analytics-table-scroll"
        )
        .forEach(
            scroll => {

                if (
                    scroll.dataset
                        .sliderReady ===
                    "true"
                ) {
                    return;
                }


                scroll.dataset
                    .sliderReady =
                    "true";


                const controls =
                    document.createElement(
                        "div"
                    );


                controls.className =
                    "analytics-table-slider-controls";


                const left =
                    document.createElement(
                        "button"
                    );


                left.type =
                    "button";

                left.className =
                    "analytics-table-slider-btn";

                left.title =
                    "Slide table left";

                left.innerHTML =
                    `
                    <i class="
                        fa-solid
                        fa-chevron-left
                    "></i>
                    `;


                const right =
                    document.createElement(
                        "button"
                    );


                right.type =
                    "button";

                right.className =
                    "analytics-table-slider-btn";

                right.title =
                    "Slide table right";

                right.innerHTML =
                    `
                    <i class="
                        fa-solid
                        fa-chevron-right
                    "></i>
                    `;


                controls.appendChild(
                    left
                );

                controls.appendChild(
                    right
                );


                scroll.parentNode.insertBefore(
                    controls,
                    scroll
                );


                left.addEventListener(
                    "click",
                    () => {

                        scroll.scrollBy({

                            left:
                                -450,

                            behavior:
                                "smooth"
                        });
                    }
                );


                right.addEventListener(
                    "click",
                    () => {

                        scroll.scrollBy({

                            left:
                                450,

                            behavior:
                                "smooth"
                        });
                    }
                );
            }
        );
}


/* =========================================================
   EXAM DETAIL MODAL
   ========================================================= */

function ensureExamDetailModal() {

    let modal =
        document.getElementById(
            "analyticsExamDetailModal"
        );

    if (modal) {
        return modal;
    }

    modal =
        document.createElement("div");

    modal.id =
        "analyticsExamDetailModal";

    modal.className =
        "analytics-exam-detail-modal";

    modal.innerHTML = `
        <div
            class="analytics-exam-detail-overlay"
            data-close-exam-modal="true"
        ></div>

        <div
            class="analytics-exam-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="analyticsExamDetailTitle"
        >

            <div
                class="analytics-exam-detail-header"
            >

                <div>

                    <span
                        class="analytics-card-kicker"
                    >
                        IN-DEPTH ANALYSIS
                    </span>

                    <h2
                        id="analyticsExamDetailTitle"
                    >
                        Examination Analytics
                    </h2>

                    <p
                        id="analyticsExamDetailSubtitle"
                    >
                        Detailed examination performance
                    </p>

                </div>

                <button
                    type="button"
                    class="analytics-exam-detail-close"
                    id="analyticsExamDetailClose"
                    aria-label="Close"
                >
                    <i
                        class="fa-solid fa-xmark"
                    ></i>
                </button>

            </div>

            <div
                id="analyticsExamDetailBody"
                class="analytics-exam-detail-body"
            >

                <div
                    class="analytics-detail-loading"
                >

                    <i
                        class="fa-solid fa-spinner fa-spin"
                    ></i>

                    Loading detailed analytics...

                </div>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    const closeButton =
        document.getElementById(
            "analyticsExamDetailClose"
        );

    const overlay =
        modal.querySelector(
            "[data-close-exam-modal='true']"
        );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeExamAnalytics
        );

    }

    if (overlay) {

        overlay.addEventListener(
            "click",
            closeExamAnalytics
        );

    }

    return modal;
}


/* =========================================================
   OPEN EXAM DETAILS
   ========================================================= */

async function openExamAnalytics(
    examId,
    examName
) {

    if (!examId) {
        return;
    }


    const modal =
        ensureExamDetailModal();


    const body =
        modal.querySelector(
            "#analyticsExamDetailBody"
        );


    const title =
        modal.querySelector(
            "#analyticsExamDetailTitle"
        );


    const subtitle =
        modal.querySelector(
            "#analyticsExamDetailSubtitle"
        );


    title.textContent =
        examName ||
        "Examination Analytics";


    subtitle.textContent =
        "Loading complete examination analysis...";


    body.innerHTML =
        `
        <div
            class="
                analytics-detail-loading
            "
        >

            <i
                class="
                    fa-solid
                    fa-spinner
                    fa-spin
                "
            ></i>

            <strong>
                Loading detailed analytics...
            </strong>

            <span>
                Please wait.
            </span>

        </div>
        `;


    modal.classList.add(
        "open"
    );


    document.body.classList.add(
        "analytics-modal-open"
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient.rpc(
                "get_admin_exam_analytics_details_v2",
                {
                    p_exam_id:
                        examId
                }
            );


        if (error) {
            throw error;
        }


        const details =
            typeof data ===
                "string"
                ? JSON.parse(data)
                : data;


        renderExamDetail(
            details,
            examName
        );

    }
    catch (error) {

        console.error(
            "Exam detail analytics error:",
            error
        );


        body.innerHTML =
            `
            <div
                class="
                    analytics-detail-error
                "
            >

                <div
                    class="
                        analytics-detail-error-icon
                    "
                >
                    <i
                        class="
                            fa-solid
                            fa-triangle-exclamation
                        "
                    ></i>
                </div>


                <h3>
                    Unable to load detailed analytics
                </h3>


                <p>
                    ${escapeHTML(
                        error?.message ||
                        "The detailed examination analytics could not be loaded."
                    )}
                </p>

            </div>
            `;
    }
}


/* =========================================================
   CLOSE EXAM DETAILS
   ========================================================= */

function closeExamAnalytics() {

    const modal =
        $("analyticsExamDetailModal");

    if (!modal) {
        return;
    }


    modal.classList.remove(
        "open"
    );


    document.body.classList.remove(
        "analytics-modal-open"
    );
}


/* =========================================================
   DETAIL KPI
   ========================================================= */

function detailKPI(
    icon,
    label,
    value
) {

    return `
        <div
            class="
                analytics-detail-kpi
            "
        >

            <div
                class="
                    analytics-detail-kpi-icon
                "
            >

                <i
                    class="
                        fa-solid
                        ${escapeHTML(icon)}
                    "
                ></i>

            </div>


            <div>

                <span>
                    ${escapeHTML(label)}
                </span>

                <strong>
                    ${escapeHTML(value)}
                </strong>

            </div>

        </div>
        `;
}


/* =========================================================
   DETAIL BEHAVIOUR
   ========================================================= */

function detailBehaviourCard(
    label,
    value,
    total,
    className
) {

    const rate =
        numberValue(total) > 0
            ? (
                numberValue(value) /
                numberValue(total)
            ) *
              100
            : 0;


    return `
        <div
            class="
                analytics-detail-behaviour-card
                ${escapeHTML(className)}
            "
        >

            <div>

                <span>
                    ${escapeHTML(label)}
                </span>

                <strong>
                    ${formatNumber(value)}
                </strong>

            </div>


            <b>
                ${percentage(rate)}
            </b>

        </div>
        `;
}


/* =========================================================
   SECTION CARD
   ========================================================= */

function renderSectionDetailCard(
    section,
    index
) {

    const accuracy =
        numberValue(
            section.accuracy
        );


    const sectionName =
        section.section_name ||
        `Section ${index + 1}`;


    return `
        <div
            class="
                analytics-section-detail-card
                section-color-${(
                    index % 6
                ) + 1}
            "
        >

            <div
                class="
                    analytics-section-detail-top
                "
            >

                <div>

                    <span>
                        SECTION ${index + 1}
                    </span>

                    <h4>
                        ${escapeHTML(
                            sectionName
                        )}
                    </h4>

                </div>


                <strong>
                    ${percentage(
                        accuracy
                    )}
                </strong>

            </div>


            <div
                class="
                    analytics-section-progress
                "
            >

                <div
                    style="
                        width:${Math.min(
                            100,
                            Math.max(
                                0,
                                accuracy
                            )
                        )}%;
                    "
                ></div>

            </div>


            <div
                class="
                    analytics-section-detail-stats
                "
            >

                <div>

                    <span>
                        Questions
                    </span>

                    <strong>
                        ${formatNumber(
                            section.question_count
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Correct
                    </span>

                    <strong>
                        ${formatNumber(
                            section.correct
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Wrong
                    </span>

                    <strong>
                        ${formatNumber(
                            section.wrong
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Skipped
                    </span>

                    <strong>
                        ${formatNumber(
                            section.skipped
                        )}
                    </strong>

                </div>

            </div>

        </div>
        `;
}


/* =========================================================
   QUESTION HIGHLIGHT
   ========================================================= */

function renderQuestionHighlight(
    icon,
    label,
    question
) {

    if (!question) {

        let message =
            "No successful question yet.";

        if (
            label ===
            "Most Difficult"
        ) {
            message =
                "No attempted question data.";
        }

        else if (
            label ===
            "Most Skipped"
        ) {
            message =
                "No skipped-question data.";
        }

        return `
            <div
                class="
                    analytics-question-highlight
                    empty
                "
            >

                <div
                    class="
                        analytics-question-highlight-icon
                    "
                >
                    <i
                        class="
                            fa-solid
                            ${escapeHTML(icon)}
                        "
                    ></i>
                </div>

                <div
                    class="
                        analytics-question-highlight-content
                    "
                >

                    <span>
                        ${escapeHTML(label)}
                    </span>

                    <strong>
                        ${escapeHTML(message)}
                    </strong>

                </div>

            </div>
        `;
    }


    const questionNo =
        question.question_no ??
        "—";


    const accuracy =
        numberValue(
            question.accuracy
        );


    const skipRate =
        numberValue(
            question.skip_rate
        );


    const attempted =
        numberValue(
            question.attempted ??
            question.opportunities
        );


    const correct =
        numberValue(
            question.correct
        );


    const wrong =
        numberValue(
            question.wrong
        );


    const skipped =
        numberValue(
            question.skipped
        );


    return `
        <div
            class="
                analytics-question-highlight
            "
        >

            <div
                class="
                    analytics-question-highlight-icon
                "
            >
                <i
                    class="
                        fa-solid
                        ${escapeHTML(icon)}
                    "
                ></i>
            </div>


            <div
                class="
                    analytics-question-highlight-content
                "
            >

                <span>
                    ${escapeHTML(label)}
                </span>


                <strong>
                    Question ${escapeHTML(
                        questionNo
                    )}
                </strong>


                <small>

                    ${percentage(
                        accuracy
                    )}

                    accuracy

                    <b>•</b>

                    ${percentage(
                        skipRate
                    )}

                    skipped

                    <b>•</b>

                    ${formatNumber(
                        attempted
                    )}

                    attempted

                    <b>•</b>

                    ${formatNumber(
                        correct
                    )}

                    correct

                    <b>•</b>

                    ${formatNumber(
                        wrong
                    )}

                    wrong

                    <b>•</b>

                    ${formatNumber(
                        skipped
                    )}

                    skipped

                </small>

            </div>

        </div>
    `;
}


/* =========================================================
   DETAIL TABLE SLIDERS
   ========================================================= */

function setupDetailTableSliders() {

    document
        .querySelectorAll(
            "#analyticsExamDetailModal .analytics-detail-table-scroll"
        )
        .forEach(
            scroll => {

                if (
                    scroll.dataset
                        .sliderReady ===
                    "true"
                ) {
                    return;
                }


                scroll.dataset
                    .sliderReady =
                    "true";


                const controls =
                    document.createElement(
                        "div"
                    );


                controls.className =
                    "analytics-detail-slider-controls";


                const left =
                    document.createElement(
                        "button"
                    );


                left.type =
                    "button";


                left.className =
                    "analytics-detail-slider-btn";


                left.innerHTML =
                    `
                    <i
                        class="
                            fa-solid
                            fa-chevron-left
                        "
                    ></i>
                    `;


                const right =
                    document.createElement(
                        "button"
                    );


                right.type =
                    "button";


                right.className =
                    "analytics-detail-slider-btn";


                right.innerHTML =
                    `
                    <i
                        class="
                            fa-solid
                            fa-chevron-right
                        "
                    ></i>
                    `;


                controls.appendChild(
                    left
                );

                controls.appendChild(
                    right
                );


                scroll.parentNode.insertBefore(
                    controls,
                    scroll
                );


                left.addEventListener(
                    "click",
                    () =>
                        scroll.scrollBy({
                            left:
                                -450,
                            behavior:
                                "smooth"
                        })
                );


                right.addEventListener(
                    "click",
                    () =>
                        scroll.scrollBy({
                            left:
                                450,
                            behavior:
                                "smooth"
                        })
                );
            }
        );
}


/* =========================================================
   EXAM DETAIL RENDER
   ========================================================= */

function renderExamDetail(
    data,
    fallbackExamName
) {

    const modal =
        $("analyticsExamDetailModal");

    if (!modal) {
        return;
    }


    const body =
        modal.querySelector(
            "#analyticsExamDetailBody"
        );


    const title =
        modal.querySelector(
            "#analyticsExamDetailTitle"
        );


    const subtitle =
        modal.querySelector(
            "#analyticsExamDetailSubtitle"
        );


    const overview =
        data?.overview ||
        {};


    const sections =
        Array.isArray(
            data?.sections
        )
            ? data.sections
            : [];


    const questions =
        Array.isArray(
            data?.questions
        )
            ? data.questions
            : [];


    const students =
        Array.isArray(
            data?.student_performance
        )
            ? data.student_performance
            : Array.isArray(
                data?.students
            )
                ? data.students
                : [];


    const exam =
        data?.exam ||
        {};


    title.textContent =
        exam.exam_name ||
        fallbackExamName ||
        "Examination Analytics";


    subtitle.textContent =
        "Complete examination-level performance, sectional and question analysis";


    const attempts =
        numberValue(
            overview.attempts ??
            overview.completed_attempts
        );


    const passed =
        numberValue(
            overview.passed
        );


    const failed =
        numberValue(
            overview.failed
        );


    const passRate =
        attempts > 0
            ? (
                passed /
                attempts
            ) *
              100
            : 0;


    const averagePercentage =
        numberValue(
            overview.average_percentage
        );


    const averageScore =
        numberValue(
            overview.average_score
        );


    const averageTime =
        numberValue(
            overview.average_time
        );


    const totalQuestions =
    numberValue(
        overview.total_questions ||
        exam.total_questions
    );


const totalAttempts =
    numberValue(
        overview.attempts ||
        overview.completed_attempts
    );


const totalOpportunities =
    totalQuestions *
    totalAttempts;


const totalAttempted =
    numberValue(
        overview.total_attempted
    );


const totalCorrect =
    numberValue(
        overview.total_correct
    );


const totalWrong =
    numberValue(
        overview.total_wrong
    );


const totalSkipped =
    numberValue(
        overview.total_skipped
    );


    body.innerHTML =
        `

        <!-- =====================================
             DETAIL OVERVIEW
        ====================================== -->

        <section
            class="
                analytics-detail-section
            "
        >

            <div
                class="
                    analytics-detail-kpi-grid
                "
            >

                ${detailKPI(
                    "fa-users",
                    "Attempts",
                    formatNumber(attempts)
                )}


                ${detailKPI(
                    "fa-user-check",
                    "Students",
                    formatNumber(
                        overview.unique_students
                    )
                )}


                ${detailKPI(
                    "fa-trophy",
                    "Pass Rate",
                    percentage(passRate)
                )}


                ${detailKPI(
                    "fa-chart-line",
                    "Average %",
                    percentage(
                        averagePercentage
                    )
                )}


                ${detailKPI(
                    "fa-star",
                    "Average Score",
                    formatNumber(
                        averageScore,
                        2
                    )
                )}


                ${detailKPI(
                    "fa-stopwatch",
                    "Average Time",
                    formatTime(
                        averageTime
                    )
                )}

            </div>

        </section>


        <!-- =====================================
             ANSWER BEHAVIOUR
        ====================================== -->

        <section
            class="
                analytics-detail-section
            "
        >

            <div
                class="
                    analytics-detail-section-heading
                "
            >

                <span>
                    ANSWER BEHAVIOUR
                </span>


                <h3>
                    Overall Question Behaviour
                </h3>


                <p>
                    How candidates answered the questions in this examination.
                </p>

            </div>


            <div
                class="
                    analytics-detail-behaviour-grid
                "
            >

                ${detailBehaviourCard(
    "Attempted",
    totalAttempted,
    totalOpportunities,
    "attempted"
)}

${detailBehaviourCard(
    "Correct",
    totalCorrect,
    totalOpportunities,
    "correct"
)}

${detailBehaviourCard(
    "Wrong",
    totalWrong,
    totalOpportunities,
    "wrong"
)}

${detailBehaviourCard(
    "Skipped",
    totalSkipped,
    totalOpportunities,
    "skipped"
)}

            </div>

        </section>


        <!-- =====================================
             SECTIONAL ANALYTICS
        ====================================== -->

        ${
            sections.length
                ? `

                <section
                    class="
                        analytics-detail-section
                    "
                >

                    <div
                        class="
                            analytics-detail-section-heading
                        "
                    >

                        <span>
                            SECTIONAL ANALYTICS
                        </span>


                        <h3>
                            Section-wise Performance
                        </h3>


                        <p>
                            Detailed performance comparison across every configured examination section.
                        </p>

                    </div>


                    <div
                        class="
                            analytics-section-detail-grid
                        "
                    >

                        ${sections
                            .map(
                                (
                                    section,
                                    index
                                ) =>
                                    renderSectionDetailCard(
                                        section,
                                        index
                                    )
                            )
                            .join("")}

                    </div>


                    <div
                        class="
                            analytics-detail-table-wrap
                        "
                    >

                        <div
                            class="
                                analytics-detail-table-heading
                            "
                        >

                            <strong>
                                Section Performance Table
                            </strong>


                            <span>
                                ${sections.length}
                                section${
                                    sections.length ===
                                    1
                                        ? ""
                                        : "s"
                                }
                            </span>

                        </div>


                        <div
                            class="
                                analytics-detail-table-scroll
                            "
                        >

                            <table>

                                <thead>

                                    <tr>

                                        <th>
                                            Section
                                        </th>

                                        <th>
                                            Questions
                                        </th>

                                        <th>
    Attempts
</th>

<th>
    Attempted
</th>

                                        <th>
                                            Correct
                                        </th>

                                        <th>
                                            Wrong
                                        </th>

                                        <th>
                                            Skipped
                                        </th>

                                        <th>
                                            Accuracy
                                        </th>

                                        <th>
                                            Skip Rate
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    ${sections
                                        .map(
                                            section =>
                                                `
                                                <tr>

                                                    <td>
                                                        <strong>
                                                            ${escapeHTML(
                                                                section.section_name ||
                                                                "Unnamed Section"
                                                            )}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        ${formatNumber(
                                                            section.question_count
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatNumber(
                                                            section.attempts
                                                        )}
                                                    </td>

                                                    <td>
    ${formatNumber(
        section.attempted
    )}
</td>

                                                    <td>
                                                        ${formatNumber(
                                                            section.correct
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatNumber(
                                                            section.wrong
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatNumber(
                                                            section.skipped
                                                        )}
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            ${percentage(
                                                                section.accuracy
                                                            )}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        ${percentage(
                                                            section.skip_rate
                                                        )}
                                                    </td>

                                                </tr>
                                                `
                                        )
                                        .join("")}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </section>

                `
                : `

                <section
                    class="
                        analytics-detail-section
                    "
                >

                    <div
                        class="
                            analytics-detail-no-sections
                        "
                    >

                        <i
                            class="
                                fa-solid
                                fa-layer-group
                            "
                        ></i>


                        <strong>
                            Non-sectional examination
                        </strong>


                        <p>
                            This examination has no configured sections. Question-level analytics are shown below.
                        </p>

                    </div>

                </section>

                `
        }


        <!-- =====================================
             QUESTION ANALYTICS
        ====================================== -->

        <section
            class="
                analytics-detail-section
            "
        >

            <div
                class="
                    analytics-detail-section-heading
                "
            >

                <span>
                    QUESTION ANALYTICS
                </span>


                <h3>
                    Question-level Performance
                </h3>


                <p>
                    Identify difficult, easy, frequently skipped and low-accuracy questions.
                </p>

            </div>


            <div
                class="
                    analytics-detail-table-wrap
                "
            >

                <div
                    class="
                        analytics-detail-table-heading
                    "
                >

                    <strong>
                        All Question Performance
                    </strong>


                    <span>
                        ${questions.length}
                        question${
                            questions.length === 1
                                ? ""
                                : "s"
                        }
                    </span>

                </div>


                <div
                    class="
                        analytics-detail-table-scroll
                    "
                >

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Q.No
                                </th>

                                <th>
                                    Subject
                                </th>

                                <th>
                                    Section
                                </th>

                                <th>
                                    Difficulty
                                </th>

                                <th>
                                    Attempts
                                </th>

                                <th>
                                    Correct
                                </th>

                                <th>
                                    Wrong
                                </th>

                                <th>
                                    Skipped
                                </th>

                                <th>
                                    Accuracy
                                </th>

                                <th>
                                    Skip Rate
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            ${
                                questions.length
                                    ? questions
                                        .map(
                                            question =>
                                                `
                                                <tr>

                                                    <td>
                                                        <strong>
                                                            ${escapeHTML(
                                                                question.question_no ??
                                                                "—"
                                                            )}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        ${escapeHTML(
                                                            question.subject ||
                                                            "—"
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${escapeHTML(
                                                            question.section_name ||
                                                            "—"
                                                        )}
                                                    </td>

                                                    <td>

                                                        <span
                                                            class="
                                                                analytics-difficulty-badge
                                                            "
                                                        >
                                                            ${escapeHTML(
                                                                question.difficulty ||
                                                                "Unknown"
                                                            )}
                                                        </span>

                                                    </td>

                                                    <td>
                                                        ${formatNumber(
                                                            question.attempted ??
                                                            question.opportunities
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatNumber(
                                                            question.correct
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatNumber(
                                                            question.wrong
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatNumber(
                                                            question.skipped
                                                        )}
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            ${percentage(
                                                                question.accuracy
                                                            )}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        ${percentage(
                                                            question.skip_rate
                                                        )}
                                                    </td>

                                                </tr>
                                                `
                                        )
                                        .join("")
                                    : `
                                        <tr>
                                            <td
                                                colspan="10"
                                                class="
                                                    analytics-empty-cell
                                                "
                                            >
                                                No question-level data available.
                                            </td>
                                        </tr>
                                      `
                            }

                        </tbody>

                    </table>

                </div>

            </div>


            ${
                questions.length
                    ? `

                    <div
                        class="
                            analytics-question-highlights
                        "
                    >

                        ${renderQuestionHighlight(
    "fa-fire",
    "Most Difficult",
    questions
        .filter(
            question =>
                numberValue(
                    question.attempted ??
                    question.opportunities
                ) > 0
        )
        .sort(
            (
                a,
                b
            ) =>
                numberValue(
                    a.accuracy
                ) -
                numberValue(
                    b.accuracy
                )
        )[0] || null
)}

${renderQuestionHighlight(
    "fa-check-circle",
    "Easiest",
    questions
        .filter(
            question =>
                numberValue(
                    question.correct
                ) > 0
        )
        .sort(
            (
                a,
                b
            ) =>
                numberValue(
                    b.accuracy
                ) -
                numberValue(
                    a.accuracy
                )
        )[0] || null
)}

${renderQuestionHighlight(
    "fa-forward",
    "Most Skipped",
    questions
        .filter(
            question =>
                numberValue(
                    question.opportunities
                ) > 0
        )
        .sort(
            (
                a,
                b
            ) =>
                numberValue(
                    b.skip_rate
                ) -
                numberValue(
                    a.skip_rate
                )
        )[0] || null
)}
                    </div>

                    `
                    : ""
            }

        </section>


        <!-- =====================================
             STUDENT PERFORMANCE
        ====================================== -->

        <section
            class="
                analytics-detail-section
            "
        >

            <div
                class="
                    analytics-detail-section-heading
                "
            >

                <span>
                    STUDENT PERFORMANCE
                </span>


                <h3>
                    Candidate Performance in this Examination
                </h3>


                <p>
                    Candidate-level participation, best performance and outcome analysis.
                </p>

            </div>


            <div
                class="
                    analytics-detail-table-wrap
                "
            >

                <div
                    class="
                        analytics-detail-table-heading
                    "
                >

                    <strong>
                        Student Performance
                    </strong>


                    <span>
                        ${students.length}
                        candidate${
                            students.length === 1
                                ? ""
                                : "s"
                        }
                    </span>

                </div>


                <div
                    class="
                        analytics-detail-table-scroll
                    "
                >

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Student
                                </th>

                                <th>
                                    Attempts
                                </th>

                                <th>
                                    Avg. %
                                </th>

                                <th>
                                    Best %
                                </th>

                                <th>
                                    Passed
                                </th>

                                <th>
                                    Failed
                                </th>

                                <th>
                                    Avg. Time
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            ${
                                students.length
                                    ? students
                                        .map(
                                            student =>
                                                `
                                                <tr>

                                                    <td>
                                                        <strong>
                                                            ${escapeHTML(
                                                                getStudentName(
                                                                    student
                                                                )
                                                            )}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        ${formatNumber(
                                                            student.attempts
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${percentage(
                                                            student.average_percentage
                                                        )}
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            ${percentage(
                                                                student.best_percentage
                                                            )}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        ${formatNumber(
                                                            student.passed
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatNumber(
                                                            student.failed
                                                        )}
                                                    </td>

                                                    <td>
                                                        ${formatTime(
                                                            student.average_time
                                                        )}
                                                    </td>

                                                </tr>
                                                `
                                        )
                                        .join("")
                                    : `
                                        <tr>
                                            <td
                                                colspan="7"
                                                class="
                                                    analytics-empty-cell
                                                "
                                            >
                                                No student-level data available.
                                            </td>
                                        </tr>
                                      `
                            }

                        </tbody>

                    </table>

                </div>

            </div>

        </section>


        <!-- =====================================
             PASS / FAIL SUMMARY
        ====================================== -->

        <section
            class="
                analytics-detail-section
            "
        >

            <div
                class="
                    analytics-detail-result-summary
                "
            >

                <div>

                    <span>
                        Passed
                    </span>

                    <strong>
                        ${formatNumber(
                            passed
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Failed
                    </span>

                    <strong>
                        ${formatNumber(
                            failed
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Pass Rate
                    </span>

                    <strong>
                        ${percentage(
                            passRate
                        )}
                    </strong>

                </div>

            </div>

        </section>

        `;


    setupDetailTableSliders();
}


/* =========================================================
   CLEAR FILTERS
   ========================================================= */

function clearAnalyticsFilters() {

    if ($("analyticsExamFilter")) {

        $("analyticsExamFilter")
            .value = "";
    }


    if ($("analyticsPeriodFilter")) {

        $("analyticsPeriodFilter")
            .value = "30";
    }


    if ($("analyticsResultFilter")) {

        $("analyticsResultFilter")
            .value = "";
    }


    renderAnalytics();

    setupTableSliders();
}


/* =========================================================
   EVENTS
   ========================================================= */

function setupAnalyticsEventListeners() {

    $("refreshAnalyticsBtn")
        ?.addEventListener(
            "click",
            loadAnalytics
        );


    $("analyticsExamFilter")
        ?.addEventListener(
            "change",
            renderAnalytics
        );


    $("analyticsPeriodFilter")
        ?.addEventListener(
            "change",
            renderAnalytics
        );


    $("analyticsResultFilter")
        ?.addEventListener(
            "change",
            renderAnalytics
        );


    $("clearAnalyticsFiltersBtn")
        ?.addEventListener(
            "click",
            clearAnalyticsFilters
        );


    $("logoutBtn")
        ?.addEventListener(
            "click",
            async () => {

                try {

                    if (
                        window.examVerseAdmin &&
                        typeof
                            window.examVerseAdmin.logout ===
                            "function"
                    ) {

                        await
                            window.examVerseAdmin.logout();
                    }

                }
                catch (error) {

                    console.error(
                        "Admin logout error:",
                        error
                    );
                }
            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeExamAnalytics();
            }
        }
    );
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initAnalyticsPage() {

    try {

        if (
            window.examVerseAdminReady
        ) {

            await
                window.examVerseAdminReady;
        }

    }
    catch (error) {

        console.error(
            "Admin auth initialization error:",
            error
        );
    }


    if (
        !hasAnalyticsPermission()
    ) {

        showAccessDenied();

        return;
    }


    setupAnalyticsEventListeners();

    await loadAnalytics();
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
        initAnalyticsPage
    );

}
else {

    initAnalyticsPage();
}