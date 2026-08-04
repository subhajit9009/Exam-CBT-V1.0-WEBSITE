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

const examFilter =
document.getElementById("filterExam").value;

const difficultyFilter =
document.getElementById("filterDifficulty").value;

const search =
document.getElementById("searchQuestion")
.value
.toLowerCase();

let query =
supabaseClient

.from("questions")

.select(`

*,

exams(exam_name)

`);

if(examFilter){

query =
query.eq("exam_id",examFilter);

}

if(difficultyFilter){

query =
query.eq("difficulty",difficultyFilter);

}

const { data,error } =

await query.order("question_no");


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

if(

search &&

!q.question.toLowerCase().includes(search)

){

return;

}

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

<button onclick="previewQuestion('${q.id}')">

👁

</button>

<button onclick="editQuestion('${q.id}')">

✏

</button>

<button onclick="deleteQuestion('${q.id}')">

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

let response;

if(window.currentQuestionId){

response = await supabaseClient

.from("questions")

.update({

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

})

.eq("id",window.currentQuestionId);

}

else{

response = await supabaseClient

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

}

const { error } = response;

if(error){

console.error(error);

alert(error.message);

return;

}

alert("Question Saved Successfully ✅");

window.currentQuestionId = null;

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

//=========================
// Search
//=========================

document

.getElementById("searchQuestion")

.addEventListener(

"keyup",

loadQuestions

);

//=========================
// Exam Filter
//=========================

document

.getElementById("filterExam")

.addEventListener(

"change",

loadQuestions

);

//=========================
// Difficulty Filter
//=========================

document

.getElementById("filterDifficulty")

.addEventListener(

"change",

loadQuestions

);

//=========================
// Edit Question
//=========================

async function editQuestion(id){

const { data,error } =

await supabaseClient

.from("questions")

.select("*")

.eq("id",id)

.single();

if(error){

alert(error.message);

return;

}

document.getElementById("examSelect").value =
data.exam_id;

document.getElementById("questionNo").value =
data.question_no;

document.getElementById("subject").value =
data.subject;

document.getElementById("question").value =
data.question;

document.getElementById("optionA").value =
data.option_a;

document.getElementById("optionB").value =
data.option_b;

document.getElementById("optionC").value =
data.option_c;

document.getElementById("optionD").value =
data.option_d;

document.getElementById("correctAnswer").value =
data.correct_answer;

document.getElementById("explanation").value =
data.explanation;

document.getElementById("marks").value =
data.marks;

document.getElementById("negativeMarks").value =
data.negative_marks;

document.getElementById("difficulty").value =
data.difficulty;

document.getElementById("questionType").value =
data.question_type;

window.currentQuestionId = id;

questionModal.style.display = "flex";

}

//=========================
// Preview Question
//=========================

async function previewQuestion(id){

const { data,error } =

await supabaseClient

.from("questions")

.select("*")

.eq("id",id)

.single();

if(error){

alert(error.message);

return;

}

alert(

`Question

${data.question}

----------------

A. ${data.option_a}

B. ${data.option_b}

C. ${data.option_c}

D. ${data.option_d}

Correct Answer : ${data.correct_answer}`

);

}

//=========================
// Delete Question
//=========================

async function deleteQuestion(id){

const ok = confirm(

"Delete this Question?"

);

if(!ok) return;

const { error } =

await supabaseClient

.from("questions")

.delete()

.eq("id",id);

if(error){

alert(error.message);

return;

}

alert("Question Deleted Successfully ✅");

loadQuestions();

}