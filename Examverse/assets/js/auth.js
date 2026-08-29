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
            "Please complete the reCAPTCHA verification before registering."
        );

        return;
    }


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

        showPopup(
    "warning",
    "Invalid First Name",
    "First name must contain at least 2 characters."
);

        return;

    }


    if (lastName.length < 2) {

        showPopup(
    "warning",
    "Invalid Last Name",
    "Last name must contain at least 2 characters."
);

        return;

    }


    if (
        isNaN(age) ||
        age < 10 ||
        age > 80
    ) {

        showPopup(
    "warning",
    "Invalid Age",
    "Please enter a valid age between 10 and 80."
);

        return;

    }


    if (
        !/^[6-9]\d{9}$/.test(phone)
    ) {

        showPopup(
    "warning",
    "Invalid Phone Number",
    "Please enter a valid 10-digit Indian mobile number."
);

        return;

    }


    /* EMAIL */

    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {

        showPopup(
    "warning",
    "Invalid Email Address",
    "Please enter a valid email address."
);

        return;

    }


    /* PASSWORD */

    const passwordPattern =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=-]).{8,}$/;


    if (
        !passwordPattern.test(password)
    ) {

        showPopup(
    "warning",
    "Weak Password",
    "Your password must contain:\n\n" +
    "• Minimum 8 characters\n" +
    "• One uppercase letter\n" +
    "• One lowercase letter\n" +
    "• One number\n" +
    "• One special character"
);

        return;

    }


    if (
        password !== confirmPassword
    ) {

        showPopup(
    "warning",
    "Passwords Don't Match",
    "The passwords you entered do not match."
);

        return;

    }


    if (gender === "") {

        showPopup(
    "warning",
    "Gender Required",
    "Please select your gender."
);

        return;

    }


    if (
        exam1 === "" ||
        exam2 === "" ||
        exam3 === ""
    ) {

        showPopup(
    "warning",
    "Exam Preferences Required",
    "Please select all three exam preferences."
);

        return;

    }


    if (
        exam1 === exam2 ||
        exam1 === exam3 ||
        exam2 === exam3
    ) {

        showPopup(
    "warning",
    "Duplicate Exam Preference",
    "Your three exam preferences must be different."
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

        showPopup(
    "error",
    "Unable to Check Phone",
    phoneCheckError.message
);

        return;

    }


    if (phoneExists) {

        showPopup(
    "error",
    "Phone Already Registered",
    "This phone number is already registered with ExamVerse."
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
    "https://subhajit9009.github.io/Exam-CBT-V1.0-WEBSITE/Examverse/email-verified.html"

                }

            });


    /* ======================================
       AUTH ERROR
    ====================================== */

    if (authError) {

        hideRegisterProcessing();

        showPopup(
    "error",
    "Registration Failed",
    authError.message
);

        return;

    }


    /* ======================================
       CHECK AUTH USER
    ====================================== */

    if (!authData || !authData.user) {

        hideRegisterProcessing();

        showPopup(
    "error",
    "Registration Incomplete",
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

        showPopup(
    "error",
    "Profile Creation Failed",
    profileError.message
);

        return;

    }


    /* ==========================================
   REGISTRATION SUCCESS
========================================== */

form.reset();

hideRegisterProcessing();

showPopup(
    "success",
    "Registration Successful! 🎉",
    "A verification email has been sent.\n\n" +
    "Please verify your email before logging in.",
    {
        buttonText: "Continue",
        onClose: function () {

            window.location.href =
                "login.html";

        }
    }
);

}