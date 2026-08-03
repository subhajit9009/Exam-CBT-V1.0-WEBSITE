/* ==========================================
   ExamVerse Reset Password
   Created by Subhajit Paul
========================================== */

const form = document.getElementById("resetForm");

form.addEventListener("submit", resetPassword);

async function resetPassword(e) {

    e.preventDefault();

    const password =
        document.getElementById("password").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    // ==========================
    // Password Validation
    // ==========================

    const passwordPattern =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=-]).{8,}$/;

    if (!passwordPattern.test(password)) {

        alert(
            "Password must contain:\n\n" +
            "• Minimum 8 characters\n" +
            "• One uppercase letter\n" +
            "• One lowercase letter\n" +
            "• One number\n" +
            "• One special character"
        );

        return;

    }

    if (password !== confirmPassword) {

        alert("Passwords do not match.");

        return;

    }

    // ==========================
    // Update Password
    // ==========================

    const { error } =
        await supabaseClient.auth.updateUser({

            password: password

        });

    if (error) {

        alert(error.message);

        return;

    }

    alert("Password updated successfully!");

    await supabaseClient.auth.signOut();

    window.location.href = "login.html";

}