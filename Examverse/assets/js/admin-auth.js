/* ==========================================
   ExamVerse Admin Authentication
   Created by Subhajit Paul
========================================== */

window.examVerseAdminReady =
    new Promise(resolve => {

        window.resolveExamVerseAdmin =
            resolve;

    });


/* ==========================================
   EXAMVERSE ADMIN AUTHENTICATION
========================================== */

(async () => {

    // ==========================
    // Check Logged In User
    // ==========================

    const {
        data: { user },
        error
    } =
        await supabaseClient.auth.getUser();


    if (error || !user) {

        window.location.href =
            "login.html";

        return;

    }


    // ==========================
    // Check Admin Table
    // ==========================

    const {
        data: admin,
        error: adminError
    } =
        await supabaseClient

            .from("admins")

            .select(`
                role,
                email,
                full_name
            `)

            .eq(
                "id",
                user.id
            )

            .maybeSingle();


    // ==========================
    // Admin Lookup Error
    // ==========================

    if (adminError) {

        console.error(
            "Admin authentication error:",
            adminError
        );

        showPopup(
            "error",
            "Authentication Error",
            "Unable to verify administrator access."
        );

        setTimeout(
            () => {

                window.location.href =
                    "dashboard.html";

            },
            1500
        );

        return;

    }


    // ==========================
    // Not An Admin
    // ==========================

    if (!admin) {

        showPopup(
            "error",
            "Access Denied",
            "You do not have administrator access."
        );

        setTimeout(
            () => {

                window.location.href =
                    "dashboard.html";

            },
            1500
        );

        return;

    }


    // ==========================
    // Validate Role
    // ==========================

    const role =
        String(
            admin.role || ""
        )
        .trim()
        .toLowerCase();


    if (
        role !== "admin" &&
        role !== "main_admin"
    ) {

        showPopup(
            "error",
            "Access Denied",
            "Your administrator account is not active."
        );

        setTimeout(
            () => {

                window.location.href =
                    "dashboard.html";

            },
            1500
        );

        return;

    }


    /* ==========================================
       LOAD DELEGATED ADMIN PERMISSIONS
    ========================================== */

    let permissions = [];


    if (role === "main_admin") {

        /*
         * Main Admin has unrestricted access.
         * We still keep an explicit permissions object
         * so every page can use the same permission API.
         */

        permissions = [
            "users.view",
            "users.create",
            "users.edit",
            "users.delete",

            "exams.view",
            "exams.create",
            "exams.edit",
            "exams.delete",

            "questions.view",
            "questions.create",
            "questions.edit",
            "questions.delete",

            "results.view",

            "analytics.view",

            "settings.view",
            "settings.edit",

            "admin.make",
            "admin.change",
            "admin.remove"
        ];

    }

    else {

        /*
         * Delegated Admin
         *
         * IMPORTANT:
         * Never assume access.
         * If permissions cannot be loaded,
         * the admin receives NO delegated permissions.
         */

        try {

            const {
                data: permissionData,
                error: permissionError
            } =
                await supabaseClient.rpc(
                    "get_my_admin_permissions"
                );


            if (permissionError) {

                console.error(
                    "Unable to load admin permissions:",
                    permissionError
                );

                permissions = [];

            }

            else {

                /*
                 * Support either:
                 *
                 * ["users.view", "users.edit"]
                 *
                 * OR
                 *
                 * [{ permission: "users.view" }]
                 *
                 * OR
                 *
                 * [{ id: "users.view" }]
                 */

                if (
                    Array.isArray(
                        permissionData
                    )
                ) {

                    permissions =
                        permissionData
                            .map(
                                permission => {

                                    if (
                                        typeof permission ===
                                        "string"
                                    ) {

                                        return permission;

                                    }

                                    if (
                                        permission &&
                                        typeof permission ===
                                        "object"
                                    ) {

                                        return (
                                            permission.permission ||
                                            permission.permission_id ||
                                            permission.id ||
                                            ""
                                        );

                                    }

                                    return "";

                                }
                            )
                            .filter(
                                permission =>
                                    permission
                            );

                }

            }

        }

        catch (permissionError) {

            console.error(
                "Admin permission loading error:",
                permissionError
            );

            permissions = [];

        }

    }


    /* ==========================================
       NORMALIZE PERMISSIONS
    ========================================== */

    permissions =
        [
            ...new Set(
                permissions
                    .map(
                        permission =>
                            String(
                                permission || ""
                            )
                            .trim()
                            .toLowerCase()
                    )
                    .filter(
                        Boolean
                    )
            )
        ];


    /* ==========================================
       ADMIN INFORMATION
    ========================================== */

    window.examVerseAdmin = {

        id:
            user.id,

        email:
            admin.email ||
            user.email ||
            "",

        full_name:
            admin.full_name ||
            "",

        role:
            role,

        isMainAdmin:
            role === "main_admin",


        /* ==========================================
           PERMISSIONS
        ========================================== */

        permissions:


            permissions,


        /* ==========================================
           PERMISSION CHECK
        ========================================== */

        hasPermission(
            permission
        ) {

            if (
                this.isMainAdmin
            ) {

                return true;

            }


            return this.permissions.includes(
                String(
                    permission || ""
                )
                .trim()
                .toLowerCase()
            );

        },


        /* ==========================================
           REQUIRE PERMISSION
        ========================================== */

        requirePermission(
            permission
        ) {

            if (
                this.hasPermission(
                    permission
                )
            ) {

                return true;

            }


            if (
                typeof showPopup ===
                "function"
            ) {

                showPopup(
                    "error",
                    "Permission Required",
                    "You do not have permission to perform this action."
                );

            }

            return false;

        }

    };


    /* ==========================================
       RESOLVE AUTHENTICATION
    ========================================== */

    if (
        typeof window.resolveExamVerseAdmin ===
        "function"
    ) {

        window.resolveExamVerseAdmin(
            window.examVerseAdmin
        );

    }


    /* ==========================================
       AUTHENTICATION SUCCESSFUL
    ========================================== */

    console.log(
        "ExamVerse Admin authenticated:",
        window.examVerseAdmin
    );


})();


/* ==========================================
   EXAMVERSE GLOBAL LAST SEEN TRACKING
========================================== */

(function startGlobalLastSeen() {

    let lastSeenTimer = null;


    async function updateLastSeen() {

        try {

            const {
                data: {
                    user
                },
                error: userError
            } =
                await supabaseClient
                    .auth
                    .getUser();


            if (
                userError ||
                !user
            ) {

                return;

            }


            const {
                error
            } =
                await supabaseClient.rpc(
                    "update_my_last_seen"
                );


            if (error) {

                console.error(
                    "Last seen update failed:",
                    error
                );

            }

        }

        catch (error) {

            console.error(
                "Last seen tracking error:",
                error
            );

        }

    }


    // ==========================
    // Update immediately
    // ==========================

    updateLastSeen();


    // ==========================
    // Update every 60 seconds
    // ==========================

    lastSeenTimer =
        setInterval(
            updateLastSeen,
            60 * 1000
        );


    // ==========================
    // Update when user returns
    // ==========================

    document.addEventListener(
        "visibilitychange",
        function () {

            if (
                document.visibilityState ===
                "visible"
            ) {

                updateLastSeen();

            }

        }
    );


})();