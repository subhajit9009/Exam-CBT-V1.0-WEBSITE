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
    `<div class="loading">
        Loading Exams...
    </div>`;

    let query = supabaseClient

    .from("exams")

    .select("*")

    .eq("status", "Live")

    .order("exam_name");

    const { data, error } = await query;

    if (error) {

        console.error(error);

        examContainer.innerHTML =
        `<div class="loading">
            Failed to load exams.
        </div>`;

        return;

    }

    examContainer.innerHTML = "";

    const exams = data.filter(exam =>
        exam.exam_name
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    if (exams.length === 0) {

        examContainer.innerHTML =
        `<div class="loading">
            No Live Exams Found.
        </div>`;

        return;

    }

    exams.forEach(exam => {

        examContainer.innerHTML += `

<div class="examCard">

<h2>

${exam.exam_name}

</h2>

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

🟢 LIVE

</span>

<button
class="startBtn"
onclick="startExam('${exam.id}')">

▶ Start Exam

</button>

</div>

`;

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