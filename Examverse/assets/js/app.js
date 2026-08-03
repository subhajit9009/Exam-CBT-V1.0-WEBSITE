/* ==========================================
   ExamVerse Landing Page
   Created by Subhajit Paul
========================================== */

const startBtn = document.getElementById("startBtn");

const popup = document.getElementById("privacyPopup");

const accept = document.getElementById("acceptBtn");

const reject = document.getElementById("rejectBtn");

// ==========================================
// Get Started
// ==========================================

startBtn.onclick = () => {

    if (localStorage.getItem("privacyAccepted") === "yes") {

        window.location.href = "login.html";

    }

    else {

        popup.style.display = "flex";

    }

};

// ==========================================
// Accept Privacy
// ==========================================

accept.onclick = () => {

    localStorage.setItem("privacyAccepted", "yes");

    window.location.href = "login.html";

};

// ==========================================
// Reject Privacy
// ==========================================

reject.onclick = () => {

    alert("You must accept the Privacy Policy to continue using ExamVerse.");

};