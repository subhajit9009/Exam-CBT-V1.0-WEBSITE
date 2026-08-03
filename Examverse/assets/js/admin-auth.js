/* ==========================================
   ExamVerse Admin Authentication
   Created by Subhajit Paul
========================================== */

(async () => {

    // ==========================
    // Check Logged In User
    // ==========================

    const {

        data: { user },

        error

    } = await supabaseClient.auth.getUser();

    if (error || !user) {

        window.location.href = "login.html";

        return;

    }

    // ==========================
    // Check Admin Table
    // ==========================

    const { data: admin } =

    await supabaseClient

    .from("admins")

    .select("role")

    .eq("id", user.id)

    .maybeSingle();

    if (!admin) {

        alert("Access Denied!");

        window.location.href = "dashboard.html";

        return;

    }

})();