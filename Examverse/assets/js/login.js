/* ==========================================
   ExamVerse Login System V2
   Created by Subhajit Paul
========================================== */

const loginForm =
    document.getElementById("loginForm");


// =====================================
// Already Logged In
// =====================================

// =====================================
// CHECK EXISTING SUPABASE SESSION
// =====================================

async function checkExistingSession() {

    try {

        const {
            data,
            error
        } =
        await supabaseClient
            .auth
            .getUser();


        // No active session
        if (
            error ||
            !data?.user
        ) {

            return;

        }


        const loggedUser =
            data.user;


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


                        alert(
                            "Unable to recover your account.\n\n" +
                            recoveryError.message
                        );


                        return;

                    }


                    alert(
                        "Welcome back! 🎉\n\n" +
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


                alert(
                    "Your account remains scheduled for deletion.\n\n" +
                    "You can recover it by logging in again before the 30-day period expires."
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


                alert(
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

        alert(
            "Phone Number is not registered."
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

        alert(
            "Invalid Phone Number or Password."
        );

        return;

    }


    // ==========================
    // Check Email Verification
    // ==========================

    if (
        !data.user.email_confirmed_at
    ) {

        alert(
            "Please verify your email before login."
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
            confirm(

                "Your ExamVerse account is scheduled for permanent deletion.\n\n" +

                "You have approximately " +
                remainingDays +
                " day(s) remaining to recover it.\n\n" +

                "Do you want to recover your account now?"

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


            alert(
                "Unable to recover your account.\n\n" +
                recoveryError.message
            );


            return;

        }


        // Update local profile
        profile.deletion_scheduled_at =
            null;


        alert(
            "Welcome back! 🎉\n\n" +
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


        alert(
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


    alert(
        "Welcome Back, " +
        user.firstName +
        "!"
    );


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
    // Normal Login
    // ------------------------------------------

    if (
        admin
    ) {

        window.location.href =
            "admin-dashboard.html";

    }

    else {

        window.location.href =
            "dashboard.html";

    }

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