window.addEventListener("load", () => {

    const loader = document.getElementById("loader");

    // If this page does not have a loader, do nothing
    if (!loader) {
        return;
    }

    loader.style.opacity = "0";

    setTimeout(() => {

        loader.style.display = "none";

    }, 500);

});