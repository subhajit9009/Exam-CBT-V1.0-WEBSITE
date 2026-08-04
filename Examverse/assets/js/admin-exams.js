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