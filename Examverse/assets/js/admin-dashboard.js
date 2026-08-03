/* ==========================================
   ExamVerse Admin Dashboard
   Created by Subhajit Paul
========================================== */

loadDashboard();

// ===============================
// Main
// ===============================

async function loadDashboard() {

    await loadCounts();

    await loadAdminName();

}

// ===============================
// Load Dashboard Counts
// ===============================

async function loadCounts() {

    // Users
    const { count: userCount } =
    await supabaseClient
    .from("profiles")
    .select("*", {
        count: "exact",
        head: true
    });

    document.getElementById("totalUsers").textContent =
        userCount ?? 0;

    // Exams
    const { count: examCount } =
    await supabaseClient
    .from("exams")
    .select("*", {
        count: "exact",
        head: true
    });

    document.getElementById("totalExams").textContent =
        examCount ?? 0;

    // Questions
    const { count: questionCount } =
    await supabaseClient
    .from("questions")
    .select("*", {
        count: "exact",
        head: true
    });

    document.getElementById("totalQuestions").textContent =
        questionCount ?? 0;

    // Results
    const { count: resultCount } =
    await supabaseClient
    .from("results")
    .select("*", {
        count: "exact",
        head: true
    });

    document.getElementById("totalResults").textContent =
        resultCount ?? 0;

}

// ===============================
// Welcome Admin
// ===============================

async function loadAdminName() {

    const {

        data: { user }

    } = await supabaseClient.auth.getUser();

    if (!user) return;

    const { data: admin } =
    await supabaseClient

    .from("admins")

    .select("full_name")

    .eq("id", user.id)

    .maybeSingle();

    if (admin) {

        document.querySelector("header h1").textContent =
            "Welcome, " + admin.full_name + " 👑";

    }

}

// ===============================
// Logout
// ===============================

document

.getElementById("logoutBtn")

.addEventListener("click", logoutAdmin);

async function logoutAdmin() {

    if (!confirm("Logout from Admin Panel?"))

        return;

    await supabaseClient.auth.signOut();

    localStorage.removeItem("currentUser");

    window.location.href = "login.html";

}