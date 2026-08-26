/* =========================================================
   ExamVerse Settings
   Created by Subhajit Paul
========================================================= */


/* =========================================================
   GLOBAL USER
========================================================= */

let currentUser = null;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeSettings
);


async function initializeSettings() {

    setupSidebar();

    setupAppearance();

    setupProfile();

    setupDataTools();

    setupDeleteAccount();

    await loadAccount();

}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function loadAccount() {

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
            !data ||
            !data.user
        ) {

            window.location.replace(
                "login.html"
            );

            return;

        }


        currentUser = data.user;


        const email =
            document.getElementById(
                "userEmail"
            );


        if (email) {

            email.textContent =
                currentUser.email ||
                "Not available";

        }


        await checkDeletionStatus();


        await loadProfile();

    }

    catch (error) {

        console.error(
            "Settings authentication error:",
            error
        );

        window.location.replace(
            "login.html"
        );

    }

}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    document
        .getElementById(
            "sidebarDashboard"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "dashboard.html";

            }
        );


    document
        .getElementById(
            "sidebarNewTest"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "exam-list.html";

            }
        );


    document
        .getElementById(
            "sidebarPreviousTests"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "previous-tests.html";

            }
        );


    document
        .getElementById(
            "sidebarPerformance"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "performance.html";

            }
        );


    document
        .getElementById(
            "sidebarBookmarks"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "bookmarks.html";

            }
        );


    document
        .getElementById(
            "sidebarSettings"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "settings.html";

            }
        );


}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

    if (
        !confirm(
            "Logout from ExamVerse?"
        )
    ) {

        return;

    }


    try {

        await supabaseClient
            .auth
            .signOut();


        if (
            typeof Storage !==
            "undefined" &&
            typeof Storage.logout ===
            "function"
        ) {

            Storage.logout();

        }


        window.location.replace(
            "login.html"
        );

    }

    catch (error) {

        console.error(
            "Logout error:",
            error
        );

        window.location.replace(
            "login.html"
        );

    }

}


/* =========================================================
   APPEARANCE
========================================================= */

function setupAppearance() {

    const toggle =
        document.getElementById(
            "darkModeToggle"
        );

    const scheduleToggle =
        document.getElementById(
            "darkScheduleToggle"
        );

    const scheduleSettings =
        document.getElementById(
            "darkScheduleSettings"
        );

    const startInput =
        document.getElementById(
            "darkScheduleStart"
        );

    const endInput =
        document.getElementById(
            "darkScheduleEnd"
        );


    /* ==========================================
       LOAD SAVED MANUAL THEME
    ========================================== */

    const savedTheme =
        localStorage.getItem(
            "examverse_theme"
        ) || "light";


    applyTheme(
        savedTheme,
        false
    );


    if (toggle) {

        toggle.checked =
            savedTheme === "dark";


        toggle.addEventListener(
            "change",
            () => {

                applyTheme(
                    toggle.checked
                        ? "dark"
                        : "light",
                    true
                );

            }
        );

    }


    /* ==========================================
       LOAD SCHEDULE
    ========================================== */

    const scheduleEnabled =
        localStorage.getItem(
            "examverse_dark_schedule_enabled"
        ) === "true";


    const scheduleStart =
        localStorage.getItem(
            "examverse_dark_schedule_start"
        ) || "20:00";


    const scheduleEnd =
        localStorage.getItem(
            "examverse_dark_schedule_end"
        ) || "06:00";


    if (scheduleToggle) {

        scheduleToggle.checked =
            scheduleEnabled;

    }


    if (startInput) {

        startInput.value =
            scheduleStart;

    }


    if (endInput) {

        endInput.value =
            scheduleEnd;

    }


    updateScheduleVisibility();


    /* ==========================================
       SCHEDULE ENABLE / DISABLE
    ========================================== */

    if (scheduleToggle) {

        scheduleToggle.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    "examverse_dark_schedule_enabled",
                    scheduleToggle.checked
                );


                updateScheduleVisibility();


                if (scheduleToggle.checked) {

                    applyScheduledTheme();

                }

            }
        );

    }


    /* ==========================================
       SCHEDULE TIME CHANGES
    ========================================== */

    if (startInput) {

        startInput.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    "examverse_dark_schedule_start",
                    startInput.value
                );


                if (
                    scheduleToggle?.checked
                ) {

                    applyScheduledTheme();

                }

            }
        );

    }


    if (endInput) {

        endInput.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    "examverse_dark_schedule_end",
                    endInput.value
                );


                if (
                    scheduleToggle?.checked
                ) {

                    applyScheduledTheme();

                }

            }
        );

    }


    /* ==========================================
       AUTOMATIC SCHEDULE CHECK
    ========================================== */

    setInterval(
        applyScheduledTheme,
        30000
    );

}


/* =========================================================
   SHOW / HIDE SCHEDULE SETTINGS
========================================================= */

function updateScheduleVisibility() {

    const toggle =
        document.getElementById(
            "darkScheduleToggle"
        );

    const settings =
        document.getElementById(
            "darkScheduleSettings"
        );


    if (!settings) {
        return;
    }


    settings.classList.toggle(
        "active",
        toggle?.checked === true
    );

}


/* =========================================================
   APPLY THEME
========================================================= */

function applyTheme(
    theme,
    manualChange = false
) {

    const isDark =
        theme === "dark";


    document.documentElement
        .classList
        .toggle(
            "dark-mode",
            isDark
        );


    localStorage.setItem(
        "examverse_theme",
        theme
    );


    const toggle =
        document.getElementById(
            "darkModeToggle"
        );


    if (toggle) {

        toggle.checked =
            isDark;

    }

}


/* =========================================================
   SCHEDULED DARK MODE
========================================================= */

function applyScheduledTheme() {

    const enabled =
        localStorage.getItem(
            "examverse_dark_schedule_enabled"
        ) === "true";


    if (!enabled) {
        return;
    }


    const start =
        localStorage.getItem(
            "examverse_dark_schedule_start"
        ) || "20:00";


    const end =
        localStorage.getItem(
            "examverse_dark_schedule_end"
        ) || "06:00";


    const now =
        new Date();


    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();


    const startParts =
        start.split(":");


    const endParts =
        end.split(":");


    const startMinutes =
        Number(startParts[0]) * 60 +
        Number(startParts[1]);


    const endMinutes =
        Number(endParts[0]) * 60 +
        Number(endParts[1]);


    let shouldBeDark;


    /* ==========================================
       SAME-DAY SCHEDULE

       Example:
       08:00 → 18:00
    ========================================== */

    if (startMinutes < endMinutes) {

        shouldBeDark =
            currentMinutes >= startMinutes &&
            currentMinutes < endMinutes;

    }


    /* ==========================================
       OVERNIGHT SCHEDULE

       Example:
       20:00 → 06:00
    ========================================== */

    else {

        shouldBeDark =
            currentMinutes >= startMinutes ||
            currentMinutes < endMinutes;

    }


    applyTheme(
        shouldBeDark
            ? "dark"
            : "light",
        false
    );

}


function applyTheme(
    theme
) {

    const isDark =
        theme === "dark";


    document.documentElement
        .classList
        .toggle(
            "dark-mode",
            isDark
        );


    localStorage.setItem(
        "examverse_theme",
        theme
    );


    const toggle =
        document.getElementById(
            "darkModeToggle"
        );


    const select =
        document.getElementById(
            "themeSelect"
        );


    if (toggle) {

        toggle.checked =
            isDark;

    }


    if (select) {

        select.value =
            theme;

    }

}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {

    if (!currentUser) {
        return;
    }


    const {
        data: profile,
        error
    } =
    await supabaseClient

        .from("profiles")

        .select(`
    first_name,
    middle_name,
    last_name,
    email,
    name_change_used
`)

        .eq(
            "id",
            currentUser.id
        )

        .maybeSingle();


    if (error) {

        console.error(
            "Profile load error:",
            error
        );

        return;

    }

    window.examVerseNameChangeUsed =
    profile?.name_change_used === true;


    const firstName =
        document.getElementById(
            "profileFirstName"
        );

    const middleName =
        document.getElementById(
            "profileMiddleName"
        );

    const lastName =
        document.getElementById(
            "profileLastName"
        );

    const email =
        document.getElementById(
            "profileEmail"
        );


    if (firstName) {

        firstName.value =
            profile?.first_name || "";

    }


    if (middleName) {

        middleName.value =
            profile?.middle_name || "";

    }


    if (lastName) {

        lastName.value =
            profile?.last_name || "";

    }


    if (email) {

        email.value =
            currentUser.email || "";

    }

}


function getProfileName(
    profile
) {

    if (!profile) {

        return "";

    }


    return (
        profile.full_name ||
        profile.fullName ||
        profile.name ||
        currentUser?.user_metadata?.full_name ||
        currentUser?.user_metadata?.name ||
        ""
    );

}


/* =========================================================
   PROFILE MODAL
========================================================= */

function setupProfile() {

    const modal =
        document.getElementById(
            "profileModal"
        );


    const open =
        document.getElementById(
            "editProfileBtn"
        );


    const close =
        document.getElementById(
            "closeProfileModal"
        );


    const cancel =
        document.getElementById(
            "cancelProfileBtn"
        );


    const save =
        document.getElementById(
            "saveProfileBtn"
        );


    open?.addEventListener(
        "click",
        () => {

            modal?.classList.add(
                "show"
            );

        }
    );


    close?.addEventListener(
        "click",
        closeProfile
    );


    cancel?.addEventListener(
        "click",
        closeProfile
    );


    save?.addEventListener(
        "click",
        saveProfile
    );


    modal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                closeProfile();

            }

        }
    );

}


function closeProfile() {

    document
        .getElementById(
            "profileModal"
        )
        ?.classList.remove(
            "show"
        );

}


async function saveProfile() {

    if (!currentUser) {
        return;
    }

    const firstNameInput =
        document.getElementById("profileFirstName");

    const middleNameInput =
        document.getElementById("profileMiddleName");

    const lastNameInput =
        document.getElementById("profileLastName");

    const message =
        document.getElementById("profileMessage");


    const firstName =
        firstNameInput?.value.trim() || "";

    const middleName =
        middleNameInput?.value.trim() || "";

    const lastName =
        lastNameInput?.value.trim() || "";


    /* ==========================================
       FIRST NAME REQUIRED
    ========================================== */

    if (!firstName) {

        if (message) {

            message.textContent =
                "First name is required.";

            message.style.color =
                "#d94444";
        }

        return;
    }


    /* ==========================================
       CHECK ONE-TIME NAME CHANGE
    ========================================== */

    if (window.examVerseNameChangeUsed === true) {

        if (message) {

            message.textContent =
                "Your name has already been changed once. You cannot change it again.";

            message.style.color =
                "#d94444";
        }

        return;
    }


    try {

        /* ==========================================
           UPDATE PROFILE + LOCK NAME CHANGE
        ========================================== */

        const {
            error
        } =
            await supabaseClient
                .from("profiles")
                .update({

                    first_name:
                        firstName,

                    middle_name:
                        middleName,

                    last_name:
                        lastName,

                    name_change_used:
                        true

                })
                .eq(
                    "id",
                    currentUser.id
                );


        if (error) {

            throw error;
        }


        /* ==========================================
           MARK LOCALLY AS USED
        ========================================== */

        window.examVerseNameChangeUsed =
            true;


        /* ==========================================
           UPDATE SUPABASE AUTH METADATA
        ========================================== */

        const fullName = [
            firstName,
            middleName,
            lastName
        ]
            .filter(Boolean)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();


        const {
            error:
                authUpdateError
        } =
            await supabaseClient
                .auth
                .updateUser({

                    data: {

                        full_name:
                            fullName

                    }

                });


        if (authUpdateError) {

            console.warn(
                "Auth metadata update warning:",
                authUpdateError
            );

        }


        /* ==========================================
           SUCCESS MESSAGE
        ========================================== */

        if (message) {

            message.textContent =
                "Name updated successfully. Your name can no longer be changed.";

            message.style.color =
                "#1c9a64";
        }


        /* ==========================================
           CLOSE + REFRESH
        ========================================== */

        setTimeout(
            () => {

                closeProfile();

                window.location.reload();

            },
            1200
        );

    }

    catch (error) {

        console.error(
            "Profile update error:",
            error
        );


        if (message) {

            message.textContent =
                error.message ||
                "Unable to update your name.";

            message.style.color =
                "#d94444";
        }

    }

}


/* =========================================================
   PASSWORD
========================================================= */

function setupDataTools() {

    document
        .getElementById(
            "changePasswordBtn"
        )
        ?.addEventListener(
            "click",
            changePassword
        );


    document
        .getElementById(
            "downloadDataBtn"
        )
        ?.addEventListener(
            "click",
            downloadMyData
        );


    document
        .getElementById(
            "clearHistoryBtn"
        )
        ?.addEventListener(
            "click",
            clearTestHistory
        );

}


async function changePassword() {

    if (!currentUser?.email) {

        return;

    }


    try {

        const {
            error
        } =
            await supabaseClient
                .auth
                .resetPasswordForEmail(
                    currentUser.email,
                    {
                        redirectTo:
                            window.location.origin +
                            "/reset-password.html"
                    }
                );


        if (error) {

            throw error;

        }


        alert(
            "A password reset link has been sent to your email."
        );

    }

    catch (error) {

        console.error(
            "Password reset error:",
            error
        );

        alert(
            "Unable to send password reset email."
        );

    }

}


/* =========================================================
   DOWNLOAD USER DATA
========================================================= */

async function downloadMyData() {

    if (!currentUser) {

        return;

    }


    const button =
        document.getElementById(
            "downloadDataBtn"
        );


    if (button) {

        button.disabled = true;

        button.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Preparing...';

    }


    try {

        const profileResult =
            await supabaseClient
                .from("profiles")
                .select("*")
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();


        const attemptsResult =
            await supabaseClient
                .from("exam_attempts")
                .select("*")
                .eq(
                    "user_id",
                    currentUser.id
                );


        const answersResult =
            await supabaseClient
                .from("user_answers")
                .select("*")
                .eq(
                    "user_id",
                    currentUser.id
                );


        const savedAttemptsResult =
            await supabaseClient
                .from("saved_attempts")
                .select("*")
                .eq(
                    "user_id",
                    currentUser.id
                );


        const savedExamsResult =
            await supabaseClient
                .from("saved_exams")
                .select("*")
                .eq(
                    "user_id",
                    currentUser.id
                );


        const exportData = {

            exported_at:
                new Date()
                    .toISOString(),

            account: {

                id:
                    currentUser.id,

                email:
                    currentUser.email,

                created_at:
                    currentUser.created_at

            },

            profile:
                profileResult.data ||
                null,

            exam_attempts:
                attemptsResult.data ||
                [],

            user_answers:
                answersResult.data ||
                [],

            saved_attempts:
                savedAttemptsResult.data ||
                [],

            saved_exams:
                savedExamsResult.data ||
                []

        };


        const blob =
            new Blob(
                [
                    JSON.stringify(
                        exportData,
                        null,
                        2
                    )
                ],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const anchor =
            document.createElement(
                "a"
            );


        anchor.href = url;


        anchor.download =
            "examverse-my-data.json";


        document.body.appendChild(
            anchor
        );


        anchor.click();


        anchor.remove();


        URL.revokeObjectURL(
            url
        );


        alert(
            "Your ExamVerse data has been downloaded."
        );

    }

    catch (error) {

        console.error(
            "Data export error:",
            error
        );

        alert(
            "Unable to download your data."
        );

    }

    finally {

        if (button) {

            button.disabled =
                false;

            button.innerHTML =
                '<i class="fa-solid fa-download"></i> Download Data';

        }

    }

}


/* =========================================================
   CLEAR TEST HISTORY
========================================================= */

async function clearTestHistory() {

    if (!currentUser) {

        alert("User not logged in.");

        return;
    }


    const confirmed = confirm(
        "Clear your test history?\n\n" +
        "Completed tests will be removed from Previous Tests.\n\n" +
        "Bookmarked attempts will NOT be removed."
    );


    if (!confirmed) {
        return;
    }


    try {

        console.log(
            "Clearing history for user:",
            currentUser.id
        );


        // ==========================================
        // 1. GET BOOKMARKED ATTEMPT IDS
        // ==========================================

        const {
            data: savedAttempts,
            error: savedError
        } =
        await supabaseClient

            .from("saved_attempts")

            .select("attempt_id")

            .eq(
                "user_id",
                currentUser.id
            );


        if (savedError) {

            throw savedError;

        }


        const bookmarkedIds =
            (savedAttempts || [])
                .map(
                    item =>
                        item.attempt_id
                )
                .filter(Boolean);


        console.log(
            "Bookmarked attempt IDs:",
            bookmarkedIds
        );


        // ==========================================
        // 2. GET ALL COMPLETED ATTEMPTS
        // ==========================================

        const {
            data: completedAttempts,
            error: completedError
        } =
        await supabaseClient

            .from("exam_attempts")

            .select("id")

            .eq(
                "user_id",
                currentUser.id
            )

            .eq(
                "status",
                "Completed"
            );


        if (completedError) {

            throw completedError;

        }


        console.log(
            "Completed attempts:",
            completedAttempts
        );


        // ==========================================
        // 3. FIND ONLY NON-BOOKMARKED ATTEMPTS
        // ==========================================

        const idsToDelete =
            (completedAttempts || [])
                .map(
                    attempt =>
                        attempt.id
                )
                .filter(
                    id =>
                        !bookmarkedIds.includes(id)
                );


        console.log(
            "Attempts to delete:",
            idsToDelete
        );


        // ==========================================
        // 4. NOTHING TO DELETE
        // ==========================================

        if (
            idsToDelete.length === 0
        ) {

            alert(
                completedAttempts?.length
                    ? "All your completed tests are bookmarked, so nothing was removed."
                    : "There is no test history to clear."
            );

            return;
        }


        // ==========================================
        // 5. DELETE NON-BOOKMARKED ATTEMPTS
        // ==========================================

        const {
            data: deletedAttempts,
            error: deleteError
        } =
        await supabaseClient

            .from("exam_attempts")

            .delete()

            .eq(
                "user_id",
                currentUser.id
            )

            .in(
                "id",
                idsToDelete
            )

            .select("id");


        if (deleteError) {

            throw deleteError;

        }


        console.log(
            "Actually deleted:",
            deletedAttempts
        );


        // ==========================================
        // 6. SUCCESS
        // ==========================================

        alert(
            `${deletedAttempts.length} test${
                deletedAttempts.length === 1
                    ? ""
                    : "s"
            } cleared successfully.`
        );


        // ==========================================
        // 7. REFRESH
        // ==========================================

        window.location.reload();

    }

    catch (error) {

        console.error(
            "Clear history error:",
            error
        );


        alert(
            "Unable to clear test history.\n\n" +
            error.message
        );

    }

}


/* =========================================================
   DELETE ACCOUNT
========================================================= */

function setupDeleteAccount() {

    const modal =
        document.getElementById(
            "deleteModal"
        );


    document
        .getElementById(
            "deleteAccountBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                modal?.classList.add(
                    "show"
                );

            }
        );


    document
        .getElementById(
            "cancelDeleteBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                modal?.classList.remove(
                    "show"
                );

            }
        );


    document
        .getElementById(
            "confirmDeleteBtn"
        )
        ?.addEventListener(
            "click",
            scheduleAccountDeletion
        );

}


/* =========================================================
   ACCOUNT DELETION
   PASSWORD CONFIRMATION
========================================================= */

async function scheduleAccountDeletion() {

    if (!currentUser) {

        alert("User not logged in.");

        return;
    }


    /* ==========================================
       GET PASSWORD
    ========================================== */

    const passwordInput =
        document.getElementById(
            "deleteAccountPassword"
        );

    const password =
        passwordInput?.value.trim() || "";


    /* ==========================================
       PASSWORD REQUIRED
    ========================================== */

    if (!password) {

        alert(
            "Please enter your account password to continue."
        );

        passwordInput?.focus();

        return;
    }


    /* ==========================================
       CONFIRM BUTTON
    ========================================== */

    const confirmButton =
        document.getElementById(
            "confirmDeleteBtn"
        );


    if (confirmButton) {

        confirmButton.disabled =
            true;

        confirmButton.textContent =
            "Verifying...";

    }


    try {

        /* ==========================================
           VERIFY PASSWORD
        ========================================== */

        const {
            error: passwordError
        } =
            await supabaseClient
                .auth
                .signInWithPassword({

                    email:
                        currentUser.email,

                    password:
                        password

                });


        /* ==========================================
           WRONG PASSWORD
        ========================================== */

        if (passwordError) {

            alert(
                "Incorrect password. Account deletion was not scheduled."
            );

            passwordInput?.focus();

            return;
        }


        /* ==========================================
           PASSWORD CORRECT
        ========================================== */

        const now =
            new Date();


        const deletionDate =
            new Date(
                now.getTime() +
                (
                    30 *
                    24 *
                    60 *
                    60 *
                    1000
                )
            );


        /* ==========================================
           SAVE DELETION REQUEST
        ========================================== */

        const {
            error
        } =
            await supabaseClient
                .from("profiles")
                .update({

                    deletion_requested_at:
                        now.toISOString(),

                    deletion_scheduled_at:
                        deletionDate.toISOString()

                })
                .eq(
                    "id",
                    currentUser.id
                );


        if (error) {

            throw error;

        }


        /* ==========================================
           CLEAR PASSWORD
        ========================================== */

        if (passwordInput) {

            passwordInput.value = "";

        }


        /* ==========================================
           CLOSE MODAL
        ========================================== */

        document
            .getElementById(
                "deleteModal"
            )
            ?.classList.remove(
                "show"
            );


        /* ==========================================
           SUCCESS MESSAGE
        ========================================== */

        alert(
            "Account deletion has been scheduled.\n\n" +
            "You have 30 days to recover your account " +
            "by logging in again."
        );


        /* ==========================================
           LOG OUT
        ========================================== */

        await supabaseClient
            .auth
            .signOut();


        if (
            typeof Storage !== "undefined" &&
            typeof Storage.logout === "function"
        ) {

            Storage.logout();

        }


        /* ==========================================
           GO TO LOGIN
        ========================================== */

        window.location.replace(
            "login.html"
        );

    }

    catch (error) {

        console.error(
            "Account deletion error:",
            error
        );


        alert(
            error.message ||
            "Unable to schedule account deletion."
        );

    }

    finally {

        if (confirmButton) {

            confirmButton.disabled =
                false;

            confirmButton.textContent =
                "Schedule Deletion";

        }

    }

}


/* =========================================================
   CHECK DELETION STATUS
========================================================= */

async function checkDeletionStatus() {

    if (!currentUser) {

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "deletion_requested_at,deletion_scheduled_at"
            )
            .eq(
                "id",
                currentUser.id
            )
            .maybeSingle();


    if (error || !data) {

        return;

    }


    if (
        !data.deletion_scheduled_at
    ) {

        return;

    }


    const scheduled =
        new Date(
            data.deletion_scheduled_at
        );


    if (
        scheduled <=
        new Date()
    ) {

        return;

    }


    const status =
        document.getElementById(
            "deletionStatus"
        );


    const message =
        document.getElementById(
            "deletionMessage"
        );


    if (status) {

        status.classList.remove(
            "hidden"
        );

    }


    if (message) {

        message.textContent =
            "Your account is scheduled for permanent deletion on " +
            scheduled.toLocaleDateString() +
            ". Logging in has restored access; contact support if this deletion was not intended.";

    }

}
