const form = document.getElementById("forgotForm");

form.addEventListener("submit", async function (e) {

    e.preventDefault();

        // ==========================================
    // reCAPTCHA CHECK
    // ==========================================

    if (
        typeof grecaptcha === "undefined" ||
        grecaptcha.getResponse() === ""
    ) {

        showPopup(
            "warning",
            "Verification Required",
            "Please complete the reCAPTCHA verification before recovering your account."
        );

        return;
    }

    const phone = document.getElementById("phone").value.trim();

    // Find profile by phone

    const { data: profile, error } =
        await supabaseClient
            .from("profiles")
            .select("email")
            .eq("phone", phone)
            .maybeSingle();

    if (error || !profile) {

        showPopup(
    "error",
    "Phone Number Not Found",
    "No ExamVerse account was found with this phone number."
);

        return;

    }

    // Send reset email

    const { error: resetError } =
        await supabaseClient.auth.resetPasswordForEmail(

            profile.email,

            {

                redirectTo:
                "https://subhajit9009.github.io/Exam-CBT-V1.0-WEBSITE/Examverse/reset-password.html"

            }

        );

    if (resetError) {

        showPopup(
    "error",
    "Password Reset Failed",
    resetError.message
);

        return;

    }

    showPopup(
    "success",
    "Reset Link Sent",
    "A password reset link has been sent to your registered email address."
);

});