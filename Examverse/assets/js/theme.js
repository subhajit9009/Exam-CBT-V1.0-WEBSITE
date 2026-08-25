/* ================================================================
   EXAMVERSE — GLOBAL THEME CONTROLLER
   ================================================================
   File:
   assets/js/theme.js

   Behaviour:
   ✓ remembers light/dark mode
   ✓ applies theme before page becomes visible
   ✓ works across every page
   ✓ does not depend on page-specific JavaScript
   ✓ supports future theme buttons
   ✓ dispatches a themechange event
   ✓ prevents flash of light theme
================================================================ */

(function () {

    "use strict";


    /* ============================================================
       CONSTANTS
    ============================================================ */

    const STORAGE_KEY = "examverse_theme";

    const DARK_CLASS = "dark-mode";

    const root = document.documentElement;


    /* ============================================================
       READ SAVED THEME
    ============================================================ */

    function getSavedTheme() {

        try {

            const saved =
                localStorage.getItem(STORAGE_KEY);

            if (
                saved === "dark" ||
                saved === "light"
            ) {

                return saved;

            }

        } catch (error) {

            console.warn(
                "ExamVerse theme storage unavailable:",
                error
            );

        }


        return "light";

    }


    /* ============================================================
       APPLY THEME
    ============================================================ */

    function applyTheme(theme, save = true) {

        const isDark =
            theme === "dark";


        /*
           Add/remove class from <html>.
           CSS is written against html.dark-mode.
        */

        root.classList.toggle(
            DARK_CLASS,
            isDark
        );


        /*
           Keep the browser's native controls, scrollbars,
           select boxes etc. synchronized.
        */

        root.style.colorScheme =
            isDark
                ? "dark"
                : "light";


        /*
           Save preference.
        */

        if (save) {

            try {

                localStorage.setItem(
                    STORAGE_KEY,
                    isDark
                        ? "dark"
                        : "light"
                );

            } catch (error) {

                console.warn(
                    "ExamVerse could not save theme:",
                    error
                );

            }

        }


        /*
           Notify other scripts/components.

           Example:

           window.addEventListener(
               "examverse:themechange",
               function (event) {
                   console.log(event.detail.theme);
               }
           );
        */

        try {

            window.dispatchEvent(
                new CustomEvent(
                    "examverse:themechange",
                    {
                        detail: {
                            theme:
                                isDark
                                    ? "dark"
                                    : "light",

                            isDark:
                                isDark
                        }
                    }
                )
            );

        } catch (error) {

            /*
               Older environments may not support CustomEvent.
               Theme itself is already applied, so do nothing.
            */

        }

    }


    /* ============================================================
       TOGGLE
    ============================================================ */

    function toggleTheme() {

        const isDark =
            root.classList.contains(DARK_CLASS);

        applyTheme(
            isDark
                ? "light"
                : "dark"
        );

    }


    /* ============================================================
       SET EXPLICIT THEME
    ============================================================ */

    function setTheme(theme) {

        if (
            theme !== "dark" &&
            theme !== "light"
        ) {

            return;

        }

        applyTheme(theme);

    }


    /* ============================================================
       INITIAL THEME
       ============================================================ */

    const initialTheme =
        getSavedTheme();


    /*
       Apply immediately.

       This runs as soon as theme.js is executed, before the
       rest of the page finishes rendering.
    */

    applyTheme(
        initialTheme,
        false
    );


    /* ============================================================
       PUBLIC API
    ============================================================ */

    window.ExamVerseTheme = {

        get: function () {

            return root.classList.contains(
                DARK_CLASS
            )
                ? "dark"
                : "light";

        },

        set: setTheme,

        toggle: toggleTheme,

        isDark: function () {

            return root.classList.contains(
                DARK_CLASS
            );

        }

    };


    /* ============================================================
       OPTIONAL GLOBAL HELPERS
    ============================================================ */

    window.toggleExamVerseTheme =
        toggleTheme;

    window.setExamVerseTheme =
        setTheme;


})();