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

async function downloadResultPDF() {

    const pdfButton =
        document.getElementById("downloadPdfBtn");

    const resultWrapper =
        document.querySelector(".result-wrapper");


    // ==========================================
    // SAFETY CHECK
    // ==========================================

    if (!resultWrapper || !pdfButton) {

        console.error(
            "PDF: Result wrapper or PDF button not found."
        );

        return;
    }


    // ==========================================
    // HTML2PDF CHECK
    // ==========================================

    if (typeof html2pdf === "undefined") {

        alert(
            "PDF generator is not loaded. Please check your internet connection."
        );

        return;
    }


    // ==========================================
    // OPEN PDF WINDOW IMMEDIATELY
    //
    // This prevents popup blockers from stopping
    // the PDF viewer on mobile browsers.
    // ==========================================

    let pdfWindow = null;

    try {

        pdfWindow =
            window.open(
                "",
                "_blank"
            );

        if (pdfWindow) {

            pdfWindow.document.title =
                "ExamVerse Examination Result";

            pdfWindow.document.body.innerHTML = `
                <div style="
                    font-family:Arial,sans-serif;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    height:100vh;
                    color:#475569;
                    font-size:16px;
                ">
                    Preparing your result PDF...
                </div>
            `;

        }

    }
    catch (popupError) {

        console.warn(
            "PDF popup could not be opened:",
            popupError
        );

    }


    // ==========================================
    // SAVE BUTTON STATE
    // ==========================================

    const oldText =
        pdfButton.innerHTML;

    pdfButton.disabled = true;

    pdfButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Generating PDF...
    `;


    let pdfHost = null;


    try {

        // ==========================================
        // FILE NAME
        // ==========================================

        const attemptId =
            sessionStorage.getItem(
                "attemptId"
            );

        const fileName =
            "ExamVerse_Result_" +
            (
                attemptId
                    ? attemptId.substring(0, 8)
                    : "Report"
            ) +
            ".pdf";


        // ==========================================
        // CREATE ISOLATED PDF HOST
        //
        // IMPORTANT:
        // The host is fixed, so it does NOT become
        // part of body's flex layout.
        // ==========================================

        pdfHost =
            document.createElement(
                "div"
            );

        pdfHost.className =
            "examverse-pdf-host";


        pdfHost.style.position =
            "fixed";

        pdfHost.style.left =
            "0";

        pdfHost.style.top =
            "0";

        pdfHost.style.width =
            "794px";

        pdfHost.style.minWidth =
            "794px";

        pdfHost.style.maxWidth =
            "794px";

        pdfHost.style.height =
            "auto";

        pdfHost.style.margin =
            "0";

        pdfHost.style.padding =
            "0";

        pdfHost.style.background =
            "#ffffff";

        pdfHost.style.overflow =
            "visible";

        pdfHost.style.pointerEvents =
            "none";

        /*
           Keep it invisible to the user.

           html2canvas's onclone() below will make
           the rendering copy visible.
        */

        pdfHost.style.visibility =
            "hidden";

        pdfHost.style.opacity =
            "1";

        pdfHost.style.zIndex =
            "-1";


        document.body.appendChild(
            pdfHost
        );


        // ==========================================
        // CLONE RESULT PAGE
        // ==========================================

        const pdfRoot =
            resultWrapper.cloneNode(
                true
            );


        pdfRoot.classList.add(
            "pdf-mode"
        );


        pdfRoot.setAttribute(
            "data-pdf-render",
            "true"
        );


        // ==========================================
        // FORCE A4 CSS WIDTH
        // ==========================================

        pdfRoot.style.width =
            "794px";

        pdfRoot.style.minWidth =
            "794px";

        pdfRoot.style.maxWidth =
            "794px";

        pdfRoot.style.flex =
            "0 0 794px";

        pdfRoot.style.margin =
            "0";

        pdfRoot.style.padding =
            "18px";

        pdfRoot.style.boxSizing =
            "border-box";

        pdfRoot.style.background =
            "#ffffff";

        pdfRoot.style.height =
            "auto";

        pdfRoot.style.minHeight =
            "0";

        pdfRoot.style.maxHeight =
            "none";

        pdfRoot.style.overflow =
            "visible";


        pdfHost.appendChild(
            pdfRoot
        );


        // ==========================================
        // REMOVE WEB-ONLY ELEMENTS
        // ==========================================

        pdfRoot
            .querySelectorAll(
                ".result-header, " +
                ".result-options, " +
                ".result-actions, " +
                "#downloadPdfBtn, " +
                "#analysisBtn, " +
                ".dashboard-btn"
            )
            .forEach(
                element => {

                    element.remove();

                }
            );


        // ==========================================
        // FORCE DETAILED ANALYSIS
        // ==========================================

        const analysisSection =
            pdfRoot.querySelector(
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

            analysisSection.style.marginTop =
                "20px";

        }


        // ==========================================
        // QUESTION ANALYSIS
        // ==========================================

        const questionAnalysis =
            pdfRoot.querySelector(
                "#questionAnalysis"
            );


        if (questionAnalysis) {

            questionAnalysis.style.display =
                "block";

            questionAnalysis.style.visibility =
                "visible";

            questionAnalysis.style.opacity =
                "1";

            questionAnalysis.style.height =
                "auto";

            questionAnalysis.style.maxHeight =
                "none";

            questionAnalysis.style.overflow =
                "visible";

        }


        const questionList =
            pdfRoot.querySelector(
                ".question-analysis-list"
            );


        if (questionList) {

            questionList.style.display =
                "flex";

            questionList.style.flexDirection =
                "column";

            questionList.style.width =
                "100%";

            questionList.style.maxWidth =
                "100%";

            questionList.style.height =
                "auto";

            questionList.style.maxHeight =
                "none";

            questionList.style.overflow =
                "visible";

        }


        // ==========================================
        // SECTION RESULT
        // ==========================================

        const sectionResult =
            pdfRoot.querySelector(
                "#sectionResult"
            );

        const sectionResultList =
            pdfRoot.querySelector(
                "#sectionResultList"
            );


        if (sectionResult) {

            const hasSectionResults =
                sectionResultList &&
                sectionResultList.children.length > 0;


            if (hasSectionResults) {

                sectionResult.classList.remove(
                    "hidden"
                );

                sectionResult.style.display =
                    "block";

                sectionResult.style.visibility =
                    "visible";

                sectionResult.style.opacity =
                    "1";

                sectionResult.style.height =
                    "auto";

                sectionResult.style.maxHeight =
                    "none";

                sectionResult.style.overflow =
                    "visible";

            }
            else {

                sectionResult.style.display =
                    "none";

            }

        }


        // ==========================================
        // FORCE CONTENT WIDTH
        // ==========================================

        pdfRoot
            .querySelectorAll(
                ".score-card, " +
                ".stats-grid, " +
                ".stat-card, " +
                ".details-card, " +
                ".details-grid, " +
                ".detail-item, " +
                ".question-analysis-card, " +
                ".question-result-card, " +
                ".answer-result-grid, " +
                ".answer-box, " +
                ".section-result-card, " +
                ".section-result-list, " +
                ".section-result-item"
            )
            .forEach(
                element => {

                    element.style.boxSizing =
                        "border-box";

                    element.style.maxWidth =
                        "100%";

                }
            );


        // ==========================================
        // SCORE CARD
        // ==========================================

        const scoreCard =
            pdfRoot.querySelector(
                ".score-card"
            );


        if (scoreCard) {

            scoreCard.style.width =
                "100%";

            scoreCard.style.maxWidth =
                "100%";

            scoreCard.style.boxSizing =
                "border-box";

        }


        // ==========================================
        // STATISTICS
        // ==========================================

        const statsGrid =
            pdfRoot.querySelector(
                ".stats-grid"
            );


        if (statsGrid) {

            statsGrid.style.display =
                "grid";

            statsGrid.style.gridTemplateColumns =
                "repeat(4, minmax(0, 1fr))";

            statsGrid.style.width =
                "100%";

            statsGrid.style.maxWidth =
                "100%";

            statsGrid.style.boxSizing =
                "border-box";

        }


        // ==========================================
        // DETAILS
        // ==========================================

        const detailsGrid =
            pdfRoot.querySelector(
                ".details-grid"
            );


        if (detailsGrid) {

            detailsGrid.style.display =
                "grid";

            detailsGrid.style.gridTemplateColumns =
                "repeat(2, minmax(0, 1fr))";

            detailsGrid.style.width =
                "100%";

            detailsGrid.style.maxWidth =
                "100%";

        }


        // ==========================================
        // ANSWERS
        // ==========================================

        pdfRoot
            .querySelectorAll(
                ".answer-result-grid"
            )
            .forEach(
                grid => {

                    grid.style.display =
                        "grid";

                    grid.style.gridTemplateColumns =
                        "repeat(2, minmax(0, 1fr))";

                    grid.style.width =
                        "100%";

                    grid.style.maxWidth =
                        "100%";

                }
            );


        // ==========================================
        // QUESTION CARDS
        // ==========================================

        pdfRoot
            .querySelectorAll(
                ".question-result-card"
            )
            .forEach(
                card => {

                    card.style.width =
                        "100%";

                    card.style.maxWidth =
                        "100%";

                    card.style.boxSizing =
                        "border-box";

                    card.style.visibility =
                        "visible";

                    card.style.opacity =
                        "1";

                    card.style.height =
                        "auto";

                    card.style.maxHeight =
                        "none";

                    card.style.overflow =
                        "visible";

                }
            );


        // ==========================================
        // ALL IMAGES
        // ==========================================

        pdfRoot
            .querySelectorAll(
                "img"
            )
            .forEach(
                img => {

                    img.style.maxWidth =
                        "100%";

                    img.style.height =
                        "auto";

                }
            );


        // ==========================================
        // WAIT FOR LAYOUT
        // ==========================================

        await new Promise(
            resolve => {

                requestAnimationFrame(
                    () => {

                        requestAnimationFrame(
                            () => {

                                setTimeout(
                                    resolve,
                                    150
                                );

                            }
                        );

                    }
                );

            }
        );


        // ==========================================
        // PDF OPTIONS
        // ==========================================

        const options = {

            margin: [
                8,
                8,
                8,
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

                /*
                   IMPORTANT:

                   Never use the real mobile
                   viewport width here.

                   A4 CSS width is 794px.
                */

                windowWidth:
                    794,

                windowHeight:
                    Math.max(
                        pdfRoot.scrollHeight,
                        1123
                    ),

                onclone:
                    clonedDocument => {

                        const clonedHost =
                            clonedDocument.querySelector(
                                ".examverse-pdf-host"
                            );

                        if (clonedHost) {

                            clonedHost.style.visibility =
                                "visible";

                            clonedHost.style.opacity =
                                "1";

                            clonedHost.style.position =
                                "fixed";

                            clonedHost.style.left =
                                "0";

                            clonedHost.style.top =
                                "0";

                            clonedHost.style.width =
                                "794px";

                            clonedHost.style.minWidth =
                                "794px";

                            clonedHost.style.maxWidth =
                                "794px";

                            clonedHost.style.zIndex =
                                "1";

                        }


                        const clonedRoot =
                            clonedDocument.querySelector(
                                ".pdf-mode"
                            );

                        if (clonedRoot) {

                            clonedRoot.style.position =
                                "relative";

                            clonedRoot.style.left =
                                "0";

                            clonedRoot.style.top =
                                "0";

                            clonedRoot.style.width =
                                "794px";

                            clonedRoot.style.minWidth =
                                "794px";

                            clonedRoot.style.maxWidth =
                                "794px";

                            clonedRoot.style.margin =
                                "0";

                            clonedRoot.style.transform =
                                "none";

                        }

                    }

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

                    ".analysis-header",

                    ".analysis-legend",

                    ".section-result-item"

                ]

            }

        };


        // ==========================================
        // GENERATE PDF
        // ==========================================

        const pdf =
            await html2pdf()
                .set(options)
                .from(pdfRoot)
                .toPdf()
                .get("pdf");


        // ==========================================
        // PDF METADATA
        // ==========================================

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


        // ==========================================
        // SHOW PDF IN NEW TAB
        // ==========================================

        const pdfBlob =
            pdf.output(
                "blob"
            );


        const pdfUrl =
            URL.createObjectURL(
                pdfBlob
            );


        if (pdfWindow &&
            !pdfWindow.closed) {

            pdfWindow.location.href =
                pdfUrl;

        }
        else {

            /*
               Popup was blocked.

               Fall back to downloading.
            */

            const downloadLink =
                document.createElement(
                    "a"
                );

            downloadLink.href =
                pdfUrl;

            downloadLink.download =
                fileName;

            document.body.appendChild(
                downloadLink
            );

            downloadLink.click();

            downloadLink.remove();

        }


        // ==========================================
        // CLEAN URL LATER
        // ==========================================

        setTimeout(
            () => {

                URL.revokeObjectURL(
                    pdfUrl
                );

            },
            60000
        );


    }
    catch (error) {

        console.error(
            "PDF Generation Error:",
            error
        );


        if (pdfWindow &&
            !pdfWindow.closed) {

            pdfWindow.document.body.innerHTML = `
                <div style="
                    font-family:Arial,sans-serif;
                    padding:40px;
                    color:#b91c1c;
                ">
                    Unable to generate the result PDF.
                </div>
            `;

        }


        alert(
            "Unable to generate the result PDF. Check the browser console for details."
        );

    }


    finally {

        // ==========================================
        // REMOVE PDF HOST
        // ==========================================

        if (
            pdfHost &&
            pdfHost.parentNode
        ) {

            pdfHost.parentNode.removeChild(
                pdfHost
            );

        }


        // ==========================================
        // RESTORE BUTTON
        // ==========================================

        pdfButton.disabled =
            false;

        pdfButton.innerHTML =
            oldText;

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