/* =========================================================
   ExamVerse Admin Settings
   Permission-aware administrative settings
========================================================= */


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeAdminSettings
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeAdminSettings() {

    /*
     * Wait for the existing ExamVerse Admin
     * authentication system.
     *
     * IMPORTANT:
     * admin-auth.js exposes window.examVerseAdminReady.
     */

    try {

        if (
            window.examVerseAdminReady
        ) {

            await window.examVerseAdminReady;

        }

    }

    catch (error) {

        console.error(
            "Admin authentication wait error:",
            error
        );

    }


    /*
     * Dark Mode is a personal preference.
     *
     * NO ADMIN PERMISSION IS REQUIRED.
     */

    setupDarkMode();


    /*
     * Load the current administrator's
     * permissions.
     */

    await loadCurrentAdminPermissions();


    /*
     * Apply Settings permissions.
     */

    applySettingsPermissions();


    /*
     * Setup administrative settings.

     */

    setupAdministrativeSettings();


    /*
     * Load saved administrative values.
     */

    loadLocalAdministrativeSettings();


    /*
     * Setup logout.
     */

    setupLogout();

}



/* =========================================================
   CURRENT ADMIN PERMISSIONS
========================================================= */

let currentAdminPermissions = [];


/* =========================================================
   LOAD CURRENT ADMIN PERMISSIONS
========================================================= */

async function loadCurrentAdminPermissions() {

    /*
     * Main Admin does not need RPC permissions.
     */

    if (
        window.examVerseAdmin?.isMainAdmin === true
    ) {

        currentAdminPermissions = [];

        return;

    }


    /*
     * If another version of admin-auth.js has
     * already loaded the permissions, use them.
     */

    if (
        Array.isArray(
            window.examVerseAdmin?.permissions
        )
    ) {

        currentAdminPermissions = [
            ...window.examVerseAdmin.permissions
        ];

        return;

    }


    /*
     * Get the currently authenticated user.
     */

    let user = null;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getUser();


        if (error) {

            throw error;

        }


        user =
            data?.user ||
            null;

    }

    catch (error) {

        console.error(
            "Unable to get current admin user:",
            error
        );

        currentAdminPermissions = [];

        return;

    }


    if (!user) {

        currentAdminPermissions = [];

        return;

    }


    /*
     * Load permissions assigned to
     * this Admin.
     *
     * This is the existing ExamVerse
     * permission RPC.
     */

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .rpc(
                    "get_my_admin_permissions"
                );


        if (error) {

            throw error;

        }


        if (
            Array.isArray(data)
        ) {

            currentAdminPermissions =
                data
                    .map(
                        item => {

                            if (
                                typeof item ===
                                "string"
                            ) {

                                return item;

                            }


                            return (
                                item?.permission ||
                                item?.permission_name ||
                                item?.name ||
                                item?.id ||
                                ""
                            );

                        }
                    )
                    .filter(
                        permission =>
                            Boolean(
                                permission
                            )
                    );

        }

        else {

            currentAdminPermissions = [];

        }


        /*
         * Keep the loaded permissions available
         * through the existing global Admin object.
         *
         * This does NOT remove or replace
         * any other permissions.
         */

        if (
            window.examVerseAdmin
        ) {

            window.examVerseAdmin.permissions =
                [
                    ...currentAdminPermissions
                ];

        }

    }

    catch (error) {

        console.error(
            "Admin permission loading error:",
            error
        );

        currentAdminPermissions = [];

    }

}



/* =========================================================
   MAIN ADMIN CHECK
========================================================= */

function isMainAdmin() {

    return (
        window.examVerseAdmin?.isMainAdmin === true
    );

}



/* =========================================================
   PERMISSION CHECK
========================================================= */

function hasPermission(
    permission
) {

    /*
     * Main Admin has unrestricted access.
     */

    if (
        isMainAdmin()
    ) {

        return true;

    }


    /*
     * Prefer the existing global
     * hasPermission() method if available.
     */

    if (
        typeof
        window.examVerseAdmin?.hasPermission ===
        "function"
    ) {

        return (
            window.examVerseAdmin.hasPermission(
                permission
            ) === true
        );

    }


    /*
     * Fallback to permissions loaded
     * directly by this page.
     */

    return (
        currentAdminPermissions.includes(
            permission
        )
    );

}



/* =========================================================
   DARK MODE
   NO PERMISSION REQUIRED
========================================================= */

function setupDarkMode() {

    const toggle =
        document.getElementById(
            "darkModeToggle"
        );


    if (!toggle) {

        return;

    }


    /*
     * Load personal theme preference.
     *
     * This is intentionally independent
     * of settings.view/settings.edit.
     */

    const savedTheme =
        localStorage.getItem(
            "examverse_theme"
        ) || "light";


    applyAdminTheme(
        savedTheme,
        false
    );


    toggle.checked =
        savedTheme === "dark";


    /*
     * Allow EVERY administrator to
     * change Dark Mode.
     */

    toggle.addEventListener(
        "change",
        () => {

            const theme =
                toggle.checked
                    ? "dark"
                    : "light";


            applyAdminTheme(
                theme,
                true
            );

        }
    );

}



/* =========================================================
   APPLY ADMIN THEME
========================================================= */

function applyAdminTheme(
    theme,
    savePreference = true
) {

    const isDark =
        theme === "dark";


    document.documentElement
        .classList
        .toggle(
            "dark-mode",
            isDark
        );


    /*
     * Save personal appearance preference.
     */

    if (
        savePreference
    ) {

        localStorage.setItem(
            "examverse_theme",
            theme
        );

    }


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
   SETTINGS PERMISSIONS
========================================================= */

function applySettingsPermissions() {

    const canViewSettings =
        hasPermission(
            "settings.view"
        );


    const canEditSettings =
        hasPermission(
            "settings.edit"
        );


    const accessDenied =
        document.getElementById(
            "settingsAccessDenied"
        );


    const systemCard =
        document.getElementById(
            "systemSettingsCard"
        );


    const examDefaultsCard =
        document.getElementById(
            "examDefaultsCard"
        );


    const saveArea =
        document.getElementById(
            "settingsSaveArea"
        );


    const permissionBadge =
        document.getElementById(
            "settingsPermissionBadge"
        );


    const roleBadge =
        document.getElementById(
            "adminRoleBadge"
        );


    const editNotice =
        document.getElementById(
            "settingsEditNotice"
        );



    /* =====================================================
       ROLE
    ====================================================== */

    if (
        roleBadge
    ) {

        if (
            isMainAdmin()
        ) {

            roleBadge.textContent =
                "MAIN ADMIN";

        }

        else {

            roleBadge.textContent =
                "ADMIN";

        }

    }



    /* =====================================================
       NO VIEW PERMISSION
    ====================================================== */

    if (
        !canViewSettings
    ) {

        if (
            accessDenied
        ) {

            accessDenied.hidden =
                false;

        }


        if (
            systemCard
        ) {

            systemCard.hidden =
                true;

        }


        if (
            examDefaultsCard
        ) {

            examDefaultsCard.hidden =
                true;

        }


        if (
            saveArea
        ) {

            saveArea.hidden =
                true;

        }


        if (
            permissionBadge
        ) {

            permissionBadge.textContent =
                "LOCKED";

            permissionBadge.className =
                "permission-badge locked";

        }


        return;

    }



    /* =====================================================
       VIEW PERMISSION GRANTED
    ====================================================== */

    if (
        accessDenied
    ) {

        accessDenied.hidden =
            true;

    }


    if (
        systemCard
    ) {

        systemCard.hidden =
            false;

    }


    if (
        examDefaultsCard
    ) {

        examDefaultsCard.hidden =
            false;

    }



    /* =====================================================
       EDIT PERMISSION GRANTED
    ====================================================== */

    if (
        canEditSettings
    ) {

        if (
            permissionBadge
        ) {

            permissionBadge.textContent =
                "VIEW + EDIT";

            permissionBadge.className =
                "permission-badge allowed";

        }


        if (
            editNotice
        ) {

            editNotice.hidden =
                true;

        }


        if (
            saveArea
        ) {

            saveArea.hidden =
                false;

        }


        setSettingsEditable(
            true
        );

    }

    else {

        /*
         * View permission exists,
         * but Edit permission does not.
         */

        if (
            permissionBadge
        ) {

            permissionBadge.textContent =
                "VIEW ONLY";

            permissionBadge.className =
                "permission-badge view-only";

        }


        if (
            editNotice
        ) {

            editNotice.hidden =
                false;

        }


        if (
            saveArea
        ) {

            saveArea.hidden =
                true;

        }


        setSettingsEditable(
            false
        );

    }

}



/* =========================================================
   ENABLE / DISABLE SETTINGS
========================================================= */

function setSettingsEditable(
    editable
) {

    const controls =
        document.querySelectorAll(
            "#systemSettingsCard input," +
            "#systemSettingsCard select," +
            "#examDefaultsCard input," +
            "#examDefaultsCard select"
        );


    controls.forEach(
        control => {

            control.disabled =
                !editable;

        }
    );


    const systemCard =
        document.getElementById(
            "systemSettingsCard"
        );


    const examDefaultsCard =
        document.getElementById(
            "examDefaultsCard"
        );


    if (
        systemCard
    ) {

        systemCard.classList.toggle(
            "is-view-only",
            !editable
        );

    }


    if (
        examDefaultsCard
    ) {

        examDefaultsCard.classList.toggle(
            "is-view-only",
            !editable
        );

    }

}



/* =========================================================
   ADMINISTRATIVE SETTINGS
========================================================= */

function setupAdministrativeSettings() {

    const saveButton =
        document.getElementById(
            "saveSettingsBtn"
        );


    if (!saveButton) {

        return;

    }


    saveButton.addEventListener(
        "click",
        saveAdministrativeSettings
    );

}



/* =========================================================
   SAVE ADMINISTRATIVE SETTINGS
========================================================= */

async function saveAdministrativeSettings() {

    /*
     * FINAL permission check.
     *
     * Even if someone manually triggers
     * the button, settings.edit is required.
     */

    if (
        !hasPermission(
            "settings.edit"
        )
    ) {

        alert(
            "You do not have permission to edit administrative settings."
        );

        return;

    }


    const durationInput =
        document.getElementById(
            "defaultExamDuration"
        );


    const passingInput =
        document.getElementById(
            "defaultPassingPercentage"
        );


    const negativeMarking =
        document.getElementById(
            "defaultNegativeMarking"
        );


    const saveButton =
        document.getElementById(
            "saveSettingsBtn"
        );


    const message =
        document.getElementById(
            "settingsSaveMessage"
        );


    const duration =
        Number(
            durationInput?.value
        );


    const passingPercentage =
        Number(
            passingInput?.value
        );


    const negative =
        Number(
            negativeMarking?.value
        );



    /* =====================================================
       VALIDATION
    ====================================================== */

    if (
        !Number.isFinite(
            duration
        ) ||
        duration < 1 ||
        duration > 1440
    ) {

        alert(
            "Examination duration must be between 1 and 1440 minutes."
        );

        return;

    }


    if (
        !Number.isFinite(
            passingPercentage
        ) ||
        passingPercentage < 0 ||
        passingPercentage > 100
    ) {

        alert(
            "Passing percentage must be between 0 and 100."
        );

        return;

    }



    /* =====================================================
       SAVE BUTTON STATE
    ====================================================== */

    if (
        saveButton
    ) {

        saveButton.disabled =
            true;

        saveButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    }



    try {

        /*
         * IMPORTANT
         *
         * We are keeping the current safe local
         * storage behaviour because the actual
         * Supabase settings table/schema has not
         * been confirmed.
         */

        localStorage.setItem(
            "examverse_admin_default_exam_duration",
            String(
                duration
            )
        );


        localStorage.setItem(
            "examverse_admin_default_passing_percentage",
            String(
                passingPercentage
            )
        );


        localStorage.setItem(
            "examverse_admin_default_negative_marking",
            String(
                negative
            )
        );


        if (
            message
        ) {

            message.textContent =
                "Settings saved successfully.";

            message.style.color =
                "#15803d";

        }

    }

    catch (error) {

        console.error(
            "Admin settings save error:",
            error
        );


        if (
            message
        ) {

            message.textContent =
                "Unable to save settings.";

            message.style.color =
                "#dc2626";

        }

    }

    finally {

        if (
            saveButton
        ) {

            saveButton.disabled =
                false;

            saveButton.innerHTML =
                '<i class="fa-solid fa-floppy-disk"></i> Save Settings';

        }

    }

}



/* =========================================================
   LOAD LOCAL ADMIN SETTINGS
========================================================= */

function loadLocalAdministrativeSettings() {

    const duration =
        localStorage.getItem(
            "examverse_admin_default_exam_duration"
        );


    const passing =
        localStorage.getItem(
            "examverse_admin_default_passing_percentage"
        );


    const negative =
        localStorage.getItem(
            "examverse_admin_default_negative_marking"
        );


    const durationInput =
        document.getElementById(
            "defaultExamDuration"
        );


    const passingInput =
        document.getElementById(
            "defaultPassingPercentage"
        );


    const negativeInput =
        document.getElementById(
            "defaultNegativeMarking"
        );


    if (
        duration &&
        durationInput
    ) {

        durationInput.value =
            duration;

    }


    if (
        passing &&
        passingInput
    ) {

        passingInput.value =
            passing;

    }


    if (
        negative &&
        negativeInput
    ) {

        negativeInput.value =
            negative;

    }

}



/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );


    if (!logoutButton) {

        return;

    }


    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await supabaseClient
                    .auth
                    .signOut();

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }


            window.location.replace(
                "admin-login.html"
            );

        }
    );

}