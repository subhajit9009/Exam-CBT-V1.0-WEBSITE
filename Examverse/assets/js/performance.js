/* =====================================================
   EXAMVERSE
   ADVANCED PERFORMANCE ANALYTICS
===================================================== */

let allAttempts = [];

let allExams = [];

let allQuestions = [];

let allAnswers = [];

let filteredAttempts = [];

let performanceChart = null;

let accuracyChart = null;


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            await loadPerformanceData();

            setupControls();

        }

        catch (error) {

            console.error(
                "Performance error:",
                error
            );

        }

    }
);


/* =====================================================
   LOAD EVERYTHING
===================================================== */

async function loadPerformanceData() {

    const {
        data: authData,
        error: authError
    } =
        await supabaseClient.auth.getUser();


    if (
        authError ||
        !authData.user
    ) {

        window.location.href =
            "login.html";

        return;

    }


    const userId =
        authData.user.id;


    /* =================================================
       ATTEMPTS
    ================================================= */

    const {
        data: attempts,
        error: attemptsError
    } =
        await supabaseClient

            .from("exam_attempts")

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
                result,
                status,
                submitted_at,
                time_taken
            `)

            .eq(
                "user_id",
                userId
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

        throw attemptsError;

    }


    allAttempts =
        attempts || [];


    /* =================================================
       EXAMS
    ================================================= */

    const examIds =
        unique(
            allAttempts
                .map(
                    x =>
                        x.exam_id
                )
                .filter(Boolean)
        );


    if (
        examIds.length
    ) {

        const {
            data: exams,
            error: examsError
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


        if (examsError) {

            console.error(
                examsError
            );

        }

        else {

            allExams =
                exams || [];

        }

    }


    /* =================================================
       QUESTIONS
    ================================================= */

    if (
        examIds.length
    ) {

        const {
            data: questions,
            error: questionError
        } =
            await supabaseClient

                .from("questions")

                .select("*")

                .in(
                    "exam_id",
                    examIds
                );


        if (questionError) {

            console.error(
                "Question loading:",
                questionError
            );

        }

        else {

            allQuestions =
                questions || [];

        }

    }


    /* =================================================
       USER ANSWERS
    ================================================= */

    const attemptIds =
        allAttempts
            .map(
                x =>
                    x.id
            )
            .filter(Boolean);


    if (
        attemptIds.length
    ) {

        const {
            data: answers,
            error: answersError
        } =
            await supabaseClient

                .from("user_answers")

                .select(`
                    id,
                    attempt_id,
                    question_id,
                    selected_option,
                    is_review
                `)

                .in(
                    "attempt_id",
                    attemptIds
                );


        if (answersError) {

            console.error(
                "Answers loading:",
                answersError
            );

        }

        else {

            allAnswers =
                answers || [];

        }

    }


    attachExamNames();

    populateExamFilter();

    applyFilters();

}


/* =====================================================
   ATTACH EXAM NAME
===================================================== */

function attachExamNames() {

    const map =
        new Map();


    allExams.forEach(
        exam => {

            map.set(
                String(
                    exam.id
                ),
                exam
            );

        }
    );


    allAttempts =
        allAttempts.map(
            attempt => {

                const exam =
                    map.get(
                        String(
                            attempt.exam_id
                        )
                    );


                return {

                    ...attempt,

                    examName:
                        exam?.exam_name ||
                        "Unknown Examination",

                    totalMarks:
                        Number(
                            exam?.total_marks
                        ) || 0,

                    passingMarks:
                        exam?.passing_marks

                };

            }
        );

}


/* =====================================================
   CONTROLS
===================================================== */

function setupControls() {

    document
        .getElementById(
            "examFilter"
        )
        .addEventListener(
            "change",
            applyFilters
        );


    document
        .getElementById(
            "periodFilter"
        )
        .addEventListener(
            "change",
            applyFilters
        );


    document
        .getElementById(
            "resetFilters"
        )
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "examFilter"
                    )
                    .value =
                    "all";


                document
                    .getElementById(
                        "periodFilter"
                    )
                    .value =
                    "all";


                applyFilters();

            }
        );


    document
        .getElementById(
            "refreshBtn"
        )
        .addEventListener(
            "click",
            async () => {

                location.reload();

            }
        );

}


/* =====================================================
   EXAM FILTER
===================================================== */

function populateExamFilter() {

    const select =
        document.getElementById(
            "examFilter"
        );


    const map =
        new Map();


    allAttempts.forEach(
        attempt => {

            map.set(
                String(
                    attempt.exam_id
                ),
                attempt.examName
            );

        }
    );


    [...map.entries()]
        .sort(
            (
                a,
                b
            ) =>
                a[1].localeCompare(
                    b[1]
                )
        )
        .forEach(
            (
                [
                    id,
                    name
                ]
            ) => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    id;


                option.textContent =
                    name;


                select.appendChild(
                    option
                );

            }
        );

}


/* =====================================================
   FILTER
===================================================== */

function applyFilters() {

    const exam =
        document
            .getElementById(
                "examFilter"
            )
            .value;


    const period =
        document
            .getElementById(
                "periodFilter"
            )
            .value;


    filteredAttempts =
        allAttempts.filter(
            attempt => {


                if (
                    exam !==
                    "all" &&
                    String(
                        attempt.exam_id
                    ) !==
                    String(
                        exam
                    )
                ) {

                    return false;

                }


                if (
                    period !==
                    "all"
                ) {

                    const days =
                        Number(
                            period
                        );


                    const date =
                        new Date(
                            attempt.submitted_at
                        );


                    const cutoff =
                        new Date();


                    cutoff.setDate(
                        cutoff.getDate() -
                        days
                    );


                    if (
                        date <
                        cutoff
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    renderAll();

}


/* =====================================================
   RENDER ALL
===================================================== */

function renderAll() {

    renderHero();

    renderKPI();

    renderQuestionStats();

    renderPerformanceChart();

    renderAccuracyChart();

    renderDistribution();

    renderInsights();

    renderStrengthsWeaknesses();

    renderExamWise();

    renderSectionWise();

    renderRecent();

}


/* =====================================================
   HERO
===================================================== */

function renderHero() {

    const attempts =
        filteredAttempts;


    const percentages =
        attempts.map(
            x =>
                num(
                    x.percentage
                )
        );


    const average =
        avg(
            percentages
        );


    const best =
        percentages.length
            ? Math.max(
                ...percentages
            )
            : 0;


    const recent =
        attempts.length
            ? num(
                attempts[0].percentage
            )
            : 0;


    let previous =
        attempts.length > 1
            ? num(
                attempts[1].percentage
            )
            : null;


    const change =
        previous === null
            ? null
            :
              recent -
              previous;


    const consistency =
        calculateConsistency(
            percentages
        );


    setText(
        "overallPerformance",
        percent(
            average
        )
    );


    setText(
    "heroAverage",
    percent(
        recent
    )
);


    setText(
        "heroBest",
        percent(
            best
        )
    );


    setText(
        "heroChange",
        change === null
            ? "—"
            :
            (
                change >= 0
                    ? "+"
                    : ""
            ) +
            change.toFixed(
                1
            ) +
            " pts"
    );


    setText(
        "heroConsistency",
        consistency
    );


    const progress =
        document.getElementById(
            "heroProgress"
        );


    if (progress) {

        progress.style.width =
            Math.min(
                100,
                Math.max(
                    0,
                    average
                )
            ) +
            "%";

    }


    let message =
        "Complete more tests to build your performance profile.";


    if (
        average >= 85
    ) {

        message =
            "Excellent performance. You are maintaining a very strong level.";

    }

    else if (
        average >= 70
    ) {

        message =
            "Good performance. Focus on consistency and weak areas.";

    }

    else if (
        average >= 50
    ) {

        message =
            "You are progressing. More practice can significantly improve your score.";

    }

    else if (
        attempts.length
    ) {

        message =
            "Your fundamentals need more practice. Focus on accuracy before speed.";

    }


    setText(
        "performanceMessage",
        message
    );

}


/* =====================================================
   KPI
===================================================== */

function renderKPI() {

    const a =
        filteredAttempts;


    const totalTests =
        a.length;


    const avgScore =
        avg(
            a.map(
                x =>
                    num(
                        x.score
                    )
            )
        );


    const highest =
        a.length
            ? Math.max(
                ...a.map(
                    x =>
                        num(
                            x.percentage
                        )
                )
            )
            : 0;


    const correct =
        sum(
            a,
            "correct"
        );


    const attempted =
        sum(
            a,
            "attempted"
        );


    const totalQuestions =
        sum(
            a,
            "total_questions"
        );


    const skipped =
        sum(
            a,
            "skipped"
        );


    const accuracy =
        attempted
            ? correct /
              attempted *
              100
            : 0;


    const attemptRate =
        totalQuestions
            ? attempted /
              totalQuestions *
              100
            : 0;


    const skipRate =
        totalQuestions
            ? skipped /
              totalQuestions *
              100
            : 0;


    setText(
        "totalTests",
        totalTests
    );


    setText(
        "averageScore",
        number(
            avgScore
        )
    );


    setText(
        "overallAccuracy",
        percent(
            accuracy
        )
    );


    setText(
        "highestPercentage",
        percent(
            highest
        )
    );


    setText(
        "attemptRate",
        percent(
            attemptRate
        )
    );


    setText(
        "skipRate",
        percent(
            skipRate
        )
    );

}


/* =====================================================
   QUESTION STATS
===================================================== */

function renderQuestionStats() {

    const a =
        filteredAttempts;


    const attempted =
        sum(
            a,
            "attempted"
        );


    const correct =
        sum(
            a,
            "correct"
        );


    const wrong =
        sum(
            a,
            "wrong"
        );


    const skipped =
        sum(
            a,
            "skipped"
        );


    const totalQuestions =
        sum(
            a,
            "total_questions"
        );


    const totalTime =
        sum(
            a,
            "time_taken"
        );


    const avgTime =
        a.length
            ? totalTime /
              a.length
            : 0;


    const avgQuestionTime =
        attempted
            ? totalTime /
              attempted
            : 0;


    const qpm =
        totalTime
            ? attempted /
              (
                  totalTime /
                  60
              )
            : 0;


    const pass =
        a.filter(
            x =>
                String(
                    x.result ||
                    ""
                )
                    .toLowerCase()
                    .includes(
                        "pass"
                    )
        ).length;


    const passRate =
        a.length
            ? pass /
              a.length *
              100
            : 0;


    setText(
        "totalAttempted",
        attempted
    );


    setText(
        "totalCorrect",
        correct
    );


    setText(
        "totalWrong",
        wrong
    );


    setText(
        "totalSkipped",
        skipped
    );


    setText(
        "averageTime",
        duration(
            avgTime
        )
    );


    setText(
        "averageQuestionTime",
        duration(
            avgQuestionTime
        )
    );


    setText(
        "questionsPerMinute",
        qpm.toFixed(
            2
        )
    );


    setText(
        "passRate",
        percent(
            passRate
        )
    );

}


/* =====================================================
   PERFORMANCE CHART
===================================================== */

function renderPerformanceChart() {

    const canvas =
        document.getElementById(
            "performanceChart"
        );


    const empty =
        document.getElementById(
            "trendEmpty"
        );


    if (
        performanceChart
    ) {

        performanceChart.destroy();

    }


    if (
        !filteredAttempts.length
    ) {

        empty.style.display =
            "flex";

        return;

    }


    empty.style.display =
        "none";


    const data =
        [...filteredAttempts]
            .reverse();


    performanceChart =
        new Chart(
            canvas,
            {

                type:
                    "line",

                data: {

                    labels:
                        data.map(
                            (
                                x,
                                i
                            ) =>
                                "#" +
                                (
                                    i + 1
                                )
                        ),

                    datasets: [

                        {

                            label:
                                "Percentage",

                            data:
                                data.map(
                                    x =>
                                        num(
                                            x.percentage
                                        )
                                ),

                            borderWidth:
                                3,

                            tension:
                                .35,

                            fill:
                                true,

                            pointRadius:
                                4

                        }

                    ]

                },

                options: {

    responsive:
        true,

    maintainAspectRatio:
        false,

    plugins: {

        legend: {

            onClick: () => {
                // Dataset visibility locked
            }

        }

    },

                    interaction: {

                        intersect:
                            false,

                        mode:
                            "index"

                    },

                    scales: {

                        y: {

                            min:
                                0,

                            max:
                                100,

                            ticks: {

                                callback:
                                    value =>
                                        value +
                                        "%"

                            }

                        }

                    }

                }

            }
        );

}


/* =====================================================
   ACCURACY CHART
===================================================== */

function renderAccuracyChart() {

    const canvas =
        document.getElementById(
            "accuracyChart"
        );


    const empty =
        document.getElementById(
            "accuracyEmpty"
        );


    if (
        accuracyChart
    ) {

        accuracyChart.destroy();

    }


    if (
        !filteredAttempts.length
    ) {

        empty.style.display =
            "flex";

        return;

    }


    empty.style.display =
        "none";


    const data =
        [...filteredAttempts]
            .reverse();


    accuracyChart =
        new Chart(
            canvas,
            {

                type:
                    "line",

                data: {

                    labels:
                        data.map(
                            (
                                x,
                                i
                            ) =>
                                "#" +
                                (
                                    i + 1
                                )
                        ),

                    datasets: [

    {

        label:
            "Accuracy",

        data:
            data.map(
                x => {

                    const attempted =
                        num(
                            x.attempted
                        );

                    const correct =
                        num(
                            x.correct
                        );

                    return attempted
                        ? correct /
                          attempted *
                          100
                        : 0;

                }
            ),

        borderColor:
            "#f59e0b",

        backgroundColor:
            "rgba(245, 158, 11, 0.12)",

        borderWidth:
            3,

        tension:
            .35,

        pointRadius:
            4,

        pointBackgroundColor:
            "#f59e0b",

        pointBorderColor:
            "#f59e0b"

    }

]

                },

                options: {

    responsive:
        true,

    maintainAspectRatio:
        false,

    plugins: {

        legend: {

            onClick: () => {
                // Dataset visibility locked
            }

        }

    },

                    scales: {

                        y: {

                            min:
                                0,

                            max:
                                100,

                            ticks: {

                                callback:
                                    value =>
                                        value +
                                        "%"

                            }

                        }

                    }

                }

            }
        );

}


/* =====================================================
   DISTRIBUTION
===================================================== */

function renderDistribution() {

    let passed = 0;

    let failed = 0;

    let other = 0;


    filteredAttempts.forEach(
        attempt => {

            const result =
                String(
                    attempt.result ||
                    ""
                ).toLowerCase();


            if (
                result.includes(
                    "pass"
                )
            ) {

                passed++;

            }

            else if (
                result.includes(
                    "fail"
                )
            ) {

                failed++;

            }

            else {

                other++;

            }

        }
    );


    const total =
    filteredAttempts.length;


/* ==========================================
   DISPLAY COUNTS
========================================== */

setText(
    "passedTests",
    passed
);

setText(
    "failedTests",
    failed
);


/*
   Every attempt loaded on this page already
   has status = "Completed".

   Therefore this is the total number
   of completed tests.
*/

setText(
    "otherTests",
    total
);

setText(
    "resultTotal",
    total
);


    const donut =
        document.getElementById(
            "resultDonut"
        );


    if (
        total
    ) {

        const p =
            passed /
            total *
            360;


        const f =
            failed /
            total *
            360;


        donut.style.background =
            `conic-gradient(
                #16a34a 0deg ${p}deg,
                #ef4444 ${p}deg ${p + f}deg,
                #cbd5e1 ${p + f}deg 360deg
            )`;

    }

}


/* =====================================================
   INSIGHTS
===================================================== */

function renderInsights() {

    const box =
        document.getElementById(
            "insights"
        );


    if (
        !filteredAttempts.length
    ) {

        box.innerHTML =
            `<div class="insight-loading">
                Complete tests to generate insights.
             </div>`;

        return;

    }


    const a =
        filteredAttempts;


    const accuracy =
        sum(
            a,
            "attempted"
        )
            ? sum(
                a,
                "correct"
            ) /
            sum(
                a,
                "attempted"
            ) *
            100
            : 0;


    const skip =
        sum(
            a,
            "total_questions"
        )
            ? sum(
                a,
                "skipped"
            ) /
            sum(
                a,
                "total_questions"
            ) *
            100
            : 0;


    const percentages =
        a.map(
            x =>
                num(
                    x.percentage
                )
        );


    const best =
        Math.max(
            ...percentages
        );


    const recent =
        num(
            a[0].percentage
        );


    const previous =
        a.length > 1
            ? num(
                a[1].percentage
            )
            : null;


    const items = [];


    if (
        accuracy >= 80
    ) {

        items.push(
            insight(
                "good",
                "fa-circle-check",
                "Excellent accuracy",
                `Your overall accuracy is ${percent(accuracy)}.`
            )
        );

    }

    else if (
        accuracy < 60
    ) {

        items.push(
            insight(
                "warning",
                "fa-triangle-exclamation",
                "Accuracy needs attention",
                `Your current accuracy is ${percent(accuracy)}. Focus on reducing wrong answers.`
            )
        );

    }


    if (
        skip >= 20
    ) {

        items.push(
            insight(
                "warning",
                "fa-forward",
                "High skip rate",
                `${percent(skip)} of available questions are being skipped.`
            )
        );

    }


    if (
        previous !== null
    ) {

        const change =
            recent -
            previous;


        if (
            change > 0
        ) {

            items.push(
                insight(
                    "good",
                    "fa-arrow-trend-up",
                    "Recent improvement",
                    `Your latest test improved by ${change.toFixed(1)} percentage points.`
                )
            );

        }

        else if (
            change < -5
        ) {

            items.push(
                insight(
                    "danger",
                    "fa-arrow-trend-down",
                    "Recent decline",
                    `Your latest test dropped by ${Math.abs(change).toFixed(1)} percentage points.`
                )
            );

        }

    }


    if (
        best >= 80
    ) {

        items.push(
            insight(
                "info",
                "fa-trophy",
                "Strong potential",
                `You have already reached ${percent(best)} in at least one test.`
            )
        );

    }


    if (
        !items.length
    ) {

        items.push(
            insight(
                "info",
                "fa-chart-line",
                "Keep building consistency",
                "Continue taking tests so ExamVerse can identify stronger patterns."
            )
        );

    }


    box.innerHTML =
        items.join("");

}


/* =====================================================
   STRENGTH / WEAKNESS
===================================================== */

function renderStrengthsWeaknesses() {

    const groups =
        calculateSectionStats();


    const sorted =
        groups
            .filter(
                x =>
                    x.attempted >= 2
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.accuracy -
                    a.accuracy
            );


    const strengths =
        sorted.slice(
            0,
            4
        );


    const weaknesses =
        [...sorted]
            .reverse()
            .slice(
                0,
                4
            );


    renderAreaList(
        "strengths",
        strengths,
        true
    );


    renderAreaList(
        "weaknesses",
        weaknesses,
        false
    );

}


/* =====================================================
   SECTION CALCULATION
===================================================== */

function calculateSectionStats() {

    const stats =
        new Map();


    filteredAttempts.forEach(
        attempt => {

            const answers =
                allAnswers.filter(
                    x =>
                        String(
                            x.attempt_id
                        ) ===
                        String(
                            attempt.id
                        )
                );


            answers.forEach(
                answer => {

                    const question =
                        allQuestions.find(
                            q =>
                                String(
                                    q.id
                                ) ===
                                String(
                                    answer.question_id
                                )
                        );


                    if (!question) {

                        return;

                    }


                    const section =
                        question.section_name ||
                        question.section ||
                        question.subject ||
                        "General";


                    if (
                        !stats.has(
                            section
                        )
                    ) {

                        stats.set(
                            section,
                            {
                                name:
                                    section,

                                attempted:
                                    0,

                                correct:
                                    0,

                                wrong:
                                    0,

                                skipped:
                                    0
                            }
                        );

                    }


                    const s =
                        stats.get(
                            section
                        );


                    if (
                        !answer.selected_option
                    ) {

                        s.skipped++;

                        return;

                    }


                    s.attempted++;


                    if (
                        String(
                            answer.selected_option
                        )
                            .trim()
                            .toUpperCase() ===
                        String(
                            question.correct_answer
                        )
                            .trim()
                            .toUpperCase()
                    ) {

                        s.correct++;

                    }

                    else {

                        s.wrong++;

                    }

                }
            );

        }
    );


    return [
        ...stats.values()
    ].map(
        x => ({

            ...x,

            accuracy:
                x.attempted
                    ? x.correct /
                      x.attempted *
                      100
                    : 0

        })
    );

}


/* =====================================================
   AREA LIST
===================================================== */

function renderAreaList(
    id,
    data,
    good
) {

    const container =
        document.getElementById(
            id
        );


    if (
        !data.length
    ) {

        container.innerHTML =
            `<div class="empty-message">
                Not enough question-level data yet.
             </div>`;

        return;

    }


    container.innerHTML =
        data.map(
            x => `

                <div class="area-row">

                    <div class="area-top">

                        <span class="area-name">
                            ${escapeHTML(x.name)}
                        </span>

                        <span class="area-percent">
                            ${percent(x.accuracy)}
                        </span>

                    </div>

                    <div class="area-meta">

                        ${x.correct}
                        correct ·
                        ${x.wrong}
                        wrong ·
                        ${x.attempted}
                        attempted

                    </div>

                    <div class="area-progress">

                        <div
                            class="area-progress-fill ${good ? "good" : "bad"}"
                            style="width:${Math.min(100,x.accuracy)}%"
                        ></div>

                    </div>

                </div>

            `
        )
        .join("");

}


/* =====================================================
   EXAM WISE
===================================================== */

function renderExamWise() {

    const body =
        document.getElementById(
            "examWiseBody"
        );


    const map =
        new Map();


    filteredAttempts.forEach(
        attempt => {

            const id =
                String(
                    attempt.exam_id
                );


            if (
                !map.has(
                    id
                )
            ) {

                map.set(
                    id,
                    []
                );

            }


            map.get(
                id
            ).push(
                attempt
            );

        }
    );


    if (
        !map.size
    ) {

        body.innerHTML =
            `<tr>
                <td colspan="7" class="table-empty">
                    No completed tests found.
                </td>
             </tr>`;

        return;

    }


    body.innerHTML =
        [...map.values()]
            .sort(
                (
                    a,
                    b
                ) =>
                    avg(
                        b.map(
                            x =>
                                num(
                                    x.percentage
                                )
                        )
                    ) -
                    avg(
                        a.map(
                            x =>
                                num(
                                    x.percentage
                                )
                        )
                    )
            )
            .map(
                tests => {

                    const avgPercent =
                        avg(
                            tests.map(
                                x =>
                                    num(
                                        x.percentage
                                    )
                            )
                        );


                    const best =
                        Math.max(
                            ...tests.map(
                                x =>
                                    num(
                                        x.percentage
                                    )
                            )
                        );


                    const attempted =
                        sum(
                            tests,
                            "attempted"
                        );


                    const correct =
                        sum(
                            tests,
                            "correct"
                        );


                    const totalQuestions =
                        sum(
                            tests,
                            "total_questions"
                        );


                    const accuracy =
                        attempted
                            ? correct /
                              attempted *
                              100
                            : 0;


                    const attemptRate =
                        totalQuestions
                            ? attempted /
                              totalQuestions *
                              100
                            : 0;


                    const passed =
                        tests.filter(
                            x =>
                                String(
                                    x.result ||
                                    ""
                                )
                                    .toLowerCase()
                                    .includes(
                                        "pass"
                                    )
                        ).length;


                    return `

                        <tr>

                            <td>
                                <strong>
                                    ${escapeHTML(
                                        tests[0].examName
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${tests.length}
                            </td>

                            <td>
                                ${percent(
                                    avgPercent
                                )}
                            </td>

                            <td>
                                ${percent(
                                    best
                                )}
                            </td>

                            <td>
                                ${percent(
                                    accuracy
                                )}
                            </td>

                            <td>
                                ${percent(
                                    attemptRate
                                )}
                            </td>

                            <td>

                                <span class="result-badge result-completed">

                                    ${passed}
                                    /
                                    ${tests.length}
                                    passed

                                </span>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =====================================================
   SECTION WISE
===================================================== */

function renderSectionWise() {

    const container =
        document.getElementById(
            "sectionList"
        );


    const sections =
        calculateSectionStats()
            .sort(
                (
                    a,
                    b
                ) =>
                    b.accuracy -
                    a.accuracy
            );


    if (
        !sections.length
    ) {

        container.innerHTML =
            `<div class="empty-message">
                No section-level question data available.
             </div>`;

        return;

    }


    container.innerHTML =
        sections.map(
            section => `

                <div class="section-row">

                    <div class="section-top">

                        <span class="section-name">
                            ${escapeHTML(
                                section.name
                            )}
                        </span>

                        <span class="section-percent">
                            ${percent(
                                section.accuracy
                            )}
                        </span>

                    </div>

                    <div class="section-meta">

                        ${section.correct}
                        correct ·
                        ${section.wrong}
                        wrong ·
                        ${section.attempted}
                        attempted

                    </div>

                    <div class="section-track">

                        <div
                            class="section-fill"
                            style="
                                width:${Math.min(
                                    100,
                                    section.accuracy
                                )}%
                            "
                        ></div>

                    </div>

                </div>

            `
        )
        .join("");

}


/* =====================================================
   RECENT
===================================================== */

function renderRecent() {

    const body =
        document.getElementById(
            "recentTests"
        );


    const attempts =
        filteredAttempts.slice(
            0,
            15
        );


    if (
        !attempts.length
    ) {

        body.innerHTML =
            `<tr>
                <td colspan="10" class="table-empty">
                    No completed tests found.
                </td>
             </tr>`;

        return;

    }


    body.innerHTML =
        attempts.map(
            attempt => {

                const attempted =
                    num(
                        attempt.attempted
                    );


                const correct =
                    num(
                        attempt.correct
                    );


                const accuracy =
                    attempted
                        ? correct /
                          attempted *
                          100
                        : 0;


                const result =
                    String(
                        attempt.result ||
                        "Completed"
                    );


                let resultClass =
                    "result-completed";


                if (
                    result
                        .toLowerCase()
                        .includes(
                            "pass"
                        )
                ) {

                    resultClass =
                        "result-pass";

                }

                else if (
                    result
                        .toLowerCase()
                        .includes(
                            "fail"
                        )
                ) {

                    resultClass =
                        "result-fail";

                }


                return `

                    <tr>

                        <td>
                            ${formatDate(
                                attempt.submitted_at
                            )}
                        </td>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    attempt.examName
                                )}
                            </strong>
                        </td>

                        <td>
                            ${number(
                                attempt.score
                            )}
                            /
                            ${number(
                                attempt.totalMarks
                            )}
                        </td>

                        <td>
                            ${percent(
                                attempt.percentage
                            )}
                        </td>

                        <td>
                            ${attempt.correct}
                        </td>

                        <td>
                            ${attempt.wrong}
                        </td>

                        <td>
                            ${attempt.skipped}
                        </td>

                        <td>
                            ${percent(
                                accuracy
                            )}
                        </td>

                        <td>
                            ${duration(
                                attempt.time_taken
                            )}
                        </td>

                        <td>

                            <span
                                class="result-badge ${resultClass}"
                            >

                                ${escapeHTML(
                                    result
                                )}

                            </span>

                        </td>

                    </tr>

                `;

            }
        )
        .join("");

}


/* =====================================================
   HELPERS
===================================================== */

function unique(
    arr
) {

    return [
        ...new Set(
            arr.map(
                x =>
                    String(
                        x
                    )
            )
        )
    ];

}


function num(
    value
) {

    return Number(
        value
    ) || 0;

}


function sum(
    array,
    property
) {

    return array.reduce(
        (
            total,
            item
        ) =>
            total +
            num(
                item[property]
            ),
        0
    );

}


function avg(
    array
) {

    if (
        !array.length
    ) {

        return 0;

    }


    return array.reduce(
        (
            total,
            value
        ) =>
            total +
            num(
                value
            ),
        0
    ) /
    array.length;

}


function percent(
    value
) {

    return (
        num(
            value
        )
            .toFixed(2)
            .replace(
                /\.00$/,
                ""
            )
    ) + "%";

}


function number(
    value
) {

    return num(
        value
    )
        .toFixed(2)
        .replace(
            /\.00$/,
            ""
        );

}


function duration(
    seconds
) {

    seconds =
        Math.max(
            0,
            Math.floor(
                num(
                    seconds
                )
            )
        );


    const h =
        Math.floor(
            seconds /
            3600
        );


    const m =
        Math.floor(
            (
                seconds %
                3600
            ) /
            60
        );


    const s =
        seconds %
        60;


    if (
        h > 0
    ) {

        return (
            String(
                h
            ).padStart(
                2,
                "0"
            ) +
            ":" +
            String(
                m
            ).padStart(
                2,
                "0"
            ) +
            ":" +
            String(
                s
            ).padStart(
                2,
                "0"
            )
        );

    }


    return (
        String(
            m
        ).padStart(
            2,
            "0"
        ) +
        ":" +
        String(
            s
        ).padStart(
            2,
            "0"
        )
    );

}


function formatDate(
    value
) {

    if (
        !value
    ) {

        return "—";

    }


    return new Date(
        value
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
    );

}


function calculateConsistency(
    values
) {

    if (
        values.length <
        2
    ) {

        return "—";

    }


    const mean =
        avg(
            values
        );


    const variance =
        avg(
            values.map(
                x =>
                    Math.pow(
                        x -
                        mean,
                        2
                    )
            )
        );


    const sd =
        Math.sqrt(
            variance
        );


    if (
        sd <= 5
    ) {

        return "Excellent";

    }


    if (
        sd <= 10
    ) {

        return "Good";

    }


    if (
        sd <= 15
    ) {

        return "Moderate";

    }


    return "Low";

}


function insight(
    type,
    icon,
    title,
    text
) {

    return `

        <div class="insight ${type}">

            <i class="fa-solid ${icon}"></i>

            <div>

                <strong>
                    ${escapeHTML(title)}
                </strong>

                <p>
                    ${escapeHTML(text)}
                </p>

            </div>

        </div>

    `;

}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (
        element
    ) {

        element.textContent =
            value;

    }

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