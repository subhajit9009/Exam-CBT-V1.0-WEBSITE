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

function downloadResultPDF() {

    const resultWrapper =
        document.querySelector(
            ".result-wrapper"
        );

    const pdfButton =
        document.getElementById(
            "downloadPdfBtn"
        );


    if (!resultWrapper) {

        alert(
            "Result content is not available."
        );

        return;
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
    // CLONE RESULT
    // ==========================================

    const resultClone =
        resultWrapper.cloneNode(true);


    // ==========================================
    // REMOVE WEB-ONLY ELEMENTS
    // ==========================================

    resultClone
        .querySelectorAll(
            ".result-header, " +
            ".result-options, " +
            ".result-actions"
        )
        .forEach(
            element => {

                element.remove();

            }
        );


    // ==========================================
    // FORCE ANALYSIS OPEN IN PDF
    // ==========================================

    const analysisSection =
        resultClone.querySelector(
            "#analysisSection"
        );


    if (analysisSection) {

        analysisSection.classList.remove(
            "hidden"
        );

        analysisSection.style.display =
            "block";

        analysisSection.style.visibility =
            "visible";

        analysisSection.style.opacity =
            "1";

        analysisSection.style.height =
            "auto";

        analysisSection.style.maxHeight =
            "none";

        analysisSection.style.overflow =
            "visible";

    }


    // ==========================================
    // READ ACTUAL RESULT VALUES
    // ==========================================

    const getValue =
        function(id) {

            const element =
                resultClone.querySelector(
                    "#" + id
                );

            if (!element) {
                return "0";
            }

            return element.textContent.trim();

        };


    const examName =
        getValue("examName") ||
        "Examination Result";


    const score =
        getValue("score");


    const totalMarks =
        getValue("totalMarks");


    const attempted =
        getValue("attempted");


    const correct =
        getValue("correct");


    const wrong =
        getValue("wrong");


    const skipped =
        getValue("skipped");


    const markedReview =
        getValue("markedReview");


    const totalQuestions =
        getValue("totalQuestions");


    const positiveMarks =
        getValue("positiveMarks");


    const negativeMarks =
        getValue("negativeMarks");


    const percentage =
        getValue("percentage");


    const passingMarks =
        getValue("passingMarks");


    const timeTaken =
        getValue("timeTaken");


    const status =
        getValue("status");


    const resultBadge =
        getValue("resultBadge");


    // ==========================================
    // PERCENTAGE NUMBER
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
    // QUESTION DISTRIBUTION
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


    const answeredTotal =
        correctNumber +
        wrongNumber +
        skippedNumber;


    let correctWidth = 0;

    let wrongWidth = 0;

    let skippedWidth = 0;


    if (
        answeredTotal > 0
    ) {

        correctWidth =
            (
                correctNumber /
                answeredTotal
            ) * 100;


        wrongWidth =
            (
                wrongNumber /
                answeredTotal
            ) * 100;


        skippedWidth =
            (
                skippedNumber /
                answeredTotal
            ) * 100;

    }


    // ==========================================
    // RESULT HEADER
    // ==========================================

    const reportHeader = `

        <div class="ev-header">

            <div>

                <div class="ev-logo">
                    EXAMVERSE
                </div>

                <div class="ev-report-name">
                    Examination Result Report
                </div>

            </div>


            <div class="ev-result-status">

                ${resultBadge}

            </div>

        </div>


        <div class="ev-exam-name">

            ${examName}

        </div>

    `;


    // ==========================================
    // SCORE AREA
    // ==========================================

    const scoreArea = `

        <div class="ev-score-section">

            <div class="ev-score-main">

                <span class="ev-label">
                    FINAL SCORE
                </span>

                <strong>
                    ${score}
                </strong>

                <span class="ev-out-of">
                    out of ${totalMarks}
                </span>

            </div>


            <div
                class="ev-ring"
                style="
                    --progress:
                    ${percentageNumber}%;
                "
            >

                <div class="ev-ring-inner">

                    <strong>
                        ${percentageNumber.toFixed(1)}%
                    </strong>

                    <span>
                        Performance
                    </span>

                </div>

            </div>

        </div>

    `;


    // ==========================================
    // STATISTICS
    // ==========================================

    const statistics = `

        <div class="ev-stat-grid">


            <div class="ev-stat">

                <span>
                    Attempted
                </span>

                <strong>
                    ${attempted}
                </strong>

            </div>


            <div class="ev-stat correct">

                <span>
                    Correct
                </span>

                <strong>
                    ${correct}
                </strong>

            </div>


            <div class="ev-stat wrong">

                <span>
                    Wrong
                </span>

                <strong>
                    ${wrong}
                </strong>

            </div>


            <div class="ev-stat skipped">

                <span>
                    Skipped
                </span>

                <strong>
                    ${skipped}
                </strong>

            </div>


            <div class="ev-stat review">

                <span>
                    Marked Review
                </span>

                <strong>
                    ${markedReview}
                </strong>

            </div>


        </div>

    `;


    // ==========================================
    // ANSWER DISTRIBUTION
    // ==========================================

    const distribution = `

        <div class="ev-distribution">

            <h3>
                Answer Distribution
            </h3>


            <div class="ev-distribution-bar">

                <div
                    class="ev-correct-bar"
                    style="
                        width:
                        ${correctWidth}%;
                    "
                ></div>


                <div
                    class="ev-wrong-bar"
                    style="
                        width:
                        ${wrongWidth}%;
                    "
                ></div>


                <div
                    class="ev-skipped-bar"
                    style="
                        width:
                        ${skippedWidth}%;
                    "
                ></div>

            </div>


            <div class="ev-distribution-legend">

                <span>
                    <i class="correct-dot"></i>
                    Correct ${correct}
                </span>


                <span>
                    <i class="wrong-dot"></i>
                    Wrong ${wrong}
                </span>


                <span>
                    <i class="skipped-dot"></i>
                    Skipped ${skipped}
                </span>

            </div>

        </div>

    `;


    // ==========================================
    // SUMMARY TABLE
    // ==========================================

    const summary = `

        <div class="ev-summary">

            <h2>
                Result Summary
            </h2>


            <div class="ev-summary-grid">


                <div>
                    <span>Total Questions</span>
                    <strong>${totalQuestions}</strong>
                </div>


                <div>
                    <span>Attempted</span>
                    <strong>${attempted}</strong>
                </div>


                <div>
                    <span>Positive Marks</span>
                    <strong>${positiveMarks}</strong>
                </div>


                <div>
                    <span>Negative Marks</span>
                    <strong>${negativeMarks}</strong>
                </div>


                <div>
                    <span>Percentage</span>
                    <strong>${percentage}</strong>
                </div>


                <div>
                    <span>Passing Marks</span>
                    <strong>${passingMarks}</strong>
                </div>


                <div>
                    <span>Time Taken</span>
                    <strong>${timeTaken}</strong>
                </div>


                <div>
                    <span>Status</span>
                    <strong>${status}</strong>
                </div>


            </div>

        </div>

    `;


    // ==========================================
    // PRINT DOCUMENT
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
    ExamVerse Result
</title>


<link
    href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
>


<style>

/* ==========================================
   A4
========================================== */

@page {

    size:
        A4 portrait;

    margin:
        12mm;

}


/* ==========================================
   BASE
========================================== */

* {

    box-sizing:
        border-box;

}


html,
body {

    margin:
        0;

    padding:
        0;

    background:
        #ffffff;

}


body {

    font-family:
        'Poppins',
        Arial,
        sans-serif;

    color:
        #172554;

}


/* ==========================================
   REPORT
========================================== */

.ev-report {

    width:
        100%;

    max-width:
        186mm;

    margin:
        auto;

}


/* ==========================================
   HEADER
========================================== */

.ev-header {

    display:
        flex;

    align-items:
        center;

    justify-content:
        space-between;

    padding-bottom:
        5mm;

    border-bottom:
        2px solid #e2e8f0;

}


.ev-logo {

    font-size:
        22px;

    font-weight:
        800;

    letter-spacing:
        1px;

    color:
        #2563eb;

}


.ev-report-name {

    margin-top:
        1mm;

    font-size:
        9px;

    color:
        #64748b;

}


.ev-result-status {

    padding:
        6px 12px;

    border-radius:
        20px;

    background:
        #eff6ff;

    color:
        #2563eb;

    font-size:
        9px;

    font-weight:
        700;

}


.ev-exam-name {

    margin:
        5mm 0;

    font-size:
        17px;

    font-weight:
        700;

    color:
        #0f172a;

}


/* ==========================================
   SCORE
========================================== */

.ev-score-section {

    display:
        flex;

    align-items:
        center;

    justify-content:
        space-between;

    padding:
        7mm;

    border-radius:
        15px;

    background:
        linear-gradient(
            135deg,
            #eff6ff,
            #f8fafc
        );

    border:
        1px solid #dbeafe;

}


.ev-score-main {

    display:
        flex;

    flex-direction:
        column;

}


.ev-label {

    font-size:
        9px;

    font-weight:
        700;

    color:
        #64748b;

}


.ev-score-main strong {

    margin-top:
        1mm;

    font-size:
        30px;

    line-height:
        1;

    color:
        #1d4ed8;

}


.ev-out-of {

    margin-top:
        2mm;

    font-size:
        8px;

    color:
        #64748b;

}


/* ==========================================
   CIRCULAR GRAPHIC
========================================== */

.ev-ring {

    width:
        36mm;

    height:
        36mm;

    border-radius:
        50%;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    background:
        conic-gradient(
            #2563eb
            var(--progress),
            #dbeafe
            var(--progress)
        );

    position:
        relative;

}


.ev-ring::before {

    content:
        "";

    position:
        absolute;

    width:
        27mm;

    height:
        27mm;

    border-radius:
        50%;

    background:
        #ffffff;

}


.ev-ring-inner {

    position:
        relative;

    z-index:
        2;

    text-align:
        center;

}


.ev-ring-inner strong {

    display:
        block;

    font-size:
        17px;

    color:
        #1d4ed8;

}


.ev-ring-inner span {

    display:
        block;

    margin-top:
        1mm;

    font-size:
        6px;

    color:
        #64748b;

}


/* ==========================================
   STATISTICS
========================================== */

.ev-stat-grid {

    display:
        grid;

    grid-template-columns:
        repeat(
            5,
            1fr
        );

    gap:
        3mm;

    margin-top:
        5mm;

}


.ev-stat {

    padding:
        4mm 2mm;

    text-align:
        center;

    border:
        1px solid #e2e8f0;

    border-radius:
        10px;

}


.ev-stat span {

    display:
        block;

    font-size:
        7px;

    color:
        #64748b;

}


.ev-stat strong {

    display:
        block;

    margin-top:
        1mm;

    font-size:
        16px;

    color:
        #0f172a;

}


.ev-stat.correct strong {

    color:
        #15803d;

}


.ev-stat.wrong strong {

    color:
        #dc2626;

}


.ev-stat.skipped strong {

    color:
        #d97706;

}


.ev-stat.review strong {

    color:
        #7c3aed;

}


/* ==========================================
   DISTRIBUTION
========================================== */

.ev-distribution {

    margin-top:
        5mm;

    padding:
        5mm;

    border-radius:
        12px;

    background:
        #f8fafc;

}


.ev-distribution h3 {

    margin:
        0 0 3mm;

    font-size:
        11px;

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

    background:
        #e2e8f0;

}


.ev-correct-bar {

    background:
        #22c55e;

}


.ev-wrong-bar {

    background:
        #ef4444;

}


.ev-skipped-bar {

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


.ev-distribution-legend i {

    display:
        inline-block;

    width:
        6px;

    height:
        6px;

    margin-right:
        3px;

    border-radius:
        50%;

}


.correct-dot {

    background:
        #22c55e;

}


.wrong-dot {

    background:
        #ef4444;

}


.skipped-dot {

    background:
        #f59e0b;

}


/* ==========================================
   SUMMARY
========================================== */

.ev-summary {

    margin-top:
        6mm;

}


.ev-summary h2 {

    margin:
        0 0 3mm;

    font-size:
        13px;

}


.ev-summary-grid {

    display:
        grid;

    grid-template-columns:
        repeat(
            2,
            1fr
        );

    border:
        1px solid #e2e8f0;

    border-radius:
        10px;

    overflow:
        hidden;

}


.ev-summary-grid > div {

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


.ev-summary-grid span {

    color:
        #64748b;

}


.ev-summary-grid strong {

    color:
        #0f172a;

}


/* ==========================================
   ORIGINAL ANALYSIS
========================================== */

.ev-analysis {

    margin-top:
        7mm;

}


/* ==========================================
   PAGE BREAK SAFETY
========================================== */

.ev-score-section,
.ev-stat-grid,
.ev-distribution,
.ev-summary,
.question-result-card,
.section-result-item,
.details-card {

    break-inside:
        avoid;

    page-break-inside:
        avoid;

}


/* ==========================================
   ORIGINAL CONTENT WIDTH
========================================== */

.ev-original {

    width:
        100%;

}


.ev-original * {

    max-width:
        100%;

}


/* ==========================================
   PRINT COLORS
========================================== */

* {

    -webkit-print-color-adjust:
        exact !important;

    print-color-adjust:
        exact !important;

}


/* ==========================================
   TOOLBAR
========================================== */

.ev-toolbar {

    position:
        fixed;

    top:
        12px;

    right:
        12px;

    z-index:
        999999;

    display:
        flex;

    gap:
        8px;

}


.ev-toolbar button {

    border:
        none;

    border-radius:
        8px;

    padding:
        9px 14px;

    font-family:
        inherit;

    font-size:
        12px;

    font-weight:
        600;

    cursor:
        pointer;

}


.ev-print {

    background:
        #2563eb;

    color:
        white;

}


.ev-close {

    background:
        #e2e8f0;

    color:
        #334155;

}


@media print {

    .ev-toolbar {

        display:
            none !important;

    }

}

</style>

</head>


<body>


<!-- ==========================================
     PRINT TOOLBAR
========================================== -->

<div class="ev-toolbar">

    <button
        class="ev-print"
        onclick="window.print()"
    >

        🖨 Print / Save PDF

    </button>


    <button
        class="ev-close"
        onclick="window.close()"
    >

        ✕ Close

    </button>

</div>


<div class="ev-report">


    ${reportHeader}


    ${scoreArea}


    ${statistics}


    ${distribution}


    ${summary}


    <div class="ev-analysis">

        ${analysisSection
            ? analysisSection.outerHTML
            : ""
        }

    </div>


</div>


<script>

window.addEventListener(
    "load",
    function () {

        setTimeout(
            function () {

                window.print();

            },
            800
        );

    }
);

</script>


</body>

</html>

`;


    // ==========================================
    // WRITE PRINT PAGE
    // ==========================================

    printWindow.document.open();

    printWindow.document.write(
        printHTML
    );

    printWindow.document.close();


    // ==========================================
    // RESTORE BUTTON
    // ==========================================

    if (pdfButton) {

        const oldText =
            pdfButton.innerHTML;


        pdfButton.disabled =
            true;


        pdfButton.innerHTML = `
            <i class="fa-solid fa-file-pdf"></i>
            Preparing PDF...
        `;


        setTimeout(
            function () {

                pdfButton.disabled =
                    false;

                pdfButton.innerHTML =
                    oldText;

            },
            1500
        );

    }

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