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


    document
        .getElementById(
            "sidebarLogout"
        )
        ?.addEventListener(
            "click",
            logoutUser
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


    const theme =
        document.getElementById(
            "themeSelect"
        );


    const savedTheme =
        localStorage.getItem(
            "examverse_theme"
        ) ||
        "light";


    applyTheme(
        savedTheme
    );


    if (theme) {

        theme.value =
            savedTheme;


        theme.addEventListener(
            "change",
            () => {

                applyTheme(
                    theme.value
                );

            }
        );

    }


    if (toggle) {

        toggle.checked =
            savedTheme ===
            "dark";


        toggle.addEventListener(
            "change",
            () => {

                applyTheme(
                    toggle.checked
                        ? "dark"
                        : "light"
                );

            }
        );

    }

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
            email
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


    if (!firstName) {

        if (message) {

            message.textContent =
                "First name is required.";

            message.style.color =
                "#d94444";

        }

        return;
    }


    try {

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
                    lastName

            })
            .eq(
                "id",
                currentUser.id
            );


        if (error) {

            throw error;

        }


        /*
         * Also keep the Supabase Auth
         * metadata synchronized.
         */

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


        if (message) {

            message.textContent =
                "Name updated successfully.";

            message.style.color =
                "#1c9a64";

        }


        /*
         * Update displayed account name
         * immediately.
         */

        setTimeout(
            () => {

                closeProfile();

                window.location.reload();

            },
            700
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
        return;
    }


    const confirmed =
        confirm(
            "Clear your test history?\n\n" +
            "This will permanently remove your completed test attempts from Previous Tests.\n\n" +
            "Bookmarked attempts will NOT be deleted."
        );


    if (!confirmed) {
        return;
    }


    try {

        /*
         * ==========================================
         * GET BOOKMARKED ATTEMPT IDS
         * ==========================================
         */

        const {
            data: savedAttempts,
            error: savedError
        } =
        await supabaseClient

            .from("saved_attempts")

            .select(
                "attempt_id"
            )

            .eq(
                "user_id",
                currentUser.id
            );


        if (savedError) {
            throw savedError;
        }


        const bookmarkedAttemptIds =
            (
                savedAttempts || []
            )
                .map(
                    item =>
                        item.attempt_id
                )
                .filter(Boolean);


        /*
         * ==========================================
         * LOAD ALL COMPLETED ATTEMPTS
         * ==========================================
         */

        const {
            data: completedAttempts,
            error: attemptsError
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


        if (attemptsError) {
            throw attemptsError;
        }


        /*
         * ==========================================
         * REMOVE ONLY NON-BOOKMARKED ATTEMPTS
         * ==========================================
         */

        const idsToDelete =
            (completedAttempts || [])
                .map(
                    attempt =>
                        attempt.id
                )
                .filter(
                    id =>
                        !bookmarkedAttemptIds.includes(
                            id
                        )
                );


        if (
            idsToDelete.length === 0
        ) {

            alert(
                "There are no removable tests in your history. Your bookmarked attempts have been preserved."
            );

            return;
        }


        /*
         * ==========================================
         * DELETE IN BATCH
         * ==========================================
         */

        const {
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
            );


        if (deleteError) {
            throw deleteError;
        }


        /*
         * ==========================================
         * DONE
         * ==========================================
         */

        alert(
            `${idsToDelete.length} test history record${
                idsToDelete.length === 1
                    ? ""
                    : "s"
            } cleared successfully.`
        );


    }

    catch (error) {

        console.error(
            "Clear history error:",
            error
        );


        alert(
            error.message ||
            "Unable to clear test history."
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


async function scheduleAccountDeletion() {

    if (!currentUser) {

        return;

    }


    const confirmText =
        prompt(
            'Type DELETE to schedule account deletion.'
        );


    if (
        confirmText !==
        "DELETE"
    ) {

        return;

    }


    const now =
        new Date();


    const deletionDate =
        new Date(
            now.getTime() +
            30 *
            24 *
            60 *
            60 *
            1000
        );


    try {

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


        alert(
            "Account deletion has been scheduled. You have 30 days to recover your account by logging in again."
        );


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
            "Account deletion scheduling error:",
            error
        );

        alert(
            "Unable to schedule account deletion."
        );

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