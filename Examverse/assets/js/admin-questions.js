/* ==========================================
   ExamVerse Question Management
   Created by Subhajit Paul
========================================== */

const questionModal =
document.getElementById("questionModal");

const addQuestionBtn =
document.getElementById("addQuestionBtn");

const closeQuestionBtn =
document.getElementById("closeQuestionBtn");

const questionTable =
document.getElementById("questionTable");

const examSelect =
document.getElementById("examSelect");

const filterExam =
document.getElementById("filterExam");

//=========================
// Open Modal
//=========================

addQuestionBtn.onclick = () => {

    questionModal.style.display = "flex";

};

//=========================
// Close Modal
//=========================

closeQuestionBtn.onclick = () => {

    questionModal.style.display = "none";

};

// Close when clicking outside

window.onclick = (e)=>{

    if(e.target===questionModal){

        questionModal.style.display="none";

    }

};

//=========================
// Load Exams
//=========================

async function loadExams(){

const { data, error } =

await supabaseClient

.from("exams")

.select("id,exam_name")

.order("exam_name");

if(error){

console.log(error);

return;

}

examSelect.innerHTML =

'<option value="">Select Exam</option>';

filterExam.innerHTML =

'<option value="">All Exams</option>';

data.forEach(exam=>{

examSelect.innerHTML +=

`<option value="${exam.id}">

${exam.exam_name}

</option>`;

filterExam.innerHTML +=

`<option value="${exam.id}">

${exam.exam_name}

</option>`;

});

}

//=========================
// Load Questions
//=========================

async function loadQuestions(){

const { data, error } =

await supabaseClient

.from("questions")

.select(`

*,

exams(

exam_name

)

`)

.order("question_no");

if(error){

console.log(error);

return;

}

questionTable.innerHTML="";

if(data.length===0){

questionTable.innerHTML=

`<tr>

<td colspan="6">

No Questions Available

</td>

</tr>`;

return;

}

data.forEach((q,index)=>{

questionTable.innerHTML +=

`

<tr>

<td>${index+1}</td>

<td>${q.exams.exam_name}</td>

<td>${q.subject}</td>

<td>

<span class="${q.difficulty.toLowerCase()}">

${q.difficulty}

</span>

</td>

<td>${q.marks}</td>

<td>

<button>

👁

</button>

<button>

✏

</button>

<button>

🗑

</button>

</td>

</tr>

`;

});

}

//=========================
// Initial Load
//=========================

loadExams();

loadQuestions();

//=========================
// Save Question
//=========================

const saveQuestionBtn =
document.getElementById("saveQuestionBtn");

saveQuestionBtn.onclick = saveQuestion;

async function saveQuestion(){

const examId =
document.getElementById("examSelect").value;

const questionNo =
document.getElementById("questionNo").value;

const subject =
document.getElementById("subject").value.trim();

const question =
document.getElementById("question").value.trim();

const optionA =
document.getElementById("optionA").value.trim();

const optionB =
document.getElementById("optionB").value.trim();

const optionC =
document.getElementById("optionC").value.trim();

const optionD =
document.getElementById("optionD").value.trim();

const correctAnswer =
document.getElementById("correctAnswer").value;

const explanation =
document.getElementById("explanation").value.trim();

const marks =
Number(document.getElementById("marks").value);

const negativeMarks =
Number(document.getElementById("negativeMarks").value);

const difficulty =
document.getElementById("difficulty").value;

const questionType =
document.getElementById("questionType").value;

//=========================
// Validation
//=========================

if(
!examId ||
!questionNo ||
!subject ||
!question ||
!optionA ||
!optionB ||
!optionC ||
!optionD ||
!correctAnswer
){

alert("Please fill all required fields.");

return;

}

//=========================
// Save into Supabase
//=========================

const { error } =

await supabaseClient

.from("questions")

.insert({

exam_id:examId,

question_no:questionNo,

subject:subject,

question:question,

option_a:optionA,

option_b:optionB,

option_c:optionC,

option_d:optionD,

correct_answer:correctAnswer,

explanation:explanation,

marks:marks,

negative_marks:negativeMarks,

difficulty:difficulty,

question_type:questionType

});

if(error){

console.error(error);

alert(error.message);

return;

}

alert("Question Saved Successfully ✅");

//=========================
// Reset Form
//=========================

document.getElementById("questionNo").value="";

document.getElementById("subject").value="";

document.getElementById("question").value="";

document.getElementById("optionA").value="";

document.getElementById("optionB").value="";

document.getElementById("optionC").value="";

document.getElementById("optionD").value="";

document.getElementById("correctAnswer").value="";

document.getElementById("explanation").value="";

document.getElementById("marks").value=1;

document.getElementById("negativeMarks").value=0;

document.getElementById("difficulty").value="Easy";

document.getElementById("questionType").value="MCQ";

questionModal.style.display="none";

loadQuestions();

}

