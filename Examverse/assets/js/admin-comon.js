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