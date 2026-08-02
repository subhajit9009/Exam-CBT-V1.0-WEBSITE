/* ==========================================
   ExamVerse Registration V2
   Created by Subhajit Paul
========================================== */

const form = document.getElementById("registerForm");

if (form) {
    form.addEventListener("submit", registerUser);
}

async function registerUser(e) {

    e.preventDefault();

    // ==========================
    // Get Form Values
    // ==========================

    const firstName = document.getElementById("firstName").value.trim();

    const middleName = document.getElementById("middleName").value.trim();

    const lastName = document.getElementById("lastName").value.trim();

    const age = parseInt(document.getElementById("age").value);

    const phone = document.getElementById("phone").value.trim();

    const email = document.getElementById("email").value.trim().toLowerCase();

    const password = document.getElementById("password").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    const gender = document.getElementById("gender").value;

    const exam1 = document.getElementById("exam1").value;

    const exam2 = document.getElementById("exam2").value;

    const exam3 = document.getElementById("exam3").value;

        // ==========================
    // Validation
    // ==========================

    if(firstName.length < 2){

        alert("First name must contain at least 2 characters.");

        return;

    }

    if(lastName.length < 2){

        alert("Last name must contain at least 2 characters.");

        return;

    }

    if(isNaN(age) || age < 10 || age > 80){

        alert("Enter a valid age.");

        return;

    }

    if(!/^[6-9]\d{9}$/.test(phone)){

        alert("Enter a valid Indian mobile number.");

        return;

    }

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){

        alert("Enter a valid Email Address.");

        return;

    }

    const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=-]).{8,}$/;

    if(!passwordPattern.test(password)){

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

    if(password !== confirmPassword){

        alert("Passwords do not match.");

        return;

    }

    if(gender === ""){

        alert("Select Gender.");

        return;

    }

    if(
        exam1 === "" ||
        exam2 === "" ||
        exam3 === ""
    ){

        alert("Select all exam preferences.");

        return;

    }

    if(
        exam1 === exam2 ||
        exam1 === exam3 ||
        exam2 === exam3
    ){

        alert("Exam preferences must be different.");

        return;

    }

        // ==========================
    // Check Duplicate Phone
    // ==========================

    const { data: phoneExists } =
    await supabaseClient

    .from("profiles")

    .select("phone")

    .eq("phone", phone)

    .maybeSingle();

    if(phoneExists){

        alert("Phone Number already registered.");

        return;

    }

        // ==========================
    // Create Supabase Auth Account
    // ==========================

    const { data: authData, error: authError } =
    await supabaseClient.auth.signUp({

        email: email,

        password: password,

        options: {

            emailRedirectTo:
            "https://streams-regularly-pursue-schemes.trycloudflare.com/Examverse/login.html"

        }

    });

    if(authError){

        alert(authError.message);

        return;

    }

        // ==========================
    // Save Profile
    // ==========================

    const { error: profileError } =
    await supabaseClient

    .from("profiles")

    .insert([{

        id: authData.user.id,

        phone: phone,

        email: email,

        first_name: firstName,

        middle_name: middleName,

        last_name: lastName,

        age: age,

        gender: gender,

        exam1: exam1,

        exam2: exam2,

        exam3: exam3

    }]);

    if(profileError){

        alert(profileError.message);

        return;

    }

        // ==========================
    // Registration Success
    // ==========================

    form.reset();

    alert(
        "Registration Successful!\n\n" +
        "A verification email has been sent.\n\n" +
        "Please verify your email before logging in."
    );

    window.location.href = "login.html";

}

