/* ==========================================
   ExamVerse Exam Management
   Created by Subhajit Paul
========================================== */

const createExamBtn = document.getElementById("createExamBtn");

createExamBtn.addEventListener("click", openExamModal);

function openExamModal(){

    document.getElementById("examModal").style.display="flex";

}

function closeExamModal(){

    document.getElementById("examModal").style.display="none";

}

// ==========================
// Logout
// ==========================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        if (confirm("Are you sure you want to logout?")) {

            await supabaseClient.auth.signOut();

            localStorage.removeItem("currentUserId");
            localStorage.removeItem("rememberUser");

            window.location.href = "login.html";

        }

    });

}

//=========================
// Save Exam
//=========================

const saveExamBtn =
document.getElementById("saveExam");

saveExamBtn.addEventListener(
"click",
saveExam
);

async function saveExam(){

const examName =
document.getElementById("examName").value.trim();

const examCode =
document.getElementById("examCode").value.trim();

const category =
document.getElementById("examCategory").value;

const duration =
Number(document.getElementById("examDuration").value);

const totalQuestions =
Number(document.getElementById("totalQuestions").value);

const totalMarks =
Number(document.getElementById("totalMarks").value);

const positiveMarks =
Number(document.getElementById("positiveMarks").value);

const negativeMarks =
Number(document.getElementById("negativeMarks").value);

const passingMarks =
Number(document.getElementById("passingMarks").value);

const description =
document.getElementById("examDescription").value.trim();

const status =
document.getElementById("examStatus").value;

if(!examName || !examCode){

    alert("Please fill Exam Name and Exam Code.");

    return;

}

let response;

// ==========================
// EDIT EXAM
// ==========================

if(window.currentExamId){

response = await supabaseClient

.from("exams")

.update({

exam_name:examName,

exam_code:examCode,

category:category,

duration:duration,

total_questions:totalQuestions,

total_marks:totalMarks,

positive_marks:positiveMarks,

negative_marks:negativeMarks,

passing_marks:passingMarks,

description:description,

status:status

})

.eq("id",window.currentExamId);

}

// ==========================
// CREATE EXAM
// ==========================

else{

response = await supabaseClient

.from("exams")

.insert({

exam_name:examName,

exam_code:examCode,

category:category,

duration:duration,

total_questions:totalQuestions,

total_marks:totalMarks,

positive_marks:positiveMarks,

negative_marks:negativeMarks,

passing_marks:passingMarks,

description:description,

status:status

});

}

const { error } = response;

if(error){

alert(error.message);

return;

}

alert("Exam Saved Successfully ✅");

window.currentExamId = null;

closeExamModal();

loadExams();

}


//=========================
// Load Exams
//=========================

async function loadExams(){

const examBody =
document.getElementById("examBody");

const { data, error } =

await supabaseClient

.from("exams")

.select("*")

.order("created_at",{ascending:false});

if(error){

console.log(error);

return;

}

examBody.innerHTML="";

if(data.length===0){

examBody.innerHTML=

`<tr>

<td colspan="5">

No Exams Created Yet

</td>

</tr>`;

return;

}

data.forEach(exam=>{

examBody.innerHTML +=

`

<tr>

<td>${exam.exam_name}</td>

<td>${exam.category}</td>

<td>${exam.status}</td>

<td>${exam.total_questions}</td>

<td>

<button onclick="editExam('${exam.id}')">

✏

</button>

<button onclick="deleteExam('${exam.id}')">

🗑

</button>

</td>

</tr>

`;

});

}

loadExams();

//=========================
// Edit Exam
//=========================

async function editExam(id){

const { data,error } =

await supabaseClient

.from("exams")

.select("*")

.eq("id",id)

.single();

if(error){

alert(error.message);

return;

}

document.getElementById("examName").value =
data.exam_name;

document.getElementById("examCode").value =
data.exam_code;

document.getElementById("examCategory").value =
data.category;

document.getElementById("examDuration").value =
data.duration;

document.getElementById("totalQuestions").value =
data.total_questions;

document.getElementById("totalMarks").value =
data.total_marks;

document.getElementById("positiveMarks").value =
data.positive_marks;

document.getElementById("negativeMarks").value =
data.negative_marks;

document.getElementById("passingMarks").value =
data.passing_marks;

document.getElementById("examDescription").value =
data.description;

document.getElementById("examStatus").value =
data.status;

questionModal.style.display="flex";

window.currentExamId=id;

}