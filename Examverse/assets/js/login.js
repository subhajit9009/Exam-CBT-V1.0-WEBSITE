/* ==========================================
   ExamVerse Login System V2
   Created by Subhajit Paul
========================================== */

const loginForm = document.getElementById("loginForm");

// =====================================
// Already Logged In
// =====================================

if (Storage.getCurrentUser()) {

    window.location.href = "dashboard.html";

}

// =====================================
// Login
// =====================================

loginForm.addEventListener("submit", loginUser);

async function loginUser(e) {

    e.preventDefault();

    const phone = document.getElementById("phone").value.trim();

    const password = document.getElementById("password").value;

    const remember =
        document.getElementById("remember").checked;

    // ==========================
    // Find Profile
    // ==========================

    const { data: profile, error: profileError } =
    await supabaseClient

    .from("profiles")

    .select("*")

    .eq("phone", phone)

    .maybeSingle();

    console.log("Profile:", profile);
console.log("Profile Error:", profileError);

    if (profileError || !profile) {

        alert("Phone Number is not registered.");

        return;

    }

    // ==========================
    // Login using Supabase
    // ==========================

    const { data, error } =
    await supabaseClient.auth.signInWithPassword({

        email: profile.email,

        password: password

    });

    if (error) {

        alert("Invalid Phone Number or Password.");

        return;

    }

    // ==========================
    // Check Email Verification
    // ==========================

    if (!data.user.email_confirmed_at) {

        alert("Please verify your email before login.");

        await supabaseClient.auth.signOut();

        return;

    }

    // ==========================
    // Dashboard User Object
    // ==========================

    const user = {

        id: data.user.id,
profileId: profile.id,

        firstName: profile.first_name,

        middleName: profile.middle_name,

        lastName: profile.last_name,

        fullName:
            `${profile.first_name} ${profile.middle_name} ${profile.last_name}`
            .replace(/\s+/g, " ")
            .trim(),

        age: profile.age,

        gender: profile.gender,

        phone: profile.phone,

        email: profile.email,

        exams: [

            profile.exam1,

            profile.exam2,

            profile.exam3

        ],

        level: "Beginner",

        stats: {

            totalTests: 0,

            highestScore: 0,

            averageScore: 0,

            accuracy: 0,

            rank: "N/A"

        },

        tests: [],

        bookmarks: [],

        settings: {

            theme: "light",

            language: "English",

            fontSize: "medium"

        },

        lastLogin: new Date().toLocaleString()

    };

    // ==========================
    // Login
    // ==========================

    Storage.login(user);

    // ==========================
    // Remember Me
    // ==========================

    if (remember) {

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

    alert("Welcome Back, " + user.firstName + "!");

// ==========================
// Check Admin
// ==========================

const { data: admin, error: adminError } =
await supabaseClient
.from("admins")
.select("*")
.eq("id", data.user.id)
.maybeSingle();

console.log("Logged User ID:", data.user.id);
console.log("Admin Data:", admin);
console.log("Admin Error:", adminError);

if (admin) {

    window.location.href = "admin-dashboard.html";

} else {

    window.location.href = "dashboard.html";

}

}

// =====================================
// Remember User
// =====================================

window.addEventListener("DOMContentLoaded", () => {

    const rememberedPhone =
        localStorage.getItem("rememberUser");

    if (rememberedPhone) {

        document.getElementById("phone").value =
            rememberedPhone;

        document.getElementById("remember").checked = true;

    }

});