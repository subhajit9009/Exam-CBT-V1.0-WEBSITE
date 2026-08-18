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
// Section Detection + Question Analysis.
// ==========================================

const sections =
    await renderSectionPerformance(
        attempt.exam_id,
        resultQuestions || [],
        userAnswers || []
    );


// ==========================================
// Question-wise Analysis
// ==========================================

renderQuestionAnalysis(
    resultQuestions || [],
    userAnswers || [],
    sections || []
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

// ==========================================
// Question-wise Analysis
// ==========================================

function renderQuestionAnalysis(
    questions,
    userAnswers,
    sections = []
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


    (userAnswers || []).forEach(
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
    // NORMAL / NON-SECTIONAL EXAM
    // ==========================================

    if (
        !sections ||
        sections.length === 0
    ) {

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


        return;
    }


    // ==========================================
    // SECTIONAL EXAM
    // ==========================================

    const sortedQuestions =
        [...questions].sort(
            (a, b) =>
                Number(
                    a.question_no || 0
                ) -
                Number(
                    b.question_no || 0
                )
        );


    let questionPointer = 0;


    const sectionHTML =
        sections
            .map(
                section => {

                    const questionCount =
                        Number(
                            section.question_count || 0
                        );


                    const sectionQuestions =
                        sortedQuestions.slice(
                            questionPointer,
                            questionPointer +
                            questionCount
                        );


                    const startIndex =
                        questionPointer;


                    questionPointer +=
                        questionCount;


                    // ------------------------------------------
                    // Section Header
                    // ------------------------------------------

                    let html = `

                        <div class="analysis-section-block">

                            <div class="analysis-section-header">

                                <div class="analysis-section-title">

                                    <i class="fa-solid fa-layer-group"></i>

                                    <div>

                                        <h3>
                                            ${escapeHTML(
                                                section.section_name ||
                                                "Section"
                                            )}
                                        </h3>

                                        <span>
                                            ${sectionQuestions.length}
                                            Questions
                                        </span>

                                    </div>

                                </div>

                            </div>

                            <div class="analysis-section-questions">

                    `;


                    // ------------------------------------------
                    // Questions inside section
                    // ------------------------------------------

                    html +=
                        sectionQuestions
                            .map(
                                (
                                    question,
                                    localIndex
                                ) => {

                                    const answer =
                                        answerMap.get(
                                            String(
                                                question.id
                                            )
                                        );


                                    const globalIndex =
                                        startIndex +
                                        localIndex;


                                    return createQuestionCard(
                                        question,
                                        answer,
                                        globalIndex
                                    );

                                }
                            )
                            .join("");


                    html += `

                            </div>

                        </div>

                    `;


                    return html;

                }
            )
            .join("");


    container.innerHTML =
        sectionHTML;

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
// ISOLATED PDF RENDERER
// ==========================================

// ==========================================
// GENERATE RESULT PDF
// FINAL STABLE PDF RENDERER
// ==========================================

// ==========================================
// EXAMVERSE NATIVE PDF / PRINT
// ==========================================

// ==========================================
// EXAMVERSE PROFESSIONAL PDF REPORT
// Native Browser Print / Save as PDF
// ==========================================

// ==========================================
// EXAMVERSE PROFESSIONAL PDF REPORT
// Native Browser Print / Save as PDF
// ==========================================

function downloadResultPDF() {

    const pdfButton =
        document.getElementById(
            "downloadPdfBtn"
        );

    const resultWrapper =
        document.querySelector(
            ".result-wrapper"
        );


    if (
        !pdfButton ||
        !resultWrapper
    ) {

        console.error(
            "ExamVerse PDF: Result page not found."
        );

        return;
    }


    // ==========================================
    // READ LIVE RESULT DATA FIRST
    // IMPORTANT:
    // Do this BEFORE removing .result-header
    // ==========================================

    const getLiveText =
        function(id) {

            const element =
                document.getElementById(id);

            if (!element) {
                return "";
            }

            return element.textContent.trim();

        };


    const examName =
        getLiveText("examName") ||
        "Examination";


    const score =
        getLiveText("score");


    const totalMarks =
        getLiveText("totalMarks");


    const attempted =
        getLiveText("attempted");


    const correct =
        getLiveText("correct");


    const wrong =
        getLiveText("wrong");


    const skipped =
        getLiveText("skipped");


    const markedReview =
        getLiveText("markedReview");


    const totalQuestions =
        getLiveText("totalQuestions");


    const positiveMarks =
        getLiveText("positiveMarks");


    const negativeMarks =
        getLiveText("negativeMarks");


    const percentage =
        getLiveText("percentage");


    const passingMarks =
        getLiveText("passingMarks");


    const timeTaken =
        getLiveText("timeTaken");


    const status =
        getLiveText("status");


    const resultBadge =
        getLiveText("resultBadge");


    console.log(
        "ExamVerse PDF Exam Name:",
        examName
    );


    // ==========================================
    // PERCENTAGE
    // ==========================================

    let percentageNumber =
        parseFloat(
            percentage.replace(
                /[^0-9.-]/g,
                ""
            )
        );


    if (
        Number.isNaN(
            percentageNumber
        )
    ) {

        percentageNumber = 0;

    }


    percentageNumber =
        Math.max(
            0,
            Math.min(
                100,
                percentageNumber
            )
        );


    // ==========================================
    // NUMBERS
    // ==========================================

    const correctNumber =
        parseFloat(
            correct.replace(
                /[^0-9.-]/g,
                ""
            )
        ) || 0;


    const wrongNumber =
        parseFloat(
            wrong.replace(
                /[^0-9.-]/g,
                ""
            )
        ) || 0;


    const skippedNumber =
        parseFloat(
            skipped.replace(
                /[^0-9.-]/g,
                ""
            )
        ) || 0;


    const distributionTotal =
        correctNumber +
        wrongNumber +
        skippedNumber;


    let correctWidth = 0;
    let wrongWidth = 0;
    let skippedWidth = 0;


    if (
        distributionTotal > 0
    ) {

        correctWidth =
            (
                correctNumber /
                distributionTotal
            ) * 100;


        wrongWidth =
            (
                wrongNumber /
                distributionTotal
            ) * 100;


        skippedWidth =
            (
                skippedNumber /
                distributionTotal
            ) * 100;

    }


    // ==========================================
    // CLONE ONLY THE CONTENT WE NEED
    // ==========================================

    const scoreCard =
        document.querySelector(
            ".score-card"
        );


    const statsGrid =
        document.querySelector(
            ".stats-grid"
        );


    const detailsCard =
        document.querySelector(
            ".details-card"
        );


    const sectionResult =
        document.getElementById(
            "sectionResult"
        );


    const analysisSection =
        document.getElementById(
            "analysisSection"
        );


    // ==========================================
    // CLONE ANALYSIS
    // ==========================================

    let analysisHTML = "";


    if (analysisSection) {

        const analysisClone =
            analysisSection.cloneNode(
                true
            );


        // PDF must always show analysis

        analysisClone.classList.remove(
            "hidden"
        );


        analysisClone.style.display =
            "block";


        analysisClone.style.visibility =
            "visible";


        analysisClone.style.opacity =
            "1";


        analysisClone.style.height =
            "auto";


        analysisClone.style.maxHeight =
            "none";


        analysisClone.style.overflow =
            "visible";


        analysisHTML =
            analysisClone.outerHTML;

    }


    // ==========================================
    // SECTIONAL RESULT
    // ==========================================

    let sectionHTML = "";


    if (sectionResult) {

        const sectionClone =
            sectionResult.cloneNode(
                true
            );


        /*
           If the real result page has
           Section-wise Performance hidden,
           don't put it in the PDF.
        */

        const sectionIsHidden =
            sectionResult.classList.contains(
                "hidden"
            ) ||
            sectionResult.style.display ===
                "none";


        if (!sectionIsHidden) {

            sectionClone.classList.remove(
                "hidden"
            );


            sectionClone.style.display =
                "block";


            sectionClone.style.visibility =
                "visible";


            sectionHTML =
                sectionClone.outerHTML;

        }

    }


    // ==========================================
    // OPEN PRINT WINDOW
    // ==========================================

    const printWindow =
        window.open(
            "",
            "_blank"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups for ExamVerse."
        );

        return;

    }


    // ==========================================
    // RESULT CSS URL
    // ==========================================

    const resultCSS =
        new URL(
            "assets/css/result.css",
            window.location.href
        ).href;


    // ==========================================
    // BUILD PRINT PAGE
    // ==========================================

    const printHTML = `

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>


<title>
    ExamVerse - ${examName}
</title>


<!-- ORIGINAL RESULT CSS -->

<link
    rel="stylesheet"
    href="${resultCSS}"
>


<!-- GOOGLE FONT -->

<link
    href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
    rel="stylesheet"
>


<!-- FONT AWESOME -->

<link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
>


<style>

/* =================================================
   PDF PAGE
================================================= */

@page {

    size:
        A4 portrait;

    margin:
        10mm;

}


* {

    box-sizing:
        border-box;

    -webkit-print-color-adjust:
        exact !important;

    print-color-adjust:
        exact !important;

}


html,
body {

    margin:
        0 !important;

    padding:
        0 !important;

    background:
        #ffffff !important;

}


body {

    font-family:
        'Poppins',
        Arial,
        sans-serif;

}


/* =================================================
   PDF CONTAINER
================================================= */

.ev-pdf {

    width:
        100%;

    max-width:
        190mm;

    margin:
        0 auto;

    background:
        #ffffff;

}


/* =================================================
   PDF HEADER
================================================= */

.ev-pdf-header {

    display:
        flex;

    align-items:
        center;

    justify-content:
        space-between;

    padding:
        5mm 0;

    margin-bottom:
        5mm;

    border-bottom:
        2px solid #2563eb;

}


.ev-pdf-brand {

    font-size:
        21px;

    font-weight:
        800;

    letter-spacing:
        1px;

    color:
        #2563eb;

}


.ev-pdf-subtitle {

    margin-top:
        1mm;

    font-size:
        8px;

    color:
        #64748b;

}


.ev-pdf-status {

    padding:
        5px 12px;

    border-radius:
        20px;

    background:
        #eff6ff;

    color:
        #2563eb;

    font-size:
        8px;

    font-weight:
        700;

}


/* =================================================
   EXAM NAME
================================================= */

.ev-pdf-exam-name {

    margin-bottom:
        5mm;

    padding:
        4mm 5mm;

    border-left:
        4px solid #2563eb;

    border-radius:
        6px;

    background:
        #f8fafc;

}


.ev-pdf-exam-name small {

    display:
        block;

    margin-bottom:
        1mm;

    font-size:
        7px;

    color:
        #64748b;

    text-transform:
        uppercase;

    letter-spacing:
        .5px;

}


.ev-pdf-exam-name strong {

    font-size:
        15px;

    color:
        #0f172a;

}


/* =================================================
   SCORE HERO
================================================= */

.ev-pdf-score {

    display:
        flex;

    align-items:
        center;

    justify-content:
        space-between;

    min-height:
        45mm;

    padding:
        7mm;

    margin-bottom:
        5mm;

    border:
        1px solid #dbeafe;

    border-radius:
        15px;

    background:
        linear-gradient(
            135deg,
            #eff6ff,
            #f8fafc
        );

}


.ev-score-label {

    font-size:
        8px;

    font-weight:
        700;

    color:
        #64748b;

}


.ev-score-number {

    margin:
        1mm 0;

    font-size:
        30px;

    font-weight:
        800;

    line-height:
        1;

    color:
        #1d4ed8;

}


.ev-score-out {

    font-size:
        8px;

    color:
        #64748b;

}


/* =================================================
   CIRCULAR PERFORMANCE
================================================= */

.ev-ring {

    width:
        35mm;

    height:
        35mm;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    border-radius:
        50%;

    background:
        conic-gradient(
            #2563eb ${percentageNumber}%,
            #dbeafe ${percentageNumber}%
        );

    position:
        relative;

}


.ev-ring::after {

    content:
        "";

    position:
        absolute;

    width:
        26mm;

    height:
        26mm;

    border-radius:
        50%;

    background:
        #ffffff;

}


.ev-ring-content {

    position:
        relative;

    z-index:
        2;

    text-align:
        center;

}


.ev-ring-content strong {

    display:
        block;

    font-size:
        15px;

    color:
        #1d4ed8;

}


.ev-ring-content span {

    font-size:
        6px;

    color:
        #64748b;

}


/* =================================================
   STATISTICS
================================================= */

.ev-pdf-stats {

    display:
        grid;

    grid-template-columns:
        repeat(5, 1fr);

    gap:
        3mm;

    margin-bottom:
        5mm;

}


.ev-pdf-stat {

    padding:
        4mm 2mm;

    text-align:
        center;

    border:
        1px solid #e2e8f0;

    border-radius:
        10px;

    background:
        #ffffff;

}


.ev-pdf-stat span {

    display:
        block;

    font-size:
        7px;

    color:
        #64748b;

}


.ev-pdf-stat strong {

    display:
        block;

    margin-top:
        1mm;

    font-size:
        16px;

    color:
        #0f172a;

}


.ev-pdf-stat.correct strong {

    color:
        #16a34a;

}


.ev-pdf-stat.wrong strong {

    color:
        #dc2626;

}


.ev-pdf-stat.skipped strong {

    color:
        #d97706;

}


/* =================================================
   DISTRIBUTION
================================================= */

.ev-distribution {

    padding:
        5mm;

    margin-bottom:
        6mm;

    border-radius:
        12px;

    background:
        #f8fafc;

}


.ev-distribution h3 {

    margin:
        0 0 3mm;

    font-size:
        10px;

    color:
        #172554;

}


.ev-distribution-bar {

    display:
        flex;

    width:
        100%;

    height:
        7mm;

    overflow:
        hidden;

    border-radius:
        20px;

}


.ev-bar-correct {

    width:
        ${correctWidth}%;

    background:
        #22c55e;

}


.ev-bar-wrong {

    width:
        ${wrongWidth}%;

    background:
        #ef4444;

}


.ev-bar-skipped {

    width:
        ${skippedWidth}%;

    background:
        #f59e0b;

}


.ev-distribution-legend {

    display:
        flex;

    gap:
        8mm;

    margin-top:
        3mm;

    font-size:
        7px;

    color:
        #475569;

}


/* =================================================
   SUMMARY
================================================= */

.ev-summary-title {

    margin:
        0 0 3mm;

    font-size:
        13px;

    color:
        #172554;

}


.ev-summary-grid {

    display:
        grid;

    grid-template-columns:
        repeat(2, 1fr);

    margin-bottom:
        6mm;

    border:
        1px solid #e2e8f0;

    border-radius:
        10px;

    overflow:
        hidden;

}


.ev-summary-item {

    display:
        flex;

    justify-content:
        space-between;

    padding:
        3mm;

    border-bottom:
        1px solid #e2e8f0;

    font-size:
        8px;

}


.ev-summary-item span {

    color:
        #64748b;

}


.ev-summary-item strong {

    color:
        #0f172a;

}


/* =================================================
   EXISTING RESULT COMPONENTS
================================================= */

.ev-existing {

    width:
        100%;

}


.ev-existing .score-card {

    display:
        none !important;

}


.ev-existing .stats-grid {

    display:
        none !important;

}


.ev-existing .details-card {

    display:
        none !important;

}


/* =================================================
   SECTION RESULT
================================================= */

.ev-existing
.section-result-card {

    margin-top:
        6mm;

}


.ev-existing
.section-result-card.hidden {

    display:
        none !important;

}


/* =================================================
   ANALYSIS
================================================= */

.ev-existing
.analysis-section {

    display:
        block !important;

    visibility:
        visible !important;

    opacity:
        1 !important;

    height:
        auto !important;

    max-height:
        none !important;

    overflow:
        visible !important;

}


.ev-existing
.question-analysis-card {

    width:
        100% !important;

}


.ev-existing
.question-result-card {

    break-inside:
        avoid;

    page-break-inside:
        avoid;

}


/* =================================================
   REMOVE WEB BUTTONS
================================================= */

.result-options,
.result-actions,
.result-header {

    display:
        none !important;

}


/* =================================================
   PAGE BREAK SAFETY
================================================= */

.section-result-card,
.section-result-list,
.section-result-item,
.question-analysis-card,
.question-result-card,
.details-card {

    break-inside:
        avoid;

    page-break-inside:
        avoid;

}


/* =================================================
   PRINT
================================================= */

@media print {

    body {

        background:
            #ffffff !important;

    }

}

</style>

</head>


<body>


<div class="ev-pdf">


    <!-- =========================================
         HEADER
    ========================================== -->

    <div class="ev-pdf-header">

        <div>

            <div class="ev-pdf-brand">
                EXAMVERSE
            </div>

            <div class="ev-pdf-subtitle">
                Examination Result Report
            </div>

        </div>


        <div class="ev-pdf-status">

            ${resultBadge}

        </div>

    </div>


    <!-- =========================================
         EXAM NAME
    ========================================== -->

    <div class="ev-pdf-exam-name">

        <small>
            Examination
        </small>

        <strong>
            ${examName}
        </strong>

    </div>


    <!-- =========================================
         SCORE
    ========================================== -->

    <div class="ev-pdf-score">

        <div>

            <div class="ev-score-label">
                FINAL SCORE
            </div>

            <div class="ev-score-number">
                ${score}
            </div>

            <div class="ev-score-out">
                out of ${totalMarks}
            </div>

        </div>


        <div
            class="ev-ring"
        >

            <div class="ev-ring-content">

                <strong>
                    ${percentageNumber.toFixed(1)}%
                </strong>

                <span>
                    Performance
                </span>

            </div>

        </div>

    </div>


    <!-- =========================================
         STATISTICS
    ========================================== -->

    <div class="ev-pdf-stats">


        <div class="ev-pdf-stat">

            <span>
                Attempted
            </span>

            <strong>
                ${attempted}
            </strong>

        </div>


        <div class="ev-pdf-stat correct">

            <span>
                Correct
            </span>

            <strong>
                ${correct}
            </strong>

        </div>


        <div class="ev-pdf-stat wrong">

            <span>
                Wrong
            </span>

            <strong>
                ${wrong}
            </strong>

        </div>


        <div class="ev-pdf-stat skipped">

            <span>
                Skipped
            </span>

            <strong>
                ${skipped}
            </strong>

        </div>


        <div class="ev-pdf-stat">

            <span>
                Review
            </span>

            <strong>
                ${markedReview}
            </strong>

        </div>


    </div>


    <!-- =========================================
         DISTRIBUTION
    ========================================== -->

    <div class="ev-distribution">

        <h3>
            Answer Distribution
        </h3>


        <div class="ev-distribution-bar">

            <div class="ev-bar-correct"></div>

            <div class="ev-bar-wrong"></div>

            <div class="ev-bar-skipped"></div>

        </div>


        <div class="ev-distribution-legend">

            <span>
                ● Correct ${correct}
            </span>

            <span>
                ● Wrong ${wrong}
            </span>

            <span>
                ● Skipped ${skipped}
            </span>

        </div>

    </div>


    <!-- =========================================
         SUMMARY
    ========================================== -->

    <h2 class="ev-summary-title">

        Result Summary

    </h2>


    <div class="ev-summary-grid">


        <div class="ev-summary-item">

            <span>
                Total Questions
            </span>

            <strong>
                ${totalQuestions}
            </strong>

        </div>


        <div class="ev-summary-item">

            <span>
                Attempted
            </span>

            <strong>
                ${attempted}
            </strong>

        </div>


        <div class="ev-summary-item">

            <span>
                Positive Marks
            </span>

            <strong>
                ${positiveMarks}
            </strong>

        </div>


        <div class="ev-summary-item">

            <span>
                Negative Marks
            </span>

            <strong>
                ${negativeMarks}
            </strong>

        </div>


        <div class="ev-summary-item">

            <span>
                Percentage
            </span>

            <strong>
                ${percentage}
            </strong>

        </div>


        <div class="ev-summary-item">

            <span>
                Passing Marks
            </span>

            <strong>
                ${passingMarks}
            </strong>

        </div>


        <div class="ev-summary-item">

            <span>
                Time Taken
            </span>

            <strong>
                ${timeTaken}
            </strong>

        </div>


        <div class="ev-summary-item">

            <span>
                Status
            </span>

            <strong>
                ${status}
            </strong>

        </div>


    </div>


    <!-- =========================================
         EXISTING SECTION + ANALYSIS
    ========================================== -->

    <div class="ev-existing">

        ${sectionHTML}

        ${analysisHTML}

    </div>


</div>


<script>

window.addEventListener(
    "load",
    function() {

        setTimeout(
            function() {

                window.print();

            },
            1000
        );

    }
);

</script>


</body>

</html>

`;


    // ==========================================
    // WRITE DOCUMENT
    // ==========================================

    printWindow.document.open();

    printWindow.document.write(
        printHTML
    );

    printWindow.document.close();


    // ==========================================
    // BUTTON STATE
    // ==========================================

    const oldText =
        pdfButton.innerHTML;


    pdfButton.disabled =
        true;


    pdfButton.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Preparing PDF...

    `;


    setTimeout(
        function() {

            pdfButton.disabled =
                false;

            pdfButton.innerHTML =
                oldText;

        },
        1500
    );

}

// ==========================================
// SECTION-WISE PERFORMANCE
// ==========================================

async function renderSectionPerformance(
    examId,
    questions,
    userAnswers,
) {

    const sectionContainer =
        document.getElementById(
            "sectionResult"
        );

    const sectionList =
        document.getElementById(
            "sectionResultList"
        );

    

// ==========================================
// Hide Immediately
// ==========================================

if (sectionContainer) {

    sectionContainer.classList.add("hidden");

    sectionContainer.style.display = "none";

}


    // ------------------------------------------
    // SAFETY - CHECK
    // ------------------------------------------

    if (
        !sectionContainer ||
        !sectionList
    ) {
        return;
    }


    try {

        // ------------------------------------------
        // LOAD EXAM SECTIONS
        // ------------------------------------------

        const {
            data: sections,
            error: sectionError
        } =
            await supabaseClient

                .from("exam_sections")

                .select(`
                    id,
                    section_name,
                    section_order,
                    question_count,
                    duration_minutes
                `)

                .eq(
                    "exam_id",
                    examId
                )

                .order(
                    "section_order",
                    {
                        ascending: true
                    }
                );


        // ------------------------------------------
        // SECTION QUERY ERROR
        // ------------------------------------------

        if (sectionError) {

    console.error(
        "Section Result Error:",
        sectionError
    );

    sectionContainer.classList.add("hidden");
    sectionContainer.style.display = "none";

    return [];
}


        // ------------------------------------------
        // NORMAL EXAM
        // ------------------------------------------

        if (
    !sections ||
    sections.length === 0
) {

    sectionContainer.classList.add("hidden");
    sectionContainer.style.display = "none";

    return [];
}


        // ------------------------------------------
        // SORT QUESTIONS
        // ------------------------------------------

        const sortedQuestions =
            [...questions].sort(
                (a, b) =>
                    Number(
                        a.question_no || 0
                    ) -
                    Number(
                        b.question_no || 0
                    )
            );


        // ------------------------------------------
        // ANSWER LOOKUP
        // ------------------------------------------

        const answerMap =
            new Map();

        (userAnswers || []).forEach(
            answer => {

                answerMap.set(
                    String(
                        answer.question_id
                    ),
                    answer
                );

            }
        );


        // ------------------------------------------
        // BUILD SECTION RESULTS
        // ------------------------------------------

        let questionPointer = 0;

        const sectionResults =
            sections.map(
                section => {

                    const questionCount =
                        Number(
                            section.question_count || 0
                        );


                    const sectionQuestions =
                        sortedQuestions.slice(
                            questionPointer,
                            questionPointer +
                            questionCount
                        );


                    questionPointer +=
                        questionCount;


                    // ----------------------------------
                    // SECTION STATISTICS
                    // ----------------------------------

                    let attempted = 0;

                    let correct = 0;

                    let wrong = 0;

                    let skipped = 0;

                    let markedReview = 0;

                    let positiveMarks = 0;

                    let negativeMarks = 0;

                    let totalMarks = 0;


                    sectionQuestions.forEach(
                        question => {

                            const marks =
                                Number(
                                    question.marks || 0
                                );

                            const negative =
                                Number(
                                    question.negative_marks || 0
                                );


                            totalMarks +=
                                marks;


                            const answer =
                                answerMap.get(
                                    String(
                                        question.id
                                    )
                                );


                            // ------------------------------
                            // NO ANSWER
                            // ------------------------------

                            if (
                                !answer ||
                                !answer.selected_option
                            ) {

                                skipped++;

                                if (
                                    answer &&
                                    answer.is_review === true
                                ) {

                                    markedReview++;

                                }

                                return;
                            }


                            // ------------------------------
                            // ATTEMPTED
                            // ------------------------------

                            attempted++;


                            if (
                                answer.is_review === true
                            ) {

                                markedReview++;

                            }


                            // ------------------------------
                            // CORRECT
                            // ------------------------------

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

                                correct++;

                                positiveMarks +=
                                    marks;

                            }


                            // ------------------------------
                            // WRONG
                            // ------------------------------

                            else {

                                wrong++;

                                negativeMarks +=
                                    negative;

                            }

                        }
                    );


                    // ----------------------------------
                    // FINAL SCORE
                    // ----------------------------------

                    const score =
                        positiveMarks -
                        negativeMarks;


                    // ----------------------------------
                    // PERCENTAGE
                    // ----------------------------------

                    const percentage =
                        totalMarks > 0

                            ? (
                                (
                                    score /
                                    totalMarks
                                ) * 100
                            )

                            : 0;


                    // ----------------------------------
                    // ACCURACY
                    // ----------------------------------

                    const accuracy =
                        attempted > 0

                            ? (
                                (
                                    correct /
                                    attempted
                                ) * 100
                            )

                            : 0;


                    return {

                        section_name:
                            section.section_name ||
                            "Section",

                        question_count:
                            questionCount,

                        attempted:
                            attempted,

                        correct:
                            correct,

                        wrong:
                            wrong,

                        skipped:
                            skipped,

                        markedReview:
                            markedReview,

                        positiveMarks:
                            positiveMarks,

                        negativeMarks:
                            negativeMarks,

                        score:
                            score,

                        totalMarks:
                            totalMarks,

                        percentage:
                            percentage,

                        accuracy:
                            accuracy,

                        duration:
                            Number(
                                section.duration_minutes || 0
                            )

                    };

                }
            );


        // ------------------------------------------
        // SHOW SECTION CONTAINER
        // ------------------------------------------

        sectionContainer.classList.remove(
            "hidden"
        );

        sectionContainer.style.display =
    "block";


        // ------------------------------------------
        // RENDER
        // ------------------------------------------

        sectionList.innerHTML =
            sectionResults
                .map(
                    section => {

                        const scoreText =
                            Number(
                                section.score
                            ).toFixed(2);


                        const positiveText =
                            Number(
                                section.positiveMarks
                            ).toFixed(2);


                        const negativeText =
                            Number(
                                section.negativeMarks
                            ).toFixed(2);


                        const percentageText =
                            Number(
                                Math.max(
                                    0,
                                    section.percentage
                                )
                            ).toFixed(1);


                        const accuracyText =
                            Number(
                                section.accuracy
                            ).toFixed(1);


                        return `

                            <div
                                class="section-result-item">

                                <div
                                    class="section-result-title">

                                    <div>

                                        <h3>
                                            ${escapeHTML(
                                                section.section_name
                                            )}
                                        </h3>

                                        <span>
                                            ${
                                                section.question_count
                                            }
                                            Questions
                                        </span>

                                    </div>

                                    <div
                                        class="section-result-score">

                                        <strong>
                                            ${scoreText}
                                        </strong>

                                        <small>
                                            / ${Number(
                                                section.totalMarks
                                            ).toFixed(2)}
                                        </small>

                                    </div>

                                </div>


                                <div
                                    class="section-result-stats">


                                    <div
                                        class="section-stat">

                                        <span>
                                            Attempted
                                        </span>

                                        <strong>
                                            ${
                                                section.attempted
                                            }
                                        </strong>

                                    </div>


                                    <div
                                        class="section-stat correct">

                                        <span>
                                            Correct
                                        </span>

                                        <strong>
                                            ${
                                                section.correct
                                            }
                                        </strong>

                                    </div>


                                    <div
                                        class="section-stat wrong">

                                        <span>
                                            Wrong
                                        </span>

                                        <strong>
                                            ${
                                                section.wrong
                                            }
                                        </strong>

                                    </div>


                                    <div
                                        class="section-stat skipped">

                                        <span>
                                            Skipped
                                        </span>

                                        <strong>
                                            ${
                                                section.skipped
                                            }
                                        </strong>

                                    </div>


                                    <div
                                        class="section-stat">

                                        <span>
                                            Accuracy
                                        </span>

                                        <strong>
                                            ${accuracyText}%
                                        </strong>

                                    </div>


                                    <div
                                        class="section-stat">

                                        <span>
                                            Percentage
                                        </span>

                                        <strong>
                                            ${percentageText}%
                                        </strong>

                                    </div>


                                </div>


                                <div
                                    class="section-result-marks">

                                    <span>
                                        Positive:
                                        +${positiveText}
                                    </span>

                                    <span>
                                        Negative:
                                        -${negativeText}
                                    </span>

                                    <span>
                                        Review:
                                        ${
                                            section.markedReview
                                        }
                                    </span>

                                </div>


                            </div>

                        `;

                    }
                )
                .join("");


        console.log(
            "Section performance:",
            sectionResults
        );
        return sections;

    }


    catch (error) {

        console.error(
            "Section Performance Error:",
            error
        );

        sectionContainer.classList.add(
            "hidden"
        );

    }

}