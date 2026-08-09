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


        document.getElementById(
            "percentage"
        ).textContent =

            (attempt.percentage ?? 0) + "%";


        document.getElementById(
            "passingMarks"
        ).textContent =

            exam?.passing_marks ?? 0;


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
        // Dashboard
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


        console.log(
            "Result loaded:",
            attempt
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