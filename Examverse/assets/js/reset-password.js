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

        showPopup(
            "warning",
            "Invalid Password",
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

        showPopup(
            "warning",
            "Passwords Don't Match",
            "The passwords you entered do not match."
        );

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

        showPopup(
            "error",
            "Password Update Failed",
            error.message
        );

        return;

    }


    showPopup(
        "success",
        "Password Updated Successfully!",
        "Your password has been updated successfully.\n\n" +
        "You will now be signed out and redirected to the login page.",
        {
            buttonText: "Continue",
            onClose: async function () {

                await supabaseClient.auth.signOut();

                window.location.href =
                    "login.html";

            }
        }
    );

}