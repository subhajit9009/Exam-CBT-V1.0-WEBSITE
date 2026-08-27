/* ==========================================
   ExamVerse Universal Sidebar
   Navigation + Logout
========================================== */

document.addEventListener("DOMContentLoaded", function () {

    /* ======================================
       UNIVERSAL NAVIGATION
    ====================================== */

    const dashboardBtn =
        document.getElementById("sidebarDashboard");

    const newTestBtn =
        document.getElementById("sidebarNewTest");

    const previousTestsBtn =
        document.getElementById("sidebarPreviousTests");

    const performanceBtn =
        document.getElementById("sidebarPerformance");

    const bookmarksBtn =
        document.getElementById("sidebarBookmarks");

    const settingsBtn =
        document.getElementById("sidebarSettings");

    if (dashboardBtn) {

        dashboardBtn.addEventListener(
            "click",
            function () {

                window.location.href =
                    "dashboard.html";

            }
        );

    }


    if (newTestBtn) {

        newTestBtn.addEventListener(
            "click",
            function () {

                /*
                 * New Test always opens the
                 * complete exam list.
                 *
                 * Remove temporary preferred
                 * exam filtering.
                 */

                sessionStorage.removeItem(
                    "selectedPreferredExam"
                );

                window.location.href =
                    "exam-list.html";

            }
        );

    }


    if (previousTestsBtn) {

        previousTestsBtn.addEventListener(
            "click",
            function () {

                window.location.href =
                    "previous-tests.html";

            }
        );

    }


    if (performanceBtn) {

        performanceBtn.addEventListener(
            "click",
            function () {

                window.location.href =
                    "performance.html";

            }
        );

    }


    if (bookmarksBtn) {

        bookmarksBtn.addEventListener(
            "click",
            function () {

                window.location.href =
                    "bookmarks.html";

            }
        );

    }


    if (settingsBtn) {

        settingsBtn.addEventListener(
            "click",
            function () {

                window.location.href =
                    "settings.html";

            }
        );

    }


    /* ======================================
       UNIVERSAL LOGOUT
    ====================================== */

    const logoutBtn =
        document.getElementById(
            "sidebarLogout"
        );

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async function () {

                const confirmed = await showConfirm(
    "Logout from ExamVerse?",
    "Are you sure you want to log out of your ExamVerse account?",
    null,
    {
        confirmText: "Logout",
        cancelText: "Cancel"
    }
);

if (!confirmed) {

    return;
}


                try {

                    /* ==========================
                       SUPABASE LOGOUT
                    ========================== */

                    if (
                        typeof supabaseClient !==
                        "undefined"
                    ) {

                        const {
                            error
                        } =
                        await supabaseClient
                            .auth
                            .signOut();

                        if (error) {

                            console.error(
                                "Supabase Logout Error:",
                                error
                            );

                        }

                    }


                    /* ==========================
                       CLEAR LOCAL USER
                    ========================== */

                    if (
                        typeof Storage !==
                            "undefined" &&
                        typeof Storage.logout ===
                            "function"
                    ) {

                        Storage.logout();

                    }


                    /* ==========================
                       CLEAR EXAM SESSION
                    ========================== */

                    sessionStorage.removeItem(
                        "selectedExam"
                    );

                    sessionStorage.removeItem(
                        "attemptId"
                    );

                    sessionStorage.removeItem(
                        "attemptStartedFresh"
                    );

                    sessionStorage.removeItem(
                        "examStartTime"
                    );

                    sessionStorage.removeItem(
                        "examActiveStartedAt"
                    );

                    sessionStorage.removeItem(
                        "currentQuestionIndex"
                    );

                    sessionStorage.removeItem(
                        "currentSectionIndex"
                    );

                    sessionStorage.removeItem(
                        "selectedPreferredExam"
                    );


                    /* ==========================
                       LOGIN
                    ========================== */

                    window.location.replace(
                        "login.html"
                    );

                }

                catch (error) {

                    console.error(
                        "Logout Error:",
                        error
                    );

                    window.location.replace(
                        "login.html"
                    );

                }

            }
        );

    }

});

/* =========================================================
   EXAMVERSE MOBILE SIDEBAR
   STEP 3 — MOBILE MENU CONTROLLER
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const mobileMenuBtn =
        document.getElementById("mobileMenuBtn");

    const mobileSidebarOverlay =
        document.getElementById("mobileSidebarOverlay");

    const sidebar =
        document.querySelector(".sidebar");


    /* ---------------------------------------------
       SAFETY CHECK
    --------------------------------------------- */

    if (
        !mobileMenuBtn ||
        !mobileSidebarOverlay ||
        !sidebar
    ) {

        console.warn(
            "ExamVerse mobile sidebar elements not found."
        );

        return;

    }


    /* ---------------------------------------------
       OPEN SIDEBAR
    --------------------------------------------- */

    function openMobileSidebar() {

        sidebar.classList.add("mobile-open");

        mobileSidebarOverlay.classList.add("active");

        mobileMenuBtn.classList.add("menu-open");

        mobileMenuBtn.setAttribute(
            "aria-expanded",
            "true"
        );

        mobileMenuBtn.setAttribute(
            "aria-label",
            "Close navigation"
        );


        /* Change hamburger → X */

        const icon =
            mobileMenuBtn.querySelector("i");

        if (icon) {

            icon.classList.remove(
                "fa-bars"
            );

            icon.classList.add(
                "fa-xmark"
            );

        }


        /* Prevent background scrolling */

        document.body.classList.add(
            "mobile-sidebar-active"
        );

    }


    /* ---------------------------------------------
       CLOSE SIDEBAR
    --------------------------------------------- */

    function closeMobileSidebar() {

        sidebar.classList.remove("mobile-open");

        mobileSidebarOverlay.classList.remove(
            "active"
        );

        mobileMenuBtn.classList.remove(
            "menu-open"
        );

        mobileMenuBtn.setAttribute(
            "aria-expanded",
            "false"
        );

        mobileMenuBtn.setAttribute(
            "aria-label",
            "Open navigation"
        );


        /* Change X → hamburger */

        const icon =
            mobileMenuBtn.querySelector("i");

        if (icon) {

            icon.classList.remove(
                "fa-xmark"
            );

            icon.classList.add(
                "fa-bars"
            );

        }


        /* Restore background scrolling */

        document.body.classList.remove(
            "mobile-sidebar-active"
        );

    }


    /* ---------------------------------------------
       HAMBURGER BUTTON
    --------------------------------------------- */

    mobileMenuBtn.addEventListener(
        "click",
        function () {

            if (
                sidebar.classList.contains(
                    "mobile-open"
                )
            ) {

                closeMobileSidebar();

            } else {

                openMobileSidebar();

            }

        }
    );


    /* ---------------------------------------------
       CLICK OUTSIDE SIDEBAR
    --------------------------------------------- */

    mobileSidebarOverlay.addEventListener(
        "click",
        function () {

            closeMobileSidebar();

        }
    );


    /* ---------------------------------------------
       CLOSE AFTER NAVIGATION CLICK
    --------------------------------------------- */

    const sidebarLinks =
        sidebar.querySelectorAll("a");

    sidebarLinks.forEach(function (link) {

        link.addEventListener(
            "click",
            function () {

                if (
                    window.innerWidth <= 700
                ) {

                    closeMobileSidebar();

                }

            }
        );

    });


    /* ---------------------------------------------
       ESCAPE KEY
    --------------------------------------------- */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                sidebar.classList.contains(
                    "mobile-open"
                )
            ) {

                closeMobileSidebar();

            }

        }
    );


    /* ---------------------------------------------
       RESET WHEN RETURNING TO DESKTOP
    --------------------------------------------- */

    window.addEventListener(
        "resize",
        function () {

            if (
                window.innerWidth > 700
            ) {

                closeMobileSidebar();

            }

        }
    );

});