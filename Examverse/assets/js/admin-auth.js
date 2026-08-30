/* ==========================================
   ExamVerse Admin Authentication
   Created by Subhajit Paul
========================================== */

window.examVerseAdminReady =
    new Promise(resolve => {

        window.resolveExamVerseAdmin =
            resolve;

    });

(async () => {

    // ==========================
    // Check Logged In User
    // ==========================

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();


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


    // ==========================
    // Store Admin Information
    // ==========================

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
            role === "main_admin"

    };

    if (
    typeof window.resolveExamVerseAdmin ===
    "function"
) {

    window.resolveExamVerseAdmin(
        window.examVerseAdmin
    );

}


    // ==========================
    // Authentication Successful
    // ==========================

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


    // Update immediately
    updateLastSeen();


    // Then every 60 seconds
    lastSeenTimer =
        setInterval(
            updateLastSeen,
            60 * 1000
        );


    // Update when user returns to the tab
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

