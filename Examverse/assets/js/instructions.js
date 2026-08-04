/* ==========================================
   ExamVerse Instructions
   Created by Subhajit Paul
========================================== */

const examDetails =
document.getElementById("examDetails");

const agree =
document.getElementById("agree");

const startExamBtn =
document.getElementById("startExamBtn");

let selectedExam = null;

//==========================================
// Load Exam Details
//==========================================

async function loadExam(){

const examId =
sessionStorage.getItem("selectedExam");

if(!examId){

alert("No Exam Selected.");

window.location.href="exam-list.html";

return;

}

const { data,error } =

await supabaseClient

.from("exams")

.select("*")

.eq("id",examId)

.single();

if(error){

console.error(error);

alert("Exam not found.");

window.location.href="exam-list.html";

return;

}

selectedExam = data;

examDetails.innerHTML = `

<div class="examInfo">

<div class="infoCard">

<h3>Exam Name</h3>

<p>${data.exam_name}</p>

</div>

<div class="infoCard">

<h3>Category</h3>

<p>${data.category}</p>

</div>

<div class="infoCard">

<h3>Total Questions</h3>

<p>${data.total_questions}</p>

</div>

<div class="infoCard">

<h3>Duration</h3>

<p>${data.duration} Minutes</p>

</div>

<div class="infoCard">

<h3>Total Marks</h3>

<p>${data.total_marks}</p>

</div>

<div class="infoCard">

<h3>Positive Marks</h3>

<p>+${data.positive_marks}</p>

</div>

<div class="infoCard">

<h3>Negative Marks</h3>

<p>${data.negative_marks}</p>

</div>

<div class="infoCard">

<h3>Passing Marks</h3>

<p>${data.passing_marks}</p>

</div>

</div>

`;

}

//==========================================
// Enable Button
//==========================================

agree.addEventListener("change",()=>{

startExamBtn.disabled = !agree.checked;

});

//==========================================
// Start Exam
//==========================================

startExamBtn.addEventListener("click",startExam);

async function startExam(){

const currentUser =

Storage.getCurrentUser();

const { data,error } =

await supabaseClient

.from("exam_attempts")

.insert({

user_id:currentUser.id,

exam_id:selectedExam.id,

total_questions:selectedExam.total_questions,

status:"In Progress"

})

.select()

.single();

if(error){

console.error(error);

alert(error.message);

return;

}

sessionStorage.setItem(

"attemptId",

data.id

);

sessionStorage.setItem(

"examStartTime",

new Date().toISOString()

);

window.location.href="exam.html";

}

//==========================================
// Initial Load
//==========================================

loadExam();