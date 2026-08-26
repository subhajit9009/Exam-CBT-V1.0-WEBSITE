/* =========================================================
   EXAMVERSE GLOBAL THEME SYSTEM
========================================================= */

(function () {

    const savedTheme =
        localStorage.getItem(
            "examverse_theme"
        ) || "light";


    const scheduleEnabled =
        localStorage.getItem(
            "examverse_dark_schedule_enabled"
        ) === "true";


    /* ==========================================
       NO SCHEDULE
    ========================================== */

    if (!scheduleEnabled) {

        setTheme(
            savedTheme
        );

        return;

    }


    /* ==========================================
       SCHEDULED THEME
    ========================================== */

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


    let darkNow;


    if (startMinutes < endMinutes) {

        darkNow =
            currentMinutes >= startMinutes &&
            currentMinutes < endMinutes;

    } else {

        darkNow =
            currentMinutes >= startMinutes ||
            currentMinutes < endMinutes;

    }


    setTheme(
        darkNow
            ? "dark"
            : "light"
    );


    /* ==========================================
       CHECK EVERY 30 SECONDS
    ========================================== */

    setInterval(
        () => {

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


            const current =
                now.getHours() * 60 +
                now.getMinutes();


            const s =
                Number(
                    start.split(":")[0]
                ) * 60 +
                Number(
                    start.split(":")[1]
                );


            const e =
                Number(
                    end.split(":")[0]
                ) * 60 +
                Number(
                    end.split(":")[1]
                );


            let dark;


            if (s < e) {

                dark =
                    current >= s &&
                    current < e;

            } else {

                dark =
                    current >= s ||
                    current < e;

            }


            setTheme(
                dark
                    ? "dark"
                    : "light"
            );

        },
        30000
    );


    function setTheme(theme) {

        document.documentElement
            .classList
            .toggle(
                "dark-mode",
                theme === "dark"
            );

    }

})();