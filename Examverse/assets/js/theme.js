/* =========================================================
   EXAMVERSE — GLOBAL THEME SYSTEM
   ========================================================= */

(function () {

    const THEME_KEY = "examverse_theme";

    function getSavedTheme() {
        return localStorage.getItem(THEME_KEY) || "light";
    }

    function applyTheme(theme) {

        const isDark = theme === "dark";

        const html = document.documentElement;

        /* -----------------------------------------
           APPLY GLOBAL CLASS
        ----------------------------------------- */

        html.classList.toggle(
            "dark-mode",
            isDark
        );

        /* -----------------------------------------
           ALSO KEEP BODY IN SYNC
        ----------------------------------------- */

        if (document.body) {

            document.body.classList.toggle(
                "dark-mode",
                isDark
            );

        }

        /* -----------------------------------------
           SAVE
        ----------------------------------------- */

        localStorage.setItem(
            THEME_KEY,
            isDark ? "dark" : "light"
        );

        /* -----------------------------------------
           COLOR SCHEME
        ----------------------------------------- */

        html.style.colorScheme =
            isDark ? "dark" : "light";

        /* -----------------------------------------
           DEBUG
        ----------------------------------------- */

        console.log(
            "ExamVerse Theme:",
            isDark ? "DARK" : "LIGHT"
        );

    }


    /* =================================================
       APPLY BEFORE DOM IS FULLY LOADED
    ================================================= */

    applyTheme(
        getSavedTheme()
    );


    /* =================================================
       AFTER DOM LOAD
    ================================================= */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            const theme =
                getSavedTheme();

            applyTheme(theme);

            /* -----------------------------------------
               THEME SELECT
            ----------------------------------------- */

            const themeSelect =
                document.getElementById(
                    "themeSelect"
                );

            if (themeSelect) {

                themeSelect.value =
                    theme;

                themeSelect.addEventListener(
                    "change",
                    function () {

                        applyTheme(
                            this.value
                        );

                    }
                );

            }


            /* -----------------------------------------
               DARK MODE TOGGLE
            ----------------------------------------- */

            const darkModeToggle =
                document.getElementById(
                    "darkModeToggle"
                );

            if (darkModeToggle) {

                darkModeToggle.checked =
                    theme === "dark";

                darkModeToggle.addEventListener(
                    "change",
                    function () {

                        applyTheme(
                            this.checked
                                ? "dark"
                                : "light"
                        );

                    }
                );

            }

        }
    );


    /* =================================================
       GLOBAL ACCESS
       ================================================= */

    window.ExamVerseTheme = {

        apply: applyTheme,

        get: getSavedTheme

    };

})();