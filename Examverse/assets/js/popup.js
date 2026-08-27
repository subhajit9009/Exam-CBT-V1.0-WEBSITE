/* =========================================================
   ExamVerse Global Popup System
   popup.js

   Reusable across the entire ExamVerse website.

   Available functions:

   showPopup(type, title, message, options)
   showConfirm(title, message, onConfirm, options)
   hidePopup()

   showConfirm() supports:

   1. Promise / await
      const confirmed = await showConfirm(...);

   2. Callback
      showConfirm(..., function () {
          // confirmed
      });

========================================================= */

(function () {

    "use strict";


    /* =====================================================
       PREVENT DUPLICATE INITIALIZATION
    ===================================================== */

    if (window.ExamVersePopup) {
        return;
    }


    /* =====================================================
       POPUP STATE
    ===================================================== */

    let popupOverlay = null;

    let currentConfirmResolve = null;

    let currentConfirmCallback = null;

    let currentCancelCallback = null;

    let autoCloseTimer = null;


    /* =====================================================
       CREATE POPUP SYSTEM
    ===================================================== */

    function createPopupSystem() {

        if (
            document.getElementById(
                "examversePopupOverlay"
            )
        ) {

            popupOverlay =
                document.getElementById(
                    "examversePopupOverlay"
                );

            return;
        }


        popupOverlay =
            document.createElement("div");

        popupOverlay.id =
            "examversePopupOverlay";


        popupOverlay.innerHTML = `

            <div
                class="ev-popup-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="evPopupTitle"
                aria-describedby="evPopupMessage"
            >

                <button
                    type="button"
                    class="ev-popup-close"
                    id="evPopupClose"
                    aria-label="Close popup"
                >
                    ×
                </button>


                <div
                    class="ev-popup-icon"
                    id="evPopupIcon"
                    aria-hidden="true"
                >
                </div>


                <h2
                    class="ev-popup-title"
                    id="evPopupTitle"
                >
                </h2>


                <div
                    class="ev-popup-message"
                    id="evPopupMessage"
                >
                </div>


                <div
                    class="ev-popup-actions"
                    id="evPopupActions"
                >

                    <button
                        type="button"
                        class="
                            ev-popup-btn
                            ev-popup-primary-btn
                        "
                        id="evPopupPrimary"
                    >
                        OK
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            popupOverlay
        );


        /* =================================================
           CLOSE BUTTON
        ================================================= */

        const closeButton =
            document.getElementById(
                "evPopupClose"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                function () {

                    finishPopup(false);

                }
            );

        }


        /* =================================================
           PRIMARY BUTTON
        ================================================= */

        const primaryButton =
            document.getElementById(
                "evPopupPrimary"
            );


        if (primaryButton) {

            primaryButton.addEventListener(
                "click",
                function () {

                    finishPopup(true);

                }
            );

        }


        /* =================================================
           CLICK OUTSIDE POPUP
        ================================================= */

        popupOverlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    popupOverlay
                ) {

                    finishPopup(false);

                }

            }
        );

    }


    /* =====================================================
       ICONS
    ===================================================== */

    function getIcon(type) {

        switch (type) {

            case "success":
                return "✓";


            case "error":
                return "×";


            case "warning":
                return "!";


            case "info":
                return "i";


            case "confirm":
                return "?";


            case "loading":

                return `
                    <div
                        class="ev-popup-spinner"
                    ></div>
                `;


            default:
                return "i";

        }

    }


    /* =====================================================
       NORMALIZE TYPE
    ===================================================== */

    function normalizeType(type) {

        const allowedTypes = [

            "success",
            "error",
            "warning",
            "info",
            "confirm",
            "loading"

        ];


        if (
            allowedTypes.includes(type)
        ) {

            return type;

        }


        return "info";

    }


    /* =====================================================
       CLEAR CALLBACK / PROMISE STATE
    ===================================================== */

    function clearState() {

        currentConfirmResolve =
            null;

        currentConfirmCallback =
            null;

        currentCancelCallback =
            null;

    }


    /* =====================================================
       SHOW NORMAL POPUP
    ===================================================== */

    function showPopup(
        type,
        title,
        message,
        options = {}
    ) {

        createPopupSystem();


        type =
            normalizeType(type);


        if (autoCloseTimer) {

            clearTimeout(
                autoCloseTimer
            );

            autoCloseTimer = null;

        }


        clearState();


        const icon =
            document.getElementById(
                "evPopupIcon"
            );


        const titleElement =
            document.getElementById(
                "evPopupTitle"
            );


        const messageElement =
            document.getElementById(
                "evPopupMessage"
            );


        const actions =
            document.getElementById(
                "evPopupActions"
            );


        const primaryButton =
            document.getElementById(
                "evPopupPrimary"
            );


        const closeButton =
            document.getElementById(
                "evPopupClose"
            );


        const card =
            popupOverlay.querySelector(
                ".ev-popup-card"
            );


        /* =================================================
           RESET CARD
        ================================================= */

        card.className =
            "ev-popup-card";


        card.classList.add(
            "ev-popup-" + type
        );


        /* =================================================
           CONTENT
        ================================================= */

        icon.innerHTML =
            getIcon(type);


        titleElement.textContent =
            title || "";


        messageElement.textContent =
            message || "";


        /* =================================================
           RESET ACTION AREA
        ================================================= */

        actions.innerHTML = `

            <button
                type="button"
                class="
                    ev-popup-btn
                    ev-popup-primary-btn
                "
                id="evPopupPrimary"
            >
                OK
            </button>

        `;


        const newPrimaryButton =
            document.getElementById(
                "evPopupPrimary"
            );


        /* =================================================
           BUTTON TEXT
        ================================================= */

        newPrimaryButton.textContent =
            options.buttonText ||
            (
                type === "success"
                    ? "Continue"
                    : "OK"
            );


        /* =================================================
           BUTTON COLOR
        ================================================= */

        newPrimaryButton.className =
            "ev-popup-btn";


        if (type === "success") {

            newPrimaryButton.classList.add(
                "ev-popup-success-btn"
            );

        }

        else if (type === "error") {

            newPrimaryButton.classList.add(
                "ev-popup-error-btn"
            );

        }

        else {

            newPrimaryButton.classList.add(
                "ev-popup-primary-btn"
            );

        }


        /* =================================================
           CLOSE BUTTON
        ================================================= */

        if (
            options.showClose === false ||
            type === "loading"
        ) {

            closeButton.style.display =
                "none";

        }

        else {

            closeButton.style.display =
                "flex";

        }


        /* =================================================
           LOADING
        ================================================= */

        if (type === "loading") {

            newPrimaryButton.style.display =
                "none";

        }

        else {

            newPrimaryButton.style.display =
                "inline-flex";


            newPrimaryButton.addEventListener(
                "click",
                function () {

                    hidePopup();

                    if (
                        typeof options.onClose ===
                        "function"
                    ) {

                        options.onClose();

                    }

                }
            );

        }


        /* =================================================
           SHOW
        ================================================= */

        popupOverlay.classList.add(
            "ev-popup-visible"
        );


        document.body.classList.add(
            "ev-popup-open"
        );


        /* =================================================
           AUTO CLOSE
        ================================================= */

        if (
            typeof options.autoClose ===
            "number" &&
            options.autoClose > 0
        ) {

            autoCloseTimer =
                setTimeout(
                    function () {

                        hidePopup();

                    },
                    options.autoClose
                );

        }


        /* =================================================
           FOCUS
        ================================================= */

        setTimeout(
            function () {

                if (
                    newPrimaryButton &&
                    newPrimaryButton.style.display !==
                    "none"
                ) {

                    newPrimaryButton.focus();

                }

            },
            50
        );

    }


    /* =====================================================
       SHOW CONFIRMATION

       Supports BOTH:

       await showConfirm(...)

       AND

       showConfirm(..., callback)

    ===================================================== */

    function showConfirm(
        title,
        message,
        onConfirm,
        options = {}
    ) {

        /*
         * Support this format:
         *
         * showConfirm(
         *     title,
         *     message,
         *     options
         * );
         */

        if (
            onConfirm &&
            typeof onConfirm === "object" &&
            !options
        ) {

            options =
                onConfirm;

            onConfirm =
                null;

        }


        /*
         * If the third argument is an object,
         * treat it as options.
         */

        if (
            onConfirm &&
            typeof onConfirm === "object"
        ) {

            options =
                onConfirm;

            onConfirm =
                null;

        }


        createPopupSystem();


        if (autoCloseTimer) {

            clearTimeout(
                autoCloseTimer
            );

            autoCloseTimer = null;

        }


        clearState();


        /* =================================================
           RETURN PROMISE
        ================================================= */

        return new Promise(
            function (resolve) {

                currentConfirmResolve =
                    resolve;


                currentConfirmCallback =
                    typeof onConfirm ===
                    "function"
                        ? onConfirm
                        : null;


                currentCancelCallback =
                    typeof options.onCancel ===
                    "function"
                        ? options.onCancel
                        : null;


                const icon =
                    document.getElementById(
                        "evPopupIcon"
                    );


                const titleElement =
                    document.getElementById(
                        "evPopupTitle"
                    );


                const messageElement =
                    document.getElementById(
                        "evPopupMessage"
                    );


                const actions =
                    document.getElementById(
                        "evPopupActions"
                    );


                const closeButton =
                    document.getElementById(
                        "evPopupClose"
                    );


                const card =
                    popupOverlay.querySelector(
                        ".ev-popup-card"
                    );


                /* =========================================
                   RESET CARD
                ========================================= */

                card.className =
                    "ev-popup-card";


                card.classList.add(
                    "ev-popup-confirm"
                );


                /* =========================================
                   CONTENT
                ========================================= */

                icon.innerHTML =
                    getIcon("confirm");


                titleElement.textContent =
                    title ||
                    "Are you sure?";


                messageElement.textContent =
                    message ||
                    "";


                /* =========================================
                   BUTTONS
                ========================================= */

                actions.innerHTML = `

                    <button
                        type="button"
                        class="
                            ev-popup-btn
                            ev-popup-secondary-btn
                        "
                        id="evPopupCancel"
                    >
                        ${
                            options.cancelText ||
                            "Cancel"
                        }
                    </button>


                    <button
                        type="button"
                        class="
                            ev-popup-btn
                            ev-popup-primary-btn
                        "
                        id="evPopupConfirm"
                    >
                        ${
                            options.confirmText ||
                            "Continue"
                        }
                    </button>

                `;


                closeButton.style.display =
                    "flex";


                /* =========================================
                   CANCEL BUTTON
                ========================================= */

                const cancelButton =
                    document.getElementById(
                        "evPopupCancel"
                    );


                cancelButton.addEventListener(
                    "click",
                    function () {

                        finishPopup(false);

                    }
                );


                /* =========================================
                   CONFIRM BUTTON
                ========================================= */

                const confirmButton =
                    document.getElementById(
                        "evPopupConfirm"
                    );


                confirmButton.addEventListener(
                    "click",
                    function () {

                        finishPopup(true);

                    }
                );


                /* =========================================
                   SHOW
                ========================================= */

                popupOverlay.classList.add(
                    "ev-popup-visible"
                );


                document.body.classList.add(
                    "ev-popup-open"
                );


                /* =========================================
                   FOCUS
                ========================================= */

                setTimeout(
                    function () {

                        confirmButton.focus();

                    },
                    50
                );

            }
        );

    }


    /* =====================================================
       FINISH POPUP
    ===================================================== */

    function finishPopup(
        confirmed
    ) {

        if (!popupOverlay) {

            return;

        }


        if (autoCloseTimer) {

            clearTimeout(
                autoCloseTimer
            );

            autoCloseTimer = null;

        }


        const resolve =
            currentConfirmResolve;


        const confirmCallback =
            currentConfirmCallback;


        const cancelCallback =
            currentCancelCallback;


        clearState();


        hidePopup();


        /* =================================================
           RESOLVE PROMISE
        ================================================= */

        if (
            typeof resolve ===
            "function"
        ) {

            resolve(
                Boolean(confirmed)
            );

        }


        /* =================================================
           CALLBACK COMPATIBILITY
        ================================================= */

        setTimeout(
            function () {

                if (
                    confirmed &&
                    typeof confirmCallback ===
                    "function"
                ) {

                    confirmCallback();

                }


                if (
                    !confirmed &&
                    typeof cancelCallback ===
                    "function"
                ) {

                    cancelCallback();

                }

            },
            50
        );

    }


    /* =====================================================
       HIDE POPUP
    ===================================================== */

    function hidePopup() {

        if (!popupOverlay) {

            return;

        }


        popupOverlay.classList.remove(
            "ev-popup-visible"
        );


        document.body.classList.remove(
            "ev-popup-open"
        );


        if (autoCloseTimer) {

            clearTimeout(
                autoCloseTimer
            );

            autoCloseTimer = null;

        }


        clearState();

    }


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                popupOverlay &&
                popupOverlay.classList.contains(
                    "ev-popup-visible"
                )
            ) {

                finishPopup(false);

            }

        }
    );


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initialize() {

        createPopupSystem();


        window.ExamVersePopup = {

            show:
                showPopup,

            confirm:
                showConfirm,

            hide:
                hidePopup

        };


        window.showPopup =
            showPopup;


        window.showConfirm =
            showConfirm;


        window.hidePopup =
            hidePopup;

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    }

    else {

        initialize();

    }

})();