(function () {

    const savedTheme =
        localStorage.getItem("examverse_theme") || "light";

    if (savedTheme === "dark") {
        document.documentElement.classList.add("dark-mode");
    } else {
        document.documentElement.classList.remove("dark-mode");
    }

})();