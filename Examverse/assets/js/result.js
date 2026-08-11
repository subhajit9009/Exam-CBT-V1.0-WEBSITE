/* ==========================================
   ExamVerse Result Engine
   Created by Subhajit Paul
========================================== */

let attemptedUserName = "Student";

window.addEventListener(
    "DOMContentLoaded",
    loadResult
);


// ==========================================
// Load Result
// ==========================================

async function loadResult() {

    try {


        // ==========================================
        // Get Attempt ID
        // ==========================================

        const attemptId =
            sessionStorage.getItem(
                "attemptId"
            );


        if (!attemptId) {

            alert(
                "Result attempt not found."
            );


            window.location.replace(
                "exam-list.html"
            );


            return;

        }


        // ==========================================
        // Get Attempt
        // ==========================================

        const {
            data: attempt,
            error
        } =
            await supabaseClient

                .from("exam_attempts")

                .select("*")

                .eq(
                    "id",
                    attemptId
                )

                .single();

                // ==========================================
// Get Candidate Name
// ==========================================

attemptedUserName = "Student";

if (attempt?.user_id) {

    const {
        data: profile,
        error: profileError
    } = await supabaseClient

        .from("profiles")

        .select(
            "first_name, middle_name, last_name"
        )

        .eq(
            "id",
            attempt.user_id
        )

        .single();


    if (profileError) {

        console.error(
            "Profile Load Error:",
            profileError
        );

    }


    if (profile) {

        attemptedUserName = [

            profile.first_name,

            profile.middle_name,

            profile.last_name

        ]

            .filter(Boolean)

            .join(" ");


        if (!attemptedUserName) {

            attemptedUserName = "Student";

        }

    }

}


        if (error) {

            console.error(
                "Result Load Error:",
                error
            );


            alert(
                "Unable to load examination result."
            );


            return;

        }


        if (!attempt) {

            alert(
                "Examination result not found."
            );


            return;

        }


        // ==========================================
        // Get Exam Information
        // ==========================================

        const {
            data: exam,
            error: examError
        } =
            await supabaseClient

                .from("exams")

                .select("*")

                .eq(
                    "id",
                    attempt.exam_id
                )

                .single();


        if (examError) {

            console.error(
                "Exam Load Error:",
                examError
            );

        }


        // ==========================================
        // Get User Answers
        // ==========================================

        const {
            data: userAnswers,
            error: userAnswersError
        } =
            await supabaseClient

                .from("user_answers")

                .select(
                    "question_id, selected_option, is_review"
                )

                .eq(
                    "attempt_id",
                    attemptId
                );


        if (userAnswersError) {

            console.error(
                "User Answers Error:",
                userAnswersError
            );

        }


        // ==========================================
        // Get Questions
        // ==========================================

        /*
           We use * here because the question-wise
           result needs the actual question text and
           answer options as well as the scoring data.
        */

        const {
            data: resultQuestions,
            error: resultQuestionsError
        } =
            await supabaseClient

                .from("questions")

                .select("*")

                .eq(
                    "exam_id",
                    attempt.exam_id
                );


        if (resultQuestionsError) {

            console.error(
                "Question Result Error:",
                resultQuestionsError
            );


            showAnalysisError(
                "Unable to load question analysis."
            );

        }


        // ==========================================
        // Calculate Review / Marks
        // ==========================================

        let markedReviewCount =
            0;


        let positiveMarks =
            0;


        let negativeMarks =
            0;


        if (
            userAnswers &&
            resultQuestions
        ) {


            // ======================================
            // Marked for Review
            // ======================================

            markedReviewCount =
                userAnswers.filter(
                    answer =>
                        answer.is_review === true
                ).length;


            // ======================================
            // Positive / Negative Marks
            // ======================================

            userAnswers.forEach(
                answer => {


                    // No selected answer

                    if (
                        !answer.selected_option
                    ) {

                        return;

                    }


                    const question =
                        resultQuestions.find(
                            q =>
                                String(q.id) ===
                                String(
                                    answer.question_id
                                )
                        );


                    if (!question) {

                        return;

                    }


                    // ==================================
                    // Correct
                    // ==================================

                    if (
                        String(
                            answer.selected_option
                        ).trim().toUpperCase() ===

                        String(
                            question.correct_answer
                        ).trim().toUpperCase()
                    ) {

                        positiveMarks +=
                            Number(
                                question.marks || 0
                            );

                    }


                    // ==================================
                    // Wrong
                    // ==================================

                    else {

                        negativeMarks +=
                            Number(
                                question.negative_marks || 0
                            );

                    }

                }
            );

        }


        // ==========================================
        // Display Basic Result
        // ==========================================

        setText(
            "examName",
            exam?.exam_name ||
            "Examination"
        );


        setText(
            "attempted",
            attempt.attempted ?? 0
        );


        setText(
            "correct",
            attempt.correct ?? 0
        );


        setText(
            "wrong",
            attempt.wrong ?? 0
        );


        setText(
            "skipped",
            attempt.skipped ?? 0
        );


        setText(
            "markedReview",
            markedReviewCount
        );


        // ==========================================
        // Detailed Result
        // ==========================================

        setText(
            "totalQuestions",
            attempt.total_questions ?? 0
        );


        setText(
            "detailAttempted",
            attempt.attempted ?? 0
        );


        setText(
            "positiveMarks",
            "+" +
            Number(
                positiveMarks
            ).toFixed(2)
        );


        setText(
            "negativeMarks",

            negativeMarks > 0

                ? "-" +
                  Number(
                      negativeMarks
                  ).toFixed(2)

                : "0.00"
        );


        setText(
            "percentage",
            (
                attempt.percentage ?? 0
            ) + "%"
        );


        setText(
            "passingMarks",
            exam?.passing_marks ?? 0
        );


        setText(
            "status",
            attempt.status ||
            "Completed"
        );


        // ==========================================
        // Score
        // ==========================================

        setText(
            "score",

            Number(
                attempt.score ?? 0
            ).toFixed(2)
        );


        // ==========================================
        // Total Marks
        // ==========================================

        setText(
            "totalMarks",
            exam?.total_marks ?? 0
        );


        // ==========================================
        // Result Badge
        // ==========================================

        const badge =
            document.getElementById(
                "resultBadge"
            );


        if (badge) {

            const resultText =
                attempt.result ||
                "Completed";


            badge.textContent =
                resultText;


            if (
                String(
                    resultText
                ).toLowerCase()
                .includes("fail")
            ) {

                badge.classList.add(
                    "fail"
                );

            }

        }


        // ==========================================
        // Time Taken
        // ==========================================

        const timeTaken =
            Number(
                attempt.time_taken ?? 0
            );


        const hours =
            Math.floor(
                timeTaken / 3600
            );


        const minutes =
            Math.floor(
                (timeTaken % 3600) / 60
            );


        const seconds =
            timeTaken % 60;


        setText(
            "timeTaken",

            String(hours)
                .padStart(2, "0")

            + ":" +

            String(minutes)
                .padStart(2, "0")

            + ":" +

            String(seconds)
                .padStart(2, "0")
        );


        // ==========================================
        // Question-wise Analysis
        // ==========================================

        renderQuestionAnalysis(
            resultQuestions || [],
            userAnswers || []
        );


        // ==========================================
        // Dashboard Button
        // ==========================================

        const dashboardBtn =
            document.getElementById(
                "dashboardBtn"
            );


        if (dashboardBtn) {

            dashboardBtn.addEventListener(
                "click",
                () => {


                    sessionStorage.removeItem(
                        "attemptId"
                    );


                    sessionStorage.removeItem(
                        "examStartTime"
                    );


                    sessionStorage.removeItem(
                        "examSubmitted"
                    );


                    sessionStorage.removeItem(
                        "examResult"
                    );


                    window.location.replace(
                        "dashboard.html"
                    );

                }
            );

        }

// ==========================================
// Setup Result Page Controls
// ==========================================

setupAnalysisButton();

setupPdfButton();


        // ==========================================
        // Console
        // ==========================================

        console.log(
            "Result loaded:",
            attempt
        );


        console.log(
            "Review count:",
            markedReviewCount
        );


        console.log(
            "Positive marks:",
            positiveMarks
        );


        console.log(
            "Negative marks:",
            negativeMarks
        );


    }


    catch (error) {

        console.error(
            "Result Error:",
            error
        );


        alert(
            "Something went wrong while loading the result."
        );

    }

}


// ==========================================
// Set Text Safely
// ==========================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


// ==========================================
// Question-wise Analysis
// ==========================================

function renderQuestionAnalysis(
    questions,
    userAnswers
) {

    const container =
        document.getElementById(
            "questionAnalysis"
        );


    const countElement =
        document.getElementById(
            "analysisCount"
        );


    if (!container) {

        return;

    }


    // ==========================================
    // No Questions
    // ==========================================

    if (
        !questions ||
        questions.length === 0
    ) {

        container.innerHTML = `

            <div class="no-analysis">

                <i class="fa-solid fa-circle-info"></i>

                <div>
                    No question analysis is available.
                </div>

            </div>

        `;


        setText(
            "analysisCount",
            0
        );


        return;

    }


    // ==========================================
    // Count
    // ==========================================

    if (countElement) {

        countElement.textContent =
            questions.length;

    }


    // ==========================================
    // Create Answer Map
    // ==========================================

    const answerMap =
        new Map();


    userAnswers.forEach(
        answer => {

            answerMap.set(
                String(
                    answer.question_id
                ),
                answer
            );

        }
    );


    // ==========================================
    // Render Questions
    // ==========================================

    container.innerHTML =
        questions
            .map(
                (
                    question,
                    index
                ) => {

                    const answer =
                        answerMap.get(
                            String(
                                question.id
                            )
                        );


                    return createQuestionCard(
                        question,
                        answer,
                        index
                    );

                }
            )
            .join("");


}


// ==========================================
// Create Question Card
// ==========================================

function createQuestionCard(
    question,
    answer,
    index
) {


    // ==========================================
    // Answer Information
    // ==========================================

    const selectedAnswer =
        answer?.selected_option ||
        "";


    const correctAnswer =
        question.correct_answer ||
        "";


    const isReview =
        answer?.is_review === true;


    const hasAnswer =
        selectedAnswer !== null &&
        selectedAnswer !== undefined &&
        String(
            selectedAnswer
        ).trim() !== "";


    // ==========================================
    // Determine Status
    // ==========================================

    let status =
        "skipped";


    let statusText =
        "Skipped";


    let statusIcon =
        "fa-forward";


    let marks =
        0;


    if (hasAnswer) {

        if (
            String(
                selectedAnswer
            ).trim().toUpperCase() ===

            String(
                correctAnswer
            ).trim().toUpperCase()
        ) {

            status =
                "correct";

            statusText =
                "Correct";

            statusIcon =
                "fa-circle-check";


            marks =
                Number(
                    question.marks || 0
                );

        }

        else {

            status =
                "wrong";

            statusText =
                "Wrong";

            statusIcon =
                "fa-circle-xmark";


            marks =
                -Number(
                    question.negative_marks || 0
                );

        }

    }


    // ==========================================
    // Question Text
    // ==========================================

    const questionText =
        getQuestionText(
            question,
            index
        );


    // ==========================================
    // Answer Display
    // ==========================================

    const yourAnswerText =
        hasAnswer

            ? getOptionDisplay(
                question,
                selectedAnswer
            )

            : "Not Answered";


    const correctAnswerText =
        getOptionDisplay(
            question,
            correctAnswer
        );


    // ==========================================
    // Review Badge
    // ==========================================

    const reviewBadge =
        isReview

            ? `

                <span class="status-pill review-pill">

                    <i class="fa-solid fa-flag"></i>

                    ${
                        hasAnswer
                            ? "Answered + Review"
                            : "Marked for Review"
                    }

                </span>

              `

            : "";


    // ==========================================
    // Marks Badge
    // ==========================================

    let marksClass =
        "marks-zero";


    let marksText =
        "0.00";


    if (marks > 0) {

        marksClass =
            "marks-positive";


        marksText =
            "+" +
            marks.toFixed(2);

    }

    else if (marks < 0) {

        marksClass =
            "marks-negative";


        marksText =
            marks.toFixed(2);

    }


    // ==========================================
    // Answer Classes
    // ==========================================

    let yourAnswerClass =
        "answer-box";


    if (
        status === "correct"
    ) {

        yourAnswerClass +=
            " your-answer correct-answer";

    }

    else if (
        status === "wrong"
    ) {

        yourAnswerClass +=
            " your-answer wrong-answer";

    }

    else {

        yourAnswerClass +=
            " skipped-answer";

    }


    // ==========================================
    // Return Card
    // ==========================================

    return `

        <div class="question-result-card ${status}">


            <!-- Question Header -->

            <div class="question-result-header">


                <div class="question-number">

                    Question ${index + 1}

                </div>


                <div class="question-status-area">


                    <span
                        class="status-pill ${status}">

                        <i
                            class="fa-solid ${statusIcon}">
                        </i>

                        ${statusText}

                    </span>


                    ${reviewBadge}


                </div>


            </div>



            <!-- Question Body -->

            <div class="question-result-body">


                <div class="question-text">

                    ${escapeHTML(
                        questionText
                    )}

                </div>



                <!-- Answers -->

                <div class="answer-result-grid">


                    <!-- Your Answer -->

                    <div
                        class="${yourAnswerClass}">

                        <span class="answer-box-label">

                            Your Answer

                        </span>


                        <span class="answer-box-value">

                            ${escapeHTML(
                                yourAnswerText
                            )}

                        </span>

                    </div>



                    <!-- Correct Answer -->

                    <div
                        class="answer-box correct-answer-box">

                        <span class="answer-box-label">

                            Correct Answer

                        </span>


                        <span class="answer-box-value">

                            ${escapeHTML(
                                correctAnswerText
                            )}

                        </span>

                    </div>


                </div>



                <!-- Marks -->

                <div class="question-marks">


                    <span
                        class="marks-badge ${marksClass}">

                        Marks:
                        ${marksText}

                    </span>


                </div>


            </div>


        </div>

    `;

}


// ==========================================
// Get Question Text
// ==========================================

function getQuestionText(
    question,
    index
) {

    /*
       Supports common question column names.

       If your Supabase table uses one of these,
       the question text will be displayed.
    */

    const possibleFields = [

        "question",

        "question_text",

        "questionText",

        "text",

        "question_statement",

        "question_content",

        "title"

    ];


    for (
        const field of possibleFields
    ) {

        if (
            question[field] !== undefined &&
            question[field] !== null &&
            String(
                question[field]
            ).trim() !== ""
        ) {

            return String(
                question[field]
            );

        }

    }


    return "Question " +
        (index + 1);

}


// ==========================================
// Get Option Display
// ==========================================

function getOptionDisplay(
    question,
    option
) {

    if (
        !option
    ) {

        return "Not Answered";

    }


    const value =
        String(
            option
        ).trim();


    /*
       If the selected value is something
       like A, B, C or D, try to display
       the corresponding option text.
    */

    const optionMap = {

        A: [
            "option_a",
            "optionA",
            "a"
        ],

        B: [
            "option_b",
            "optionB",
            "b"
        ],

        C: [
            "option_c",
            "optionC",
            "c"
        ],

        D: [
            "option_d",
            "optionD",
            "d"
        ],

        E: [
            "option_e",
            "optionE",
            "e"
        ]

    };


    const upper =
        value.toUpperCase();


    const fields =
        optionMap[
            upper
        ];


    if (fields) {

        for (
            const field
            of fields
        ) {

            if (
                question[field] !== undefined &&
                question[field] !== null &&
                String(
                    question[field]
                ).trim() !== ""
            ) {

                return (
                    upper +
                    ". " +
                    String(
                        question[field]
                    )
                );

            }

        }

    }


    /*
       If the database stores the complete
       answer text instead of A/B/C/D,
       display it directly.
    */

    return value;

}


// ==========================================
// Escape HTML
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
// Analysis Error
// ==========================================

function showAnalysisError(
    message
) {

    const container =
        document.getElementById(
            "questionAnalysis"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="no-analysis">

            <i class="fa-solid fa-triangle-exclamation"></i>

            <div>
                ${escapeHTML(message)}
            </div>

        </div>

    `;

}

// ==========================================
// Detailed Analysis Toggle
// ==========================================

function setupAnalysisButton() {

    const analysisBtn =
        document.getElementById(
            "analysisBtn"
        );


    const analysisSection =
        document.getElementById(
            "analysisSection"
        );


    const analysisArrow =
        document.getElementById(
            "analysisArrow"
        );


    if (
        !analysisBtn ||
        !analysisSection
    ) {

        return;

    }


    analysisBtn.addEventListener(
        "click",
        () => {


            const isHidden =
                analysisSection.classList.contains(
                    "hidden"
                );


            if (isHidden) {

                analysisSection.classList.remove(
                    "hidden"
                );


                analysisBtn.classList.add(
                    "active"
                );


                analysisBtn.innerHTML = `

                    <i class="fa-solid fa-chart-column"></i>

                    Hide Detailed Analysis

                    <i
                        id="analysisArrow"
                        class="fa-solid fa-chevron-up">
                    </i>

                `;

            }

            else {

                analysisSection.classList.add(
                    "hidden"
                );


                analysisBtn.classList.remove(
                    "active"
                );


                analysisBtn.innerHTML = `

                    <i class="fa-solid fa-chart-column"></i>

                    Detailed Analysis

                    <i
                        id="analysisArrow"
                        class="fa-solid fa-chevron-down">
                    </i>

                `;

            }

        }
    );

}


// ==========================================
// PDF DOWNLOAD
// ==========================================

function setupPdfButton() {

    const pdfButton =
        document.getElementById(
            "downloadPdfBtn"
        );


    if (!pdfButton) {

        return;

    }


    pdfButton.addEventListener(
        "click",
        downloadResultPDF
    );

}


// ==========================================
// Generate Result PDF
// ==========================================

async function downloadResultPDF() {

    const pdfButton =
        document.getElementById("downloadPdfBtn");

    const resultWrapper =
        document.querySelector(".result-wrapper");

    const analysisSection =
        document.getElementById("analysisSection");

    if (!resultWrapper || !pdfButton) {
        return;
    }

    if (typeof html2pdf === "undefined") {

        alert(
            "PDF generator is not loaded. Please check your internet connection."
        );

        return;
    }


    const oldText =
        pdfButton.innerHTML;

    pdfButton.disabled = true;

    pdfButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Generating PDF...
    `;


    let wasHidden = false;

    let pdfHeader = null;
    let performanceChart = null;


    try {

        /* ==========================================
           SHOW ANALYSIS TEMPORARILY
        ========================================== */

        if (analysisSection) {

            wasHidden =
                analysisSection.classList.contains("hidden");

            analysisSection.classList.remove("hidden");

        }


        /* ==========================================
           GET CURRENT RESULT VALUES
        ========================================== */

        const examName =
            document.getElementById("examName")?.textContent?.trim()
            || "Examination";

        const score =
            document.getElementById("score")?.textContent?.trim()
            || "0.00";

        const totalMarks =
            document.getElementById("totalMarks")?.textContent?.trim()
            || "0";

        const resultText =
            document.getElementById("resultBadge")?.textContent?.trim()
            || "Completed";

        const attempted =
            document.getElementById("attempted")?.textContent?.trim()
            || "0";

        const correct =
            document.getElementById("correct")?.textContent?.trim()
            || "0";

        const wrong =
            document.getElementById("wrong")?.textContent?.trim()
            || "0";

        const skipped =
            document.getElementById("skipped")?.textContent?.trim()
            || "0";


        /* ==========================================
           CREATE PDF HEADER
        ========================================== */

        pdfHeader =
            document.createElement("div");

        pdfHeader.className =
            "pdf-report-header";

        pdfHeader.innerHTML = `

            <div class="pdf-brand">

                <div class="pdf-brand-name">
                    ExamVerse
                </div>

                <div class="pdf-brand-subtitle">
                    Examination Result Report CARD
                </div>

                <div class="attempted-by">
    Attempted By: ${attemptedUserName}
</div>

            </div>


            <div class="pdf-exam-name">

                ${escapeHTML(examName)}

            </div>

        `;


        resultWrapper.prepend(pdfHeader);


        /* ==========================================
           CREATE PERFORMANCE CHART
        ========================================== */

        performanceChart =
            document.createElement("div");

        performanceChart.className =
            "pdf-performance-card";


        const attemptedNumber =
            Number(attempted) || 0;

        const correctNumber =
            Number(correct) || 0;

        const wrongNumber =
            Number(wrong) || 0;

        const skippedNumber =
            Number(skipped) || 0;


        const chartMaximum =
            Math.max(
                attemptedNumber,
                correctNumber,
                wrongNumber,
                skippedNumber,
                1
            );


        const correctWidth =
            (correctNumber / chartMaximum) * 100;

        const wrongWidth =
            (wrongNumber / chartMaximum) * 100;

        const skippedWidth =
            (skippedNumber / chartMaximum) * 100;


        performanceChart.innerHTML = `

            <div class="pdf-performance-title">

                <i class="fa-solid fa-chart-column"></i>

                Performance Overview

            </div>


            <div class="pdf-chart-row">

                <div class="pdf-chart-label">
                    <span>Correct</span>
                    <strong>${correctNumber}</strong>
                </div>

                <div class="pdf-chart-track">

                    <div
                        class="pdf-chart-bar correct-bar"
                        style="width:${correctWidth}%">
                    </div>

                </div>

            </div>


            <div class="pdf-chart-row">

                <div class="pdf-chart-label">
                    <span>Wrong</span>
                    <strong>${wrongNumber}</strong>
                </div>

                <div class="pdf-chart-track">

                    <div
                        class="pdf-chart-bar wrong-bar"
                        style="width:${wrongWidth}%">
                    </div>

                </div>

            </div>


            <div class="pdf-chart-row">

                <div class="pdf-chart-label">
                    <span>Skipped</span>
                    <strong>${skippedNumber}</strong>
                </div>

                <div class="pdf-chart-track">

                    <div
                        class="pdf-chart-bar skipped-bar"
                        style="width:${skippedWidth}%">
                    </div>

                </div>

            </div>

        `;


        /*
           Put chart immediately after statistics.
        */

        const statsGrid =
            resultWrapper.querySelector(".stats-grid");

        if (statsGrid) {

            statsGrid.insertAdjacentElement(
                "afterend",
                performanceChart
            );

        }
        else {

            resultWrapper.appendChild(
                performanceChart
            );

        }


        /* ==========================================
           PDF MODE
        ========================================== */

        resultWrapper.classList.add("pdf-mode");


        /*
           Give browser time to render
           dynamically-created PDF elements.
        */

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    700
                )
        );


        /* ==========================================
           FILE NAME
        ========================================== */

        const attemptId =
            sessionStorage.getItem("attemptId");


        const fileName =
            "ExamVerse_Result_" +

            (
                attemptId
                    ? attemptId.substring(0, 8)
                    : "Report"
            ) +

            ".pdf";


        /* ==========================================
           PDF SETTINGS
        ========================================== */

        const options = {

            margin: [
                8,
                8,
                10,
                8
            ],

            filename:
                fileName,


            image: {

                type:
                    "jpeg",

                quality:
                    0.98

            },


            html2canvas: {

                scale:
                    1.5,

                useCORS:
                    true,

                allowTaint:
                    false,

                backgroundColor:
                    "#ffffff",

                logging:
                    false,

                scrollX:
                    0,

                scrollY:
                    0,

                windowWidth:
    resultWrapper.clientWidth

            },


            jsPDF: {

                unit:
                    "mm",

                format:
                    "a4",

                orientation:
                    "portrait",

                compress:
                    true

            },


            pagebreak: {

                mode: [
                    "css",
                    "legacy"
                ],

                before: [
                    ".pdf-page-break"
                ],

                after: [],

                avoid: [

                    ".question-result-card",

                    ".details-card",

                    ".score-card",

                    ".stat-card",

                    ".pdf-performance-card",

                    ".analysis-header",

                    ".analysis-legend"

                ]

            }

        };


        /* ==========================================
           GENERATE PDF
        ========================================== */

        await html2pdf()

            .set(options)

            .from(resultWrapper)

            .toPdf()

            .get("pdf")

            .then(
                pdf => {

                    pdf.setProperties({

                        title:
                            "ExamVerse Examination Result",

                        subject:
                            "Examination Result",

                        author:
                            "ExamVerse",

                        creator:
                            "ExamVerse"

                    });

                }
            )

            .save();


        /* ==========================================
           RESTORE PAGE
        ========================================== */

        resultWrapper.classList.remove(
            "pdf-mode"
        );


        if (
            analysisSection &&
            wasHidden
        ) {

            analysisSection.classList.add(
                "hidden"
            );

        }


        if (pdfHeader) {

            pdfHeader.remove();

        }


        if (performanceChart) {

            performanceChart.remove();

        }

    }


    catch (error) {

        console.error(
            "PDF Generation Error:",
            error
        );


        alert(
            "Unable to generate the result PDF."
        );


        resultWrapper.classList.remove(
            "pdf-mode"
        );


        if (
            analysisSection &&
            wasHidden
        ) {

            analysisSection.classList.add(
                "hidden"
            );

        }


        if (pdfHeader) {

            pdfHeader.remove();

        }


        if (performanceChart) {

            performanceChart.remove();

        }

    }


    finally {

        pdfButton.disabled =
            false;

        pdfButton.innerHTML =
            oldText;

    }

}