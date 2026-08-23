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

                const confirmed =
                    confirm(
                        "Logout from ExamVerse?"
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