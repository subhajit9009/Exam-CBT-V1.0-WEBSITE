const form = document.getElementById("forgotForm");

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const phone = document.getElementById("phone").value.trim();

    // Find profile by phone

    const { data: profile, error } =
        await supabaseClient
            .from("profiles")
            .select("email")
            .eq("phone", phone)
            .maybeSingle();

    if (error || !profile) {

        alert("Phone number not found.");

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

        alert(resetError.message);

        return;

    }

    alert("Password reset link has been sent to your email.");

});