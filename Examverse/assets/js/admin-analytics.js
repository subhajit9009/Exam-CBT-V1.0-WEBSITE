/* =========================================================
   EXAMVERSE ADMIN ANALYTICS
   Permission: analytics.view
   Read-only analytical dashboard.
   ========================================================= */

let analyticsData = null;

let performanceTrendChart = null;
let passFailChart = null;
let scoreDistributionChart = null;
let difficultyChart = null;

let analyticsUserMap = new Map();


const $ = id =>
    document.getElementById(id);


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


function numberValue(value, fallback = 0) {

    const n = Number(value);

    return Number.isFinite(n)
        ? n
        : fallback;
}


function percentage(value, digits = 1) {

    const n =
        numberValue(value);

    return `${n.toFixed(digits)}%`;
}


function formatNumber(value, digits = 0) {

    const n =
        numberValue(value);

    return n.toLocaleString(
        undefined,
        {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
        }
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


function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();
}


function resultIsPassed(result) {

    const value =
        normalize(result);

    return (
        value === "passed" ||
        value === "pass" ||
        value.includes("pass")
    );
}


function resultIsFailed(result) {

    const value =
        normalize(result);

    return (
        value === "failed" ||
        value === "fail" ||
        value.includes("fail")
    );
}


/* =========================================================
   STUDENT NAME
   ========================================================= */

function buildStudentName(row) {

    if (!row) {
        return "Student";
    }

    const mappedName =
        analyticsUserMap.get(
            String(
                row.user_id || ""
            )
        );

    if (mappedName) {
        return mappedName;
    }

    const fullName =
        [
            row.first_name,
            row.middle_name,
            row.last_name
        ]
            .map(
                value =>
                    String(value ?? "").trim()
            )
            .filter(Boolean)
            .join(" ")
            .trim();

    if (fullName) {
        return fullName;
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
        row.email &&
        String(row.email).trim()
    ) {
        return String(
            row.email
        ).trim();
    }

    return "Student";
}


function getResultStudentName(row) {

    return buildStudentName(row);
}


/* =========================================================
   USER DIRECTORY
   ========================================================= */

async function loadAnalyticsUserDirectory() {

    analyticsUserMap =
        new Map();

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
                "Analytics user directory could not be loaded:",
                error
            );
            return;
        }

        let rows = [];

        if (Array.isArray(data)) {
            rows = data;
        }
        else if (
            data &&
            Array.isArray(data.data)
        ) {
            rows = data.data;
        }

        rows.forEach(row => {

            if (!row || !row.id) {
                return;
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

            const finalName =
                name ||
                row.full_name ||
                row.email ||
                "";

            if (finalName) {

                analyticsUserMap.set(
                    String(row.id),
                    String(finalName)
                );

            }

        });

    }
    catch (error) {

        console.warn(
            "Analytics directory error:",
            error
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
   ACCESS CONTROL
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

    const analyticsNav =
        document.querySelector(
            'a[href="admin-analytics.html"]'
        );

    if (analyticsNav) {
        analyticsNav.remove();
    }
}


/* =========================================================
   DATA NORMALIZATION
   ========================================================= */

function normalizeAnalyticsResponse(data) {

    if (!data) {

        return {
            overview: {},
            exam_wise: [],
            daily_trend: [],
            difficulty: [],
            recent_results: []
        };
    }

    return {

        overview:
            data.overview || {},

        exam_wise:
            Array.isArray(
                data.exam_wise
            )
                ? data.exam_wise
                : [],

        daily_trend:
            Array.isArray(
                data.daily_trend
            )
                ? data.daily_trend
                : [],

        difficulty:
            Array.isArray(
                data.difficulty
            )
                ? data.difficulty
                : [],

        recent_results:
            Array.isArray(
                data.recent_results
            )
                ? data.recent_results
                : []
    };
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

        /*
           Load the secure analytics RPC.
        */

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


        /*
           Load the secure Admin user directory.

           This makes sure student names are shown
           even if get_admin_analytics() does not
           return profile fields.
        */

        await loadAnalyticsUserDirectory();


        populateExamFilter();

        renderAnalytics();

    }
    catch (error) {

        console.error(
            "ADMIN ANALYTICS LOAD ERROR:",
            error
        );

        renderAnalyticsError(
            error?.message ||
            "Unable to load analytics."
        );

        if (
            typeof showPopup ===
            "function"
        ) {

            showPopup(
                "error",
                "Analytics Loading Failed",
                error?.message ||
                "Unable to load examination analytics."
            );
        }

    }
    finally {

        setAnalyticsLoading(
            false
        );
    }
}


/* =========================================================
   LOADING
   ========================================================= */

function setAnalyticsLoading(
    isLoading
) {

    const button =
        $("refreshAnalyticsBtn");

    if (!button) {
        return;
    }

    if (isLoading) {

        button.disabled =
            true;

        button.innerHTML =
            `<i class="fa-solid fa-spinner fa-spin"></i>
             Loading...`;
    }
    else {

        button.disabled =
            false;

        button.innerHTML =
            `<i class="fa-solid fa-rotate"></i>
             Refresh`;
    }
}


/* =========================================================
   ERROR
   ========================================================= */

function renderAnalyticsError(
    message
) {

    const containers = [

        "examAnalyticsTableBody",

        "difficultyAnalyticsTableBody",

        "topPerformersTableBody",

        "recentResultsTableBody"
    ];

    containers.forEach(
        id => {

            const element =
                $(id);

            if (!element) {
                return;
            }

            const colspan =
                id ===
                "examAnalyticsTableBody"
                    ? 13
                    :
                id ===
                "difficultyAnalyticsTableBody"
                    ? 8
                    : 5;

            element.innerHTML = `
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
        [
            ...analyticsData.exam_wise
        ]
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
        `<option value="">
            All Exams
        </option>` +
        exams
            .map(
                exam => `
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
   FILTER HELPERS
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
        "all"
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

    if (period === "all") {
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
   FILTERED DATA
   ========================================================= */

function getFilteredExamRows() {

    if (!analyticsData) {
        return [];
    }

    const examId =
        getSelectedExamId();

    return analyticsData.exam_wise
        .filter(
            exam =>
                !examId ||
                String(
                    exam.exam_id
                ) === examId
        );
}


function getFilteredRecentResults() {

    if (!analyticsData) {
        return [];
    }

    const examId =
        getSelectedExamId();

    const result =
        getSelectedResult();

    return analyticsData.recent_results
        .filter(
            row => {

                if (
                    examId &&
                    String(
                        row.exam_id
                    ) !==
                    examId
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
                    result === "passed" &&
                    !resultIsPassed(
                        row.result
                    )
                ) {
                    return false;
                }

                if (
                    result === "failed" &&
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


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderAnalytics() {

    renderOverview();

    renderCharts();

    renderExamTable();

    renderDifficultyTable();

    renderTopPerformers();

    renderRecentResults();

    renderBehaviourMetrics();

    renderInsights();
}


/* =========================================================
   CALCULATE OVERVIEW DATA
   ========================================================= */

function calculateVisibleMetrics() {

    const overview =
        analyticsData?.overview ||
        {};

    const examRows =
        getFilteredExamRows();

    const examFilter =
        getSelectedExamId();

    let completed =
        numberValue(
            overview.completed_attempts
        );

    let passed =
        0;

    let failed =
        0;

    let averagePercentage =
        numberValue(
            overview.average_percentage
        );

    let averageScore =
        numberValue(
            overview.average_score
        );

    let averageTime =
        numberValue(
            overview.average_time
        );

    let attempted =
        numberValue(
            overview.total_attempted
        );

    let correct =
        numberValue(
            overview.total_correct
        );

    let wrong =
        numberValue(
            overview.total_wrong
        );

    let skipped =
        numberValue(
            overview.total_skipped
        );


    /*
       Always derive pass/fail from exam_wise.

       This fixes the situation where the overview
       RPC values are zero while the exam rows contain
       the actual passed/failed counts.
    */

    if (examRows.length) {

        let weightedPercentage = 0;
        let weightedScore = 0;
        let weightedTime = 0;

        attempted = 0;
        correct = 0;
        wrong = 0;
        skipped = 0;
        completed = 0;
        passed = 0;
        failed = 0;

        examRows.forEach(
            row => {

                const attempts =
                    numberValue(
                        row.attempts
                    );

                completed +=
                    attempts;

                passed +=
                    numberValue(
                        row.passed
                    );

                failed +=
                    numberValue(
                        row.failed
                    );

                weightedPercentage +=
                    numberValue(
                        row.average_percentage
                    ) *
                    attempts;

                weightedScore +=
                    numberValue(
                        row.average_score
                    ) *
                    attempts;

                weightedTime +=
                    numberValue(
                        row.average_time
                    ) *
                    attempts;

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

        averagePercentage =
            completed > 0
                ? weightedPercentage /
                    completed
                : 0;

        averageScore =
            completed > 0
                ? weightedScore /
                    completed
                : 0;

        averageTime =
            completed > 0
                ? weightedTime /
                    completed
                : 0;
    }
    else {

        /*
           No exam rows.
           Fall back to overview.
        */

        passed =
            numberValue(
                overview.passed_attempts
            );

        failed =
            numberValue(
                overview.failed_attempts
            );
    }


    /*
       Result filter.

       For pass/fail analytics, when a result filter
       is selected, calculate from the visible results.
    */

    const filteredResults =
        getFilteredRecentResults();

    if (
        getSelectedResult() &&
        filteredResults.length
    ) {

        completed =
            filteredResults.length;

        passed =
            filteredResults.filter(
                row =>
                    resultIsPassed(
                        row.result
                    )
            ).length;

        failed =
            filteredResults.filter(
                row =>
                    resultIsFailed(
                        row.result
                    )
            ).length;

        const totalPercentage =
            filteredResults.reduce(
                (total, row) =>
                    total +
                    numberValue(
                        row.percentage
                    ),
                0
            );

        const totalScore =
            filteredResults.reduce(
                (total, row) =>
                    total +
                    numberValue(
                        row.score
                    ),
                0
            );

        averagePercentage =
            completed > 0
                ? totalPercentage /
                    completed
                : 0;

        averageScore =
            completed > 0
                ? totalScore /
                    completed
                : 0;
    }


    return {
        overview,
        completed,
        passed,
        failed,
        averagePercentage,
        averageScore,
        averageTime,
        attempted,
        correct,
        wrong,
        skipped
    };
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

    const completed =
        metrics.completed;

    const passed =
        metrics.passed;

    const passRate =
        completed > 0
            ? (
                passed /
                completed
            ) * 100
            : 0;


    if ($("analyticsTotalUsers")) {

        $("analyticsTotalUsers")
            .textContent =
            formatNumber(
                metrics.overview
                    .total_users
            );
    }


    if ($("analyticsTotalExams")) {

        $("analyticsTotalExams")
            .textContent =
            formatNumber(
                metrics.overview
                    .total_exams
            );
    }


    if ($("analyticsTotalQuestions")) {

        $("analyticsTotalQuestions")
            .textContent =
            formatNumber(
                metrics.overview
                    .total_questions
            );
    }


    if ($("analyticsCompletedAttempts")) {

        $("analyticsCompletedAttempts")
            .textContent =
            formatNumber(
                completed
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
   BEHAVIOUR METRICS
   ========================================================= */

function renderBehaviourMetrics() {

    if (!analyticsData) {
        return;
    }

    const metrics =
        calculateVisibleMetrics();

    const attempted =
        numberValue(
            metrics.attempted
        );

    const correct =
        numberValue(
            metrics.correct
        );

    const wrong =
        numberValue(
            metrics.wrong
        );

    const skipped =
        numberValue(
            metrics.skipped
        );


    /*
       Total questions represented by the
       examination attempt data.
    */

    const totalQuestions =
        attempted +
        skipped;


    /*
       Correct-answer accuracy is calculated only
       among questions actually answered.
    */

    const answeredQuestions =
        correct +
        wrong;

    const accuracy =
        answeredQuestions > 0
            ? (
                correct /
                answeredQuestions
            ) * 100
            : 0;


    /*
       Skip rate.
    */

    const skipRate =
        totalQuestions > 0
            ? (
                skipped /
                totalQuestions
            ) * 100
            : 0;


    /*
       Wrong-answer rate.
    */

    const wrongRate =
        totalQuestions > 0
            ? (
                wrong /
                totalQuestions
            ) * 100
            : 0;


    /*
       Attempt rate = answered / total questions.
    */

    const attemptRate =
        totalQuestions > 0
            ? (
                attempted /
                totalQuestions
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
   CHART OPTIONS
   ========================================================= */

function getChartLegendOptions() {

    return {

        position: "bottom",

        labels: {
            usePointStyle: true,
            padding: 18
        },

        /*
           IMPORTANT:
           Do NOT allow clicking a legend item
           to hide its dataset.

           Chart remains interactive through:
           - hover
           - tooltip
           - point interaction
           - chart movement
        */

        onClick: function () {
            return;
        }
    };
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
        analyticsData.daily_trend
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


    /*
       If an exam is selected, use the available
       recent results to create a visible trend
       for that examination.
    */

    const examId =
        getSelectedExamId();

    if (examId) {

        const selectedResults =
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

        if (
            selectedResults.length
        ) {

            const grouped =
                new Map();

            selectedResults.forEach(
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
                        !grouped.has(
                            key
                        )
                    ) {

                        grouped.set(
                            key,
                            {
                                percentageTotal: 0,
                                attempts: 0
                            }
                        );
                    }

                    const item =
                        grouped.get(
                            key
                        );

                    item.percentageTotal +=
                        numberValue(
                            row.percentage
                        );

                    item.attempts += 1;
                }
            );

            rows =
                Array.from(
                    grouped.entries()
                )
                .map(
                    ([date, value]) => ({
                        date,
                        average_percentage:
                            value.attempts
                                ? value.percentageTotal /
                                  value.attempts
                                : 0,
                        attempts:
                            value.attempts
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

                            tension: 0.35,

                            borderWidth: 3,

                            pointRadius: 4,

                            pointHoverRadius: 7,

                            fill: false
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

                            tension: 0.35,

                            borderWidth: 2,

                            pointRadius: 3,

                            pointHoverRadius: 6,

                            yAxisID:
                                "attemptAxis",

                            fill: false
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        mode: "index",

                        intersect: false
                    },

                    plugins: {

                        legend:
                            getChartLegendOptions(),

                        tooltip: {

                            enabled: true,

                            mode: "index",

                            intersect: false
                        }
                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            max: 100,

                            title: {

                                display: true,

                                text:
                                    "Percentage"
                            }
                        },

                        attemptAxis: {

                            beginAtZero: true,

                            position: "right",

                            grid: {

                                drawOnChartArea:
                                    false
                            },

                            title: {

                                display: true,

                                text:
                                    "Attempts"
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

    const examRows =
        getFilteredExamRows();

    let passed = 0;
    let failed = 0;


    /*
       Always derive pass/fail from exam_wise.

       This is the important fix for the blank
       doughnut chart.
    */

    examRows.forEach(
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


    /*
       If a result filter is active,
       use the visible recent results.
    */

    const resultFilter =
        getSelectedResult();

    if (resultFilter) {

        const rows =
            getFilteredRecentResults();

        passed = 0;
        failed = 0;

        rows.forEach(
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
    }


    /*
       If no exam data is available,
       fall back to overview values.
    */

    if (
        !examRows.length &&
        !resultFilter
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


    passFailChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "doughnut",

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

                            borderWidth: 2,

                            hoverOffset: 8
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    cutout: "62%",

                    interaction: {

                        mode: "nearest",

                        intersect: true
                    },

                    plugins: {

                        legend:
                            getChartLegendOptions(),

                        tooltip: {

                            enabled: true,

                            callbacks: {

                                label:
                                    function (
                                        context
                                    ) {

                                        const total =
                                            passed +
                                            failed;

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
                                            ` ${context.label}: ` +
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

    const rows =
        getFilteredRecentResults();


    const buckets = {

        "0–20%": 0,

        "21–40%": 0,

        "41–60%": 0,

        "61–80%": 0,

        "81–100%": 0
    };


    rows.forEach(
        row => {

            const value =
                numberValue(
                    row.percentage
                );

            if (value <= 20) {

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

                type: "bar",

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

                            borderWidth: 1,

                            borderRadius: 6,

                            hoverBorderWidth: 2
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        mode: "index",

                        intersect: false
                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {

                                precision: 0
                            },

                            title: {

                                display: true,

                                text:
                                    "Attempts"
                            }
                        }
                    },

                    plugins: {

                        legend: {

                            display: false,

                            onClick:
                                function () {
                                    return;
                                }
                        },

                        tooltip: {

                            enabled: true
                        }
                    }
                }
            }
        );
}


/* =========================================================
   DIFFICULTY CHART
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
            .difficulty || [];


    difficultyChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "bar",

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

                            borderWidth: 1,

                            borderRadius: 6,

                            hoverBorderWidth: 2
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

                            borderWidth: 1,

                            borderRadius: 6,

                            hoverBorderWidth: 2
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        mode: "index",

                        intersect: false
                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            max: 100,

                            title: {

                                display: true,

                                text:
                                    "Percentage"
                            }
                        }
                    },

                    plugins: {

                        legend:
                            getChartLegendOptions(),

                        tooltip: {

                            enabled: true
                        }
                    }
                }
            }
        );
}


/* =========================================================
   EXAM TABLE
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

        tbody.innerHTML = `
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
                row => `

                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    row.exam_name ||
                                    "Unnamed Exam"
                                )}
                            </strong>
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
                                class="analytics-result-badge passed"
                            >
                                ${percentage(
                                    row.pass_rate
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
                `
            )
            .join("");
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
        analyticsData?.difficulty ||
        [];


    if (!rows.length) {

        tbody.innerHTML = `
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
                row => `

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

        tbody.innerHTML = `
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
                row => `

                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    getResultStudentName(
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

                            <span class="
                                analytics-result-badge
                                ${
                                    resultIsPassed(
                                        row.result
                                    )
                                        ? "passed"
                                        : "failed"
                                }
                            ">

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

        tbody.innerHTML = `
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
                row => `

                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    getResultStudentName(
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

                            <span class="
                                analytics-result-badge
                                ${
                                    resultIsPassed(
                                        row.result
                                    )
                                        ? "passed"
                                        : "failed"
                                }
                            ">

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
   ANALYTICAL INSIGHTS
   ========================================================= */

function renderInsights() {

    const container =
        $("analyticsInsights");

    if (!container) {
        return;
    }

    const exams =
        getFilteredExamRows();

    const difficulty =
        analyticsData?.difficulty ||
        [];

    const metrics =
        calculateVisibleMetrics();

    const insights = [];


    /*
       PASS RATE
    */

    const completed =
        metrics.completed;

    const passed =
        metrics.passed;

    const passRate =
        completed > 0
            ? (
                passed /
                completed
            ) * 100
            : 0;


    if (completed > 0) {

        insights.push({

            icon:
                "fa-trophy",

            title:
                "Pass Rate",

            text:
                `The current dataset shows an overall pass rate of ${passRate.toFixed(1)}% across ${formatNumber(completed)} completed attempt${completed === 1 ? "" : "s"}.`
        });
    }


    /*
       BEST / WEAKEST EXAM
    */

    if (exams.length) {

        const bestExam =
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


        if (bestExam) {

            insights.push({

                icon:
                    "fa-chart-line",

                title:
                    "Strongest Examination",

                text:
                    `${bestExam.exam_name || "Unnamed Exam"} currently has the highest average percentage at ${numberValue(bestExam.average_percentage).toFixed(1)}%.`
            });
        }


        const weakestExam =
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


        if (weakestExam) {

            insights.push({

                icon:
                    "fa-triangle-exclamation",

                title:
                    "Lowest Average Performance",

                text:
                    `${weakestExam.exam_name || "Unnamed Exam"} currently has the lowest average percentage at ${numberValue(weakestExam.average_percentage).toFixed(1)}%.`
            });
        }


        const mostPassed =
            exams
                .slice()
                .sort(
                    (a, b) =>
                        numberValue(
                            b.pass_rate
                        ) -
                        numberValue(
                            a.pass_rate
                        )
                )[0];


        if (mostPassed) {

            insights.push({

                icon:
                    "fa-ranking-star",

                title:
                    "Highest Pass Rate",

                text:
                    `${mostPassed.exam_name || "Unnamed Exam"} currently has the highest pass rate at ${numberValue(mostPassed.pass_rate).toFixed(1)}%.`
            });
        }
    }


    /*
       DIFFICULTY
    */

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
                    `${hardest.difficulty || "Unknown"} questions currently have the lowest observed accuracy at ${numberValue(hardest.accuracy).toFixed(1)}%.`
            });
        }


        const mostSkipped =
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


        if (mostSkipped) {

            insights.push({

                icon:
                    "fa-forward-step",

                title:
                    "Highest Skip Behaviour",

                text:
                    `${mostSkipped.difficulty || "Unknown"} questions have the highest observed skip rate at ${numberValue(mostSkipped.skip_rate).toFixed(1)}%.`
            });
        }
    }


    /*
       RENDER
    */

    if (!insights.length) {

        container.innerHTML = `
            <div class="analytics-empty-state">
                Insufficient data to generate analytical findings.
            </div>
        `;

        return;
    }


    container.innerHTML =
        insights
            .map(
                insight => `

                    <div class="analytics-insight-row">

                        <div
                            class="analytics-insight-row-icon"
                        >

                            <i class="
                                fa-solid
                                ${escapeHTML(
                                    insight.icon
                                )}
                            "></i>

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
   FILTER EVENTS
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
}


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
}


/* =========================================================
   PAGE INITIALIZATION
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