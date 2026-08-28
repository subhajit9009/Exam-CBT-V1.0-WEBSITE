/* ==========================================
   ExamVerse Login System V2
   Created by Subhajit Paul
========================================== */

const loginForm =
    document.getElementById("loginForm");

    /* =========================================================
   SESSION CHECKING UI
========================================================= */

let sessionCheckFinished = false;

let sessionCheckingTimer = null;


/* =========================================================
   SHOW SESSION CHECKING SCREEN
========================================================= */

function showSessionChecking() {

    const loginProcessing =
        document.getElementById("loginProcessing");

    const processingTitle =
        document.querySelector(
            ".login-processing-card h2"
        );

    const processingText =
        document.getElementById(
            "loginProcessingText"
        );


    if (processingTitle) {

        processingTitle.textContent =
            "Checking your session...";

    }


    if (processingText) {

        processingText.textContent =
            "Verifying your account";

    }


    if (loginProcessing) {

        loginProcessing.style.display =
            "flex";

    }

}


/* =========================================================
   HIDE SESSION CHECKING SCREEN
========================================================= */

function hideSessionChecking() {

    const loginProcessing =
        document.getElementById("loginProcessing");

    if (loginProcessing) {

        loginProcessing.style.display =
            "none";

    }

}

    /* ==========================================
   HIDE LOGIN PROCESSING SCREEN
========================================== */

function hideLoginProcessing() {

    const loginProcessing =
        document.getElementById("loginProcessing");

    const loginButton =
        document.querySelector(".login-btn");


    if (loginProcessing) {

        loginProcessing.style.display = "none";

    }


    if (loginButton) {

        loginButton.disabled = false;

        loginButton.style.pointerEvents = "";

    }

}

// =====================================
// CHECK EXISTING SUPABASE SESSION
// =====================================

async function checkExistingSession() {

    sessionCheckFinished = false;


    /*
       Give the ExamVerse entrance animation
       time to play first.

       If the backend is still checking after
       the entrance animation, show the
       "Checking your session..." screen.
    */

    sessionCheckingTimer = setTimeout(() => {

        if (!sessionCheckFinished) {

            showSessionChecking();

        }

    }, 3800);


    try {

        const {
            data,
            error
        } =
        await supabaseClient
            .auth
            .getUser();


        if (
    error ||
    !data?.user
) {

    sessionCheckFinished = true;

    clearTimeout(
        sessionCheckingTimer
    );

    hideSessionChecking();

    return;

}


        const loggedUser =
            data.user;

            /* =====================================================
   EXISTING SESSION FOUND
===================================================== */

sessionCheckFinished = true;

clearTimeout(
    sessionCheckingTimer
);


        // ==========================================
        // CHECK ACCOUNT DELETION STATUS
        // ==========================================

        const {
            data: profile,
            error: profileError
        } =
        await supabaseClient

            .from("profiles")

            .select(
                "deletion_scheduled_at"
            )

            .eq(
                "id",
                loggedUser.id
            )

            .maybeSingle();


        if (profileError) {

            console.error(
                "Existing session profile check error:",
                profileError
            );

            return;

        }


        // ==========================================
        // ACCOUNT IS SCHEDULED FOR DELETION
        // ==========================================

        if (
            profile?.deletion_scheduled_at
        ) {

            const scheduledDate =
                new Date(
                    profile.deletion_scheduled_at
                );


            const now =
                new Date();


            // ======================================
            // RECOVERY PERIOD IS STILL ACTIVE
            // ======================================

            if (
                scheduledDate > now
            ) {

                const remainingMilliseconds =
                    scheduledDate.getTime() -
                    now.getTime();


                const remainingDays =
                    Math.ceil(
                        remainingMilliseconds /
                        (
                            24 *
                            60 *
                            60 *
                            1000
                        )
                    );


                const recover =
                    confirm(

                        "Your ExamVerse account is scheduled for deletion.\n\n" +

                        "It will be permanently deleted in approximately " +

                        remainingDays +

                        " day(s).\n\n" +

                        "Do you want to recover your account?"

                    );


                // ==================================
                // USER WANTS TO RECOVER
                // ==================================

                if (recover) {

                    const {
                        error:
                            recoveryError
                    } =
                    await supabaseClient

                        .from("profiles")

                        .update({

                            deletion_scheduled_at:
                                null

                        })

                        .eq(
                            "id",
                            loggedUser.id
                        );


                    if (recoveryError) {

                        console.error(
                            "Account recovery error:",
                            recoveryError
                        );


                        showPopup(
    "error",
    "Account Recovery Failed",
    "Unable to recover your account.\n\n" +
    recoveryError.message
);


                        return;

                    }


                    showPopup(
    "success",
    "Welcome Back! 🎉",
    "Your account has been successfully recovered."
);


                    // Now go to dashboard
                    window.location.replace(
                        "dashboard.html"
                    );


                    return;

                }


                // ==================================
                // USER DOES NOT WANT TO RECOVER
                // ==================================

                await supabaseClient
                    .auth
                    .signOut();


                showPopup(
    "warning",
    "Account Still Scheduled",
    "Your account remains scheduled for deletion. You can recover it by logging in again before the 30-day period expires."
);


                return;

            }


            // ======================================
            // RECOVERY PERIOD HAS EXPIRED
            // ======================================

            if (
                scheduledDate <= now
            ) {

                await supabaseClient
                    .auth
                    .signOut();


                showPopup(
    "error",
    "Recovery Period Expired",
    "Your account recovery period has expired."
);


                return;

            }

        }


        // ==========================================
        // NORMAL ACTIVE ACCOUNT
        // ==========================================

        window.location.replace(
            "dashboard.html"
        );

    }

    catch (error) {

    console.error(
        "Session check error:",
        error
    );

    sessionCheckFinished = true;

    clearTimeout(
        sessionCheckingTimer
    );

    hideSessionChecking();

}

}

checkExistingSession();


// =====================================
// Login
// =====================================

loginForm.addEventListener(
    "submit",
    loginUser
);


async function loginUser(e) {

    e.preventDefault();

        // ==========================================
    // reCAPTCHA CHECK
    // ==========================================

        if (
        window.examVerseCaptchaRequired !== false &&
        (
            typeof grecaptcha === "undefined" ||
            grecaptcha.getResponse() === ""
        )
    ) {

        showPopup(
            "warning",
            "Verification Required",
            "Please complete the reCAPTCHA verification before logging in."
        );

        return;
    }
        /* ==========================================
       SHOW LOGIN PROCESSING SCREEN
    ========================================== */

    const loginProcessing =
        document.getElementById("loginProcessing");

    const loginProcessingText =
        document.getElementById("loginProcessingText");

    const loginButton =
        document.querySelector(".login-btn");


    if (loginProcessing) {

        loginProcessing.style.display = "flex";

    }


    if (loginButton) {

        loginButton.disabled = true;

        loginButton.style.pointerEvents = "none";

    }


    const phone =
        document
            .getElementById("phone")
            .value
            .trim();


    const password =
        document
            .getElementById("password")
            .value;


    const remember =
        document
            .getElementById("remember")
            .checked;


    // ==========================
    // Find Profile
    // ==========================

    const {
        data: profile,
        error: profileError
    } =
    await supabaseClient

        .from("profiles")

        .select("*")

        .eq(
            "phone",
            phone
        )

        .maybeSingle();


    console.log(
        "Profile:",
        profile
    );


    console.log(
        "Profile Error:",
        profileError
    );


    if (
    profileError ||
    !profile
) {

    hideLoginProcessing();

    showPopup(
    "error",
    "Phone Number Not Registered",
    "This phone number is not registered with ExamVerse."
);

    return;
}


    // ==========================
    // Login using Supabase
    // ==========================

    const {
        data,
        error
    } =
    await supabaseClient.auth
        .signInWithPassword({

            email:
                profile.email,

            password:
                password

        });


    if (error) {

    hideLoginProcessing();

    showPopup(
    "error",
    "Login Failed",
    "Invalid phone number or password."
);

    return;

}


    // ==========================
    // Check Email Verification
    // ==========================

    if (
    !data.user.email_confirmed_at
) {

    hideLoginProcessing();

    showPopup(
    "warning",
    "Email Verification Required",
    "Please verify your email before logging in."
);

    await supabaseClient
        .auth
        .signOut();

    return;

}


    // =====================================================
// ACCOUNT DELETION / RECOVERY CHECK
// =====================================================

const deletionScheduledAt =
    profile.deletion_scheduled_at;


// ==========================================
// ACCOUNT IS SCHEDULED FOR DELETION
// ==========================================

if (deletionScheduledAt) {

    const deletionDate =
        new Date(
            deletionScheduledAt
        );

    const now =
        new Date();


    // ==========================================
    // RECOVERY PERIOD STILL ACTIVE
    // ==========================================

    if (deletionDate > now) {

        const remainingMilliseconds =
            deletionDate.getTime() -
            now.getTime();


        const remainingDays =
            Math.ceil(
                remainingMilliseconds /
                (
                    24 *
                    60 *
                    60 *
                    1000
                )
            );


        const recoverAccount =
    await showConfirm(
        "Recover Your Account?",
        "Your ExamVerse account is scheduled for permanent deletion.\n\n" +
        "You have approximately " +
        remainingDays +
        " day(s) remaining to recover it.",
        null,
        {
            confirmText: "Recover Account",
            cancelText: "Keep Deletion"
        }
    );


        // ==========================================
        // USER DOES NOT RECOVER
        // ==========================================

        if (!recoverAccount) {

            await supabaseClient
                .auth
                .signOut();


            alert(
                "Your account remains scheduled for deletion."
            );


            return;

        }


        // ==========================================
        // USER RECOVERS ACCOUNT
        // ==========================================

        const {
            error: recoveryError
        } =
        await supabaseClient

            .from("profiles")

            .update({

                deletion_scheduled_at: null

            })

            .eq(
                "id",
                profile.id
            );


        if (recoveryError) {

            console.error(
                "Account recovery error:",
                recoveryError
            );


            await supabaseClient
                .auth
                .signOut();


            showPopup(
    "error",
    "Account Recovery Failed",
    "Unable to recover your account.\n\n" +
    recoveryError.message
);


            return;

        }


        // Update local profile
        profile.deletion_scheduled_at =
            null;


        showPopup(
    "success",
    "Welcome Back! 🎉",
    "Your account has been successfully recovered."
);

    }


    // ==========================================
    // RECOVERY PERIOD EXPIRED
    // ==========================================

    else {

        await supabaseClient
            .auth
            .signOut();


        showPopup(
    "error",
    "Recovery Period Expired",
    "Your account recovery period has expired."
);


        return;

    }

}


    // =====================================================
    // DASHBOARD USER OBJECT
    // =====================================================

    const user = {

        id:
            data.user.id,

        profileId:
            profile.id,


        firstName:
            profile.first_name,


        middleName:
            profile.middle_name,


        lastName:
            profile.last_name,


        fullName:
            `${profile.first_name} ${profile.middle_name} ${profile.last_name}`
                .replace(/\s+/g, " ")
                .trim(),


        age:
            profile.age,


        gender:
            profile.gender,


        phone:
            profile.phone,


        email:
            profile.email,


        exams: [

            profile.exam1,

            profile.exam2,

            profile.exam3

        ],


        level:
            "Beginner",


        stats: {

            totalTests:
                0,

            highestScore:
                0,

            averageScore:
                0,

            accuracy:
                0,

            rank:
                "N/A"

        },


        tests:
            [],


        bookmarks:
            [],


        settings: {

            theme:
                "light",

            language:
                "English",

            fontSize:
                "medium"

        },


        lastLogin:
            new Date()
                .toLocaleString()

    };


    // ==========================
    // Login
    // ==========================

    Storage.login(
        user
    );


    // ==========================
    // Remember Me
    // ==========================

    if (
        remember
    ) {

        localStorage.setItem(
            "rememberUser",
            phone
        );

    }

    else {

        localStorage.removeItem(
            "rememberUser"
        );

    }

    // ==========================
    // Check Admin
    // ==========================

    const {
        data: admin,
        error: adminError
    } =
    await supabaseClient

        .from("admins")

        .select("*")

        .eq(
            "id",
            data.user.id
        )

        .maybeSingle();


    console.log(
        "Logged User ID:",
        data.user.id
    );


    console.log(
        "Admin Data:",
        admin
    );


    console.log(
        "Admin Error:",
        adminError
    );


    // ==========================
// REDIRECT AFTER LOGIN
// ==========================

// Check whether login came
// from a shared examination link

const examLoginReturnUrl =
    sessionStorage.getItem(
        "examLoginReturnUrl"
    );


// ==========================
// SHOW WELCOME BACK POPUP
// ==========================

showPopup(
    "success",
    "Welcome Back! 👋",
    "Welcome back, " + user.firstName + "!",
    {
        buttonText: "Continue",

        onConfirm: function () {

            // ------------------------------------------
            // Shared Exam Login
            // ------------------------------------------

            if (
                examLoginReturnUrl
            ) {

                sessionStorage.removeItem(
                    "examLoginReturnUrl"
                );

                window.location.href =
                    examLoginReturnUrl;

                return;
            }


            // ------------------------------------------
            // Admin Login
            // ------------------------------------------

            if (
                admin
            ) {

                window.location.href =
                    "admin-dashboard.html";

                return;
            }


            // ------------------------------------------
            // Normal User Login
            // ------------------------------------------

            window.location.href =
                "dashboard.html";

        }
    }
);

}

// =====================================
// Remember User
// =====================================

window.addEventListener(
    "DOMContentLoaded",
    () => {

        const rememberedPhone =
            localStorage.getItem(
                "rememberUser"
            );


        if (
            rememberedPhone
        ) {

            document
                .getElementById("phone")
                .value =
                rememberedPhone;


            document
                .getElementById("remember")
                .checked =
                true;

        }

    }
);