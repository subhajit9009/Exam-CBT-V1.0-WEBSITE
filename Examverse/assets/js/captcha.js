/* =========================================================
   ExamVerse Google reCAPTCHA v2
   Responsive normal / compact renderer
========================================================= */

(function () {

    const SITE_KEY =
        "6Le9L50tAAAAAHV0kR_kRycTmPYIJVViX4fgJwAy";


    function renderCaptcha() {

        const container =
            document.getElementById(
                "registerCaptcha"
            );

        if (!container) {
            return;
        }

        /*
            Wait until Google's API is ready.
        */

        if (
            typeof grecaptcha ===
            "undefined"
        ) {

            setTimeout(
                renderCaptcha,
                200
            );

            return;

        }


        /*
            Prevent rendering twice.
        */

        if (
            container.dataset.rendered ===
            "true"
        ) {

            return;

        }


        /*
            Check the actual available width.
        */

        const width =
            container.parentElement
                ? container.parentElement
                    .getBoundingClientRect()
                    .width
                : window.innerWidth;


        /*
            Google officially supports:
            
            normal  = 304px
            compact = 164px

            Use compact when the
            available area is too narrow.
        */

        const size =
            width < 304
                ? "compact"
                : "normal";


        grecaptcha.render(
            container,
            {
                sitekey: SITE_KEY,
                size: size
            }
        );


        container.dataset.rendered =
            "true";

    }


    /*
        Wait for page + Google.
    */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            renderCaptcha
        );

    }
    else {

        renderCaptcha();

    }


    /*
        Re-evaluate after orientation
        changes / resizing.

        We don't re-render the existing
        Google widget because Google
        does not support changing its
        size after rendering.
    */

    window.addEventListener(
        "orientationchange",
        function () {

            /*
                Page reload is intentionally
                avoided here.

                The widget remains stable.
            */

        }
    );

})();