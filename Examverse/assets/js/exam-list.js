/* ==========================================
   ExamVerse Available Exams
   Created by Subhajit Paul
========================================== */

//==========================================
// Elements
//==========================================

const examContainer =
document.getElementById("examContainer");

const searchExam =
document.getElementById("searchExam");

//==========================================
// Load Exams
//==========================================

async function loadExams(search = "") {

    examContainer.innerHTML =
        `<div class="loading">Loading Exams...</div>`;

    const {
        data: exams,
        error
    } = await supabaseClient
        .from("exams")
        .select("*")
        .eq("status", "Live")
        .order("exam_name");

    if (error) {
        examContainer.innerHTML =
            `<div class="loading">Failed to load exams.</div>`;
        return;
    }

    const {
        data: auth
    } = await supabaseClient.auth.getUser();

    const user = auth?.user;

    let pausedAttempts = [];

    if (user) {

        const { data } = await supabaseClient
            .from("exam_attempts")
            .select(`
                id,
                exam_id,
                status,
                remaining_time_seconds
            `)
            .eq("user_id", user.id)
            .eq("status", "Paused");

        pausedAttempts = data || [];
    }

    examContainer.innerHTML = "";

    const filtered =
        exams.filter(exam =>
            exam.exam_name
                .toLowerCase()
                .includes(search.toLowerCase())
        );

    if (filtered.length === 0) {
        examContainer.innerHTML =
            `<div class="loading">No Live Exams Found.</div>`;
        return;
    }

    filtered.forEach(exam => {

        const paused =
            pausedAttempts.find(
                p => p.exam_id === exam.id
            );

        examContainer.innerHTML += `

        <div class="examCard">

            <h2>${exam.exam_name}</h2>

            <p class="examInfo">
                📂 Category :
                <b>${exam.category}</b>
            </p>

            <p class="examInfo">
                📝 Questions :
                <b>${exam.total_questions}</b>
            </p>

            <p class="examInfo">
                ⏱ Duration :
                <b>${exam.duration} Minutes</b>
            </p>

            <p class="examInfo">
                🏆 Total Marks :
                <b>${exam.total_marks}</b>
            </p>

            <span class="status">
                ${paused ? "⏸ PAUSED" : "🟢 LIVE"}
            </span>

            ${
                paused
                ? `
                <button
                    class="startBtn resumeBtn"
                    onclick="resumeExam(
                        '${paused.id}',
                        '${exam.id}'
                    )"
                >
                    ↻ Resume Exam
                </button>`
                : `
                <button
                    class="startBtn"
                    onclick="startExam('${exam.id}')"
                >
                    ▶ Start Exam
                </button>`
            }

        </div>`;

    });

}

//==========================================
// Start Exam
//==========================================

function startExam(examId) {

    sessionStorage.setItem(
        "selectedExam",
        examId
    );

    window.location.href =
    "instructions.html";

}

//==========================================
// RESUME PAUSED EXAM
//==========================================

function resumeExam(
    attemptId,
    examId
) {

    sessionStorage.setItem(
        "attemptId",
        attemptId
    );

    sessionStorage.setItem(
        "selectedExam",
        examId
    );

    // This is NOT a new attempt
    sessionStorage.removeItem(
        "attemptStartedFresh"
    );

    // Open the existing attempt
    window.location.href =
        "exam.html";
}

//==========================================
// Search
//==========================================

searchExam.addEventListener(

"keyup",

e => {

loadExams(e.target.value);

}

);

//==========================================
// Initial Load
//==========================================

loadExams();