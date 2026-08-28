/* =========================================================
   ExamVerse Google reCAPTCHA v2
   Reliable Universal Renderer
========================================================= */

(function () {

    const SITE_KEY =
        "6Le9L50tAAAAAHV0kR_kRycTmPYIJVViX4fgJwAy";

            /* =========================================================
       TEMPORARY LOCALHOST DEVELOPMENT BYPASS

       CAPTCHA is required everywhere except:
       localhost
       127.0.0.1

       REMOVE THIS BLOCK BEFORE PRODUCTION.
    ========================================================= */

    const isLocalDevelopment =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";


    window.examVerseCaptchaRequired =
        !isLocalDevelopment;


    let captchaRendered = false;


    function getCaptchaContainer() {

        return (
            document.getElementById(
                "registerCaptcha"
            ) ||
            document.getElementById(
                "loginCaptcha"
            ) ||
            document.getElementById(
                "forgotCaptcha"
            )
        );

    }


    function renderCaptcha() {

        const container =
            getCaptchaContainer();


        if (!container) {
            return;
        }


        /*
            Google API is not ready yet.
            Try again shortly.
        */

        if (
            typeof grecaptcha ===
            "undefined" ||
            typeof grecaptcha.render !==
            "function"
        ) {

            setTimeout(
                renderCaptcha,
                250
            );

            return;

        }


        /*
            Prevent duplicate rendering.
        */

        if (captchaRendered) {
            return;
        }


        /*
            Determine available width.
        */

        const parent =
            container.parentElement;


        const availableWidth =
            parent
                ? parent.getBoundingClientRect().width
                : window.innerWidth;


        /*
            Google-supported sizes:

            normal  = 304px
            compact = 164px
        */

        const captchaSize =
            availableWidth < 304
                ? "compact"
                : "normal";


        try {

            const widgetId =
    grecaptcha.render(
        container,
        {
            sitekey: SITE_KEY,
            size: captchaSize
        }
    );

window.examVerseCaptchaId =
    widgetId;

            captchaRendered =
                true;


            container.dataset.rendered =
                "true";


        }
        catch (error) {

            console.error(
                "ExamVerse CAPTCHA render error:",
                error
            );

            /*
                If Google wasn't ready
                completely, try again.
            */

            setTimeout(
                renderCaptcha,
                500
            );

        }

    }


    /*
        Wait until the complete page
        has loaded.

        This is more reliable than
        depending only on DOMContentLoaded.
    */

    window.addEventListener(
        "load",
        function () {

            renderCaptcha();

        }
    );


    /*
        Backup attempt.

        Useful when Google's script
        finishes after the page load.
    */

    setTimeout(
        renderCaptcha,
        500
    );


    setTimeout(
        renderCaptcha,
        1500
    );


    setTimeout(
        renderCaptcha,
        3000
    );


})();