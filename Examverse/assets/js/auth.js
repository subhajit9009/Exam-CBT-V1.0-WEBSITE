/* ==========================================
   ExamVerse Registration V2
   Created by Subhajit Paul
========================================== */

const form =
    document.getElementById("registerForm");


if (form) {

    form.addEventListener(
        "submit",
        registerUser
    );

}


/* ==========================================
   SHOW REGISTERING SCREEN
========================================== */

function showRegisterProcessing() {

    const processing =
        document.getElementById(
            "registerProcessing"
        );

    const button =
        document.querySelector(
            ".register-btn"
        );


    if (processing) {

        processing.style.display =
            "flex";

    }


    if (button) {

        button.disabled = true;

        button.style.pointerEvents =
            "none";

    }

}


/* ==========================================
   HIDE REGISTERING SCREEN
========================================== */

function hideRegisterProcessing() {

    const processing =
        document.getElementById(
            "registerProcessing"
        );

    const button =
        document.querySelector(
            ".register-btn"
        );


    if (processing) {

        processing.style.display =
            "none";

    }


    if (button) {

        button.disabled = false;

        button.style.pointerEvents =
            "";

    }

}


/* ==========================================
   REGISTER USER
========================================== */

async function registerUser(e) {

    e.preventDefault();


    /* ======================================
       GET FORM VALUES
    ====================================== */

    const firstName =
        document
            .getElementById("firstName")
            .value
            .trim();


    const middleName =
        document
            .getElementById("middleName")
            .value
            .trim();


    const lastName =
        document
            .getElementById("lastName")
            .value
            .trim();


    const age =
        parseInt(
            document
                .getElementById("age")
                .value
        );


    const phone =
        document
            .getElementById("phone")
            .value
            .trim();


    const email =
        document
            .getElementById("email")
            .value
            .trim()
            .toLowerCase();


    const password =
        document
            .getElementById("password")
            .value;


    const confirmPassword =
        document
            .getElementById("confirmPassword")
            .value;


    const gender =
        document
            .getElementById("gender")
            .value;


    const exam1 =
        document
            .getElementById("exam1")
            .value;


    const exam2 =
        document
            .getElementById("exam2")
            .value;


    const exam3 =
        document
            .getElementById("exam3")
            .value;


    /* ======================================
       VALIDATION
    ====================================== */

    if (firstName.length < 2) {

        alert(
            "First name must contain at least 2 characters."
        );

        return;

    }


    if (lastName.length < 2) {

        alert(
            "Last name must contain at least 2 characters."
        );

        return;

    }


    if (
        isNaN(age) ||
        age < 10 ||
        age > 80
    ) {

        alert(
            "Enter a valid age."
        );

        return;

    }


    if (
        !/^[6-9]\d{9}$/.test(phone)
    ) {

        alert(
            "Enter a valid Indian mobile number."
        );

        return;

    }


    /* EMAIL */

    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {

        alert(
            "Enter a valid Email Address."
        );

        return;

    }


    /* PASSWORD */

    const passwordPattern =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=-]).{8,}$/;


    if (
        !passwordPattern.test(password)
    ) {

        alert(

            "Password must contain\n\n" +

            "• Minimum 8 characters\n" +

            "• One uppercase\n" +

            "• One lowercase\n" +

            "• One number\n" +

            "• One special character"

        );

        return;

    }


    if (
        password !== confirmPassword
    ) {

        alert(
            "Passwords do not match."
        );

        return;

    }


    if (gender === "") {

        alert(
            "Select Gender."
        );

        return;

    }


    if (
        exam1 === "" ||
        exam2 === "" ||
        exam3 === ""
    ) {

        alert(
            "Select all exam preferences."
        );

        return;

    }


    if (
        exam1 === exam2 ||
        exam1 === exam3 ||
        exam2 === exam3
    ) {

        alert(
            "Exam preferences must be different."
        );

        return;

    }


    /* ======================================
       CHECK DUPLICATE PHONE
    ====================================== */

    const {
        data: phoneExists,
        error: phoneCheckError
    } =
        await supabaseClient
            .from("profiles")
            .select("phone")
            .eq("phone", phone)
            .maybeSingle();


    if (phoneCheckError) {

        console.error(
            "Phone check error:",
            phoneCheckError
        );

        alert(
            phoneCheckError.message
        );

        return;

    }


    if (phoneExists) {

        alert(
            "Phone Number already registered."
        );

        return;

    }


    /* ======================================
       START REGISTERING ANIMATION
       
       THIS IS THE ONLY PLACE WHERE
       THE ANIMATION STARTS.
    ====================================== */

    showRegisterProcessing();


    /* ======================================
       CREATE SUPABASE AUTH ACCOUNT
    ====================================== */

    const {
        data: authData,
        error: authError
    } =
        await supabaseClient
            .auth
            .signUp({

                email: email,

                password: password,

                options: {

                    emailRedirectTo:
                        "https://subhajit9009.github.io/Exam-CBT-V1.0-WEBSITE/Examverse/login.html"

                }

            });


    /* ======================================
       AUTH ERROR
    ====================================== */

    if (authError) {

        hideRegisterProcessing();

        alert(
            authError.message
        );

        return;

    }


    /* ======================================
       CHECK AUTH USER
    ====================================== */

    if (!authData || !authData.user) {

        hideRegisterProcessing();

        alert(
            "Registration could not be completed. Please try again."
        );

        return;

    }


    /* ======================================
       SAVE PROFILE
    ====================================== */

    const {
        error: profileError
    } =
        await supabaseClient
            .from("profiles")
            .insert([{

                id:
                    authData.user.id,

                phone:
                    phone,

                email:
                    email,

                first_name:
                    firstName,

                middle_name:
                    middleName,

                last_name:
                    lastName,

                age:
                    age,

                gender:
                    gender,

                exam1:
                    exam1,

                exam2:
                    exam2,

                exam3:
                    exam3

            }]);


    /* ======================================
       PROFILE ERROR
    ====================================== */

    if (profileError) {

        hideRegisterProcessing();

        alert(
            profileError.message
        );

        return;

    }


    /* ======================================
       REGISTRATION SUCCESS

       IMPORTANT:
       Keep animation running until
       registration is completely finished.
    ====================================== */

    form.reset();


    /* Stop animation immediately before
       showing the verification popup */

    hideRegisterProcessing();


    alert(

        "Registration Successful!\n\n" +

        "A verification email has been sent.\n\n" +

        "Please verify your email before logging in."

    );


    window.location.href =
        "login.html";

}