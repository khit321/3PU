const keyboardNavigation = document.querySelector("[data-keyboard-nav]");

if (keyboardNavigation) {
    const links = [
        ...keyboardNavigation.querySelectorAll(".navigation-link")
    ];

    keyboardNavigation.addEventListener("keydown", (event) => {
        const currentIndex = links.indexOf(document.activeElement);

        if (currentIndex < 0) {
            return;
        }

        let nextIndex = currentIndex;

        if (event.key === "ArrowRight") {
            nextIndex = (currentIndex + 1) % links.length;
        }

        if (event.key === "ArrowLeft") {
            nextIndex =
                (currentIndex - 1 + links.length) % links.length;
        }

        if (event.key === "Home") {
            nextIndex = 0;
        }

        if (event.key === "End") {
            nextIndex = links.length - 1;
        }

        if (nextIndex !== currentIndex) {
            event.preventDefault();
            links[nextIndex].focus();
        }
    });
}
function continueNavigationTrain() {
    const train = document.querySelector(".moving-train");

    if (!train) {
        return;
    }

    const durationMilliseconds = 18000;
    const storageKey = "railpulse-navigation-train-start";

    let startingTime = Number(
        localStorage.getItem(storageKey)
    );

    if (!Number.isFinite(startingTime) || startingTime <= 0) {
        startingTime = Date.now();
        localStorage.setItem(storageKey, String(startingTime));
    }

    const elapsedMilliseconds =
        (Date.now() - startingTime) % durationMilliseconds;

    const elapsedSeconds = elapsedMilliseconds / 1000;

    train.style.setProperty(
        "--train-animation-delay",
        `-${elapsedSeconds}s`
    );
}


document.addEventListener("DOMContentLoaded", () => {
    const movingTrain = document.querySelector(".moving-train");

    if (!movingTrain) return;

    const animationDuration = 18000;
    const storageKey = "railpulse-train-start-time";

    let startTime = Number(sessionStorage.getItem(storageKey));

    if (!startTime) {
        startTime = Date.now();
        sessionStorage.setItem(storageKey, String(startTime));
    }

    const elapsedTime = Date.now() - startTime;
    const currentPosition = elapsedTime % animationDuration;

    movingTrain.style.animationDuration = `${animationDuration}ms`;
    movingTrain.style.animationDelay = `-${currentPosition}ms`;
});
document.addEventListener("DOMContentLoaded", () => {
    const navigation = document.querySelector(".top-navigation");

    if (!navigation) return;

    function updateNavigationAppearance() {
        navigation.classList.toggle(
            "navigation-scrolled",
            window.scrollY > 30
        );
    }

    updateNavigationAppearance();

    window.addEventListener(
        "scroll",
        updateNavigationAppearance,
        { passive: true }
    );
});