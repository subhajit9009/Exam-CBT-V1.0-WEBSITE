/* ==========================================
   ExamVerse Result Engine
   Created by Subhajit Paul
========================================== */


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

            window.location.href =
                "exam-list.html";

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

        const {
            data: resultQuestions,
            error: resultQuestionsError
        } =
            await supabaseClient

                .from("questions")

                .select(
                    "id, correct_answer, marks, negative_marks"
                )

                .eq(
                    "exam_id",
                    attempt.exam_id
                );


        if (resultQuestionsError) {

            console.error(
                "Question Result Error:",
                resultQuestionsError
            );

        }


        // ==========================================
        // Calculate Review / Marks
        // ==========================================

        let markedReviewCount = 0;

        let positiveMarks = 0;

        let negativeMarks = 0;


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
            // Calculate Positive / Negative Marks
            // ======================================

            userAnswers.forEach(
                answer => {


                    // No answer
                    if (
                        !answer.selected_option
                    ) {

                        return;

                    }


                    const question =
                        resultQuestions.find(
                            q =>
                                q.id ===
                                answer.question_id
                        );


                    if (!question) {

                        return;

                    }


                    // ==================================
                    // Correct Answer
                    // ==================================

                    if (
                        answer.selected_option ===
                        question.correct_answer
                    ) {

                        positiveMarks +=
                            Number(
                                question.marks || 0
                            );

                    }


                    // ==================================
                    // Wrong Answer
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
        // Display Exam Name
        // ==========================================

        document.getElementById(
            "examName"
        ).textContent =

            exam?.exam_name ||
            "Examination";


        // ==========================================
        // Basic Statistics
        // ==========================================

        document.getElementById(
            "attempted"
        ).textContent =

            attempt.attempted ?? 0;


        document.getElementById(
            "correct"
        ).textContent =

            attempt.correct ?? 0;


        document.getElementById(
            "wrong"
        ).textContent =

            attempt.wrong ?? 0;


        document.getElementById(
            "skipped"
        ).textContent =

            attempt.skipped ?? 0;


        // ==========================================
        // Marked for Review
        // ==========================================

        const reviewElement =
            document.getElementById(
                "markedReview"
            );


        if (reviewElement) {

            reviewElement.textContent =
                markedReviewCount;

        }


        // ==========================================
        // Detailed Result
        // ==========================================

        document.getElementById(
            "totalQuestions"
        ).textContent =

            attempt.total_questions ?? 0;


        document.getElementById(
            "detailAttempted"
        ).textContent =

            attempt.attempted ?? 0;


        // ==========================================
        // Positive Marks
        // ==========================================

        document.getElementById(
            "positiveMarks"
        ).textContent =

            "+" +
            Number(
                positiveMarks
            ).toFixed(2);


        // ==========================================
        // Negative Marks
        // ==========================================

        document.getElementById(
            "negativeMarks"
        ).textContent =

            negativeMarks > 0

                ? "-" +
                  Number(
                      negativeMarks
                  ).toFixed(2)

                : "0.00";


        // ==========================================
        // Percentage
        // ==========================================

        document.getElementById(
            "percentage"
        ).textContent =

            (
                attempt.percentage ?? 0
            ) + "%";


        // ==========================================
        // Passing Marks
        // ==========================================

        document.getElementById(
            "passingMarks"
        ).textContent =

            exam?.passing_marks ?? 0;


        // ==========================================
        // Status
        // ==========================================

        document.getElementById(
            "status"
        ).textContent =

            attempt.status ||
            "Completed";


        // ==========================================
        // Score
        // ==========================================

        document.getElementById(
            "score"
        ).textContent =

            Number(
                attempt.score ?? 0
            ).toFixed(2);


        // ==========================================
        // Total Marks
        // ==========================================

        document.getElementById(
            "totalMarks"
        ).textContent =

            exam?.total_marks ??
            0;


        // ==========================================
        // Result Badge
        // ==========================================

        const badge =
            document.getElementById(
                "resultBadge"
            );


        badge.textContent =
            attempt.result ||
            "Completed";


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


        document.getElementById(
            "timeTaken"
        ).textContent =

            String(hours)
                .padStart(2, "0")

            + ":" +

            String(minutes)
                .padStart(2, "0")

            + ":" +

            String(seconds)
                .padStart(2, "0");


        // ==========================================
        // Dashboard Button
        // ==========================================

        document.getElementById(
            "dashboardBtn"
        ).addEventListener(
            "click",
            () => {


                sessionStorage.removeItem(
                    "attemptId"
                );


                sessionStorage.removeItem(
                    "examStartTime"
                );


                window.location.href =
                    "dashboard.html";

            }
        );


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