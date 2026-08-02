/* ==========================================
   ExamVerse Dashboard
   Created by Subhajit Paul
========================================== */

// ======================================
// Check Login
// ======================================

const user = Storage.getCurrentUser();

if (!user) {

    alert("Please login first.");

    window.location.href = "login.html";

}

// ======================================
// Load User Information
// ======================================

document.getElementById("userName").textContent = user.fullName;

document.getElementById("level").textContent = user.level;

document.getElementById("rank").textContent = user.stats.rank;

document.getElementById("tests").textContent = user.stats.totalTests;

document.getElementById("highest").textContent =
user.stats.highestScore + "%";

document.getElementById("average").textContent =
user.stats.averageScore + "%";

document.getElementById("accuracy").textContent =
user.stats.accuracy + "%";

// ======================================
// Preferred Exams
// ======================================

document.getElementById("exam1").textContent = user.exams[0];

document.getElementById("exam2").textContent = user.exams[1];

document.getElementById("exam3").textContent = user.exams[2];

// ======================================
// Previous Tests
// ======================================

const history = document.getElementById("history");

history.innerHTML = "";

if (user.tests.length === 0) {

    history.innerHTML =

    `
    <tr>

        <td colspan="4">

            No tests attempted yet.

        </td>

    </tr>

    `;

}

else{

    user.tests.forEach(test=>{

        history.innerHTML +=

        `
        <tr>

            <td>${test.date}</td>

            <td>${test.exam}</td>

            <td>${test.score}%</td>

            <td>${test.accuracy}%</td>

        </tr>

        `;

    });

}

// ======================================
// Logout
// ======================================

document.getElementById("logoutBtn")

.addEventListener("click",()=>{

    if(confirm("Logout from ExamVerse?")){

        Storage.logout();

        window.location.href="login.html";

    }

});

// ======================================
// Take New Test
// ======================================

document.getElementById("takeTest")

.addEventListener("click",()=>{

    window.location.href="exam-selection.html";

});

document.getElementById("newTestBtn")

.addEventListener("click",()=>{

    window.location.href="exam-selection.html";

});
