/* ==================================================
   RAILPULSE — RAIL CORRUGATION PAGE
   Demonstration data until the real model is connected
   ================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const inspectionSelector = document.querySelector(
        "#inspection-selector"
    );

    const railSideButtons = [
        ...document.querySelectorAll(".rail-side")
    ];

    const inspectionId = document.querySelector("#inspection-id");
    const trackSection = document.querySelector("#track-section");
    const detectedClass = document.querySelector("#detected-class");
    const modelConfidence = document.querySelector("#model-confidence");
    const inspectionTime = document.querySelector("#inspection-time");

    const selectedSideName = document.querySelector("#selected-side-name");
    const selectedSideStatus = document.querySelector(
        "#selected-side-status"
    );

    const conditionScore = document.querySelector("#condition-score");
    const conditionScale = document.querySelector(
        "#condition-scale-fill"
    );

    const roughnessValue = document.querySelector("#roughness-value");
    const frequencyValue = document.querySelector("#frequency-value");
    const amplitudeValue = document.querySelector("#amplitude-value");
    const classificationValue = document.querySelector(
        "#classification-value"
    );

    const recommendedAction = document.querySelector(
        "#recommended-action"
    );

    const markerPosition = document.querySelector("#marker-position");
    const inspectionMarker = document.querySelector(
        "#inspection-marker"
    );

    const profileLine = document.querySelector("#profile-line");
    const profileArea = document.querySelector("#profile-area");


    /* ==================================================
       DEMONSTRATION DATA

       Later, replace this with the result from the
       rail corrugation model.
       ================================================== */

    const inspectionData = {
        "001": {
            id: "RC-001",
            section: "EW-14 / 320 m",
            detectedClass: "Normal",
            confidence: 96,
            time: "14:42:10",
            marker: 160,

            sides: {
                "side-1": {
                    name: "Side I",
                    classification: "Normal",
                    conditionScore: 94,
                    roughness: 0.18,
                    frequency: 42,
                    amplitude: 0.12,
                    action: "Continue routine inspection",
                    profile: [
                        220, 212, 218, 205, 214, 210, 220,
                        208, 215, 206, 211, 216, 207, 218,
                        210, 215, 205, 212, 216, 208, 214,
                        206, 216, 210, 218, 212
                    ]
                },

                "side-2": {
                    name: "Side II",
                    classification: "Normal",
                    conditionScore: 91,
                    roughness: 0.23,
                    frequency: 45,
                    amplitude: 0.17,
                    action: "Continue routine inspection",
                    profile: [
                        214, 207, 216, 203, 211, 219, 206,
                        212, 202, 214, 208, 217, 204, 211,
                        201, 215, 207, 218, 205, 213, 203,
                        216, 208, 214, 204, 210
                    ]
                }
            }
        },

        "002": {
            id: "RC-002",
            section: "NS-09 / 185 m",
            detectedClass: "Side II",
            confidence: 91,
            time: "14:48:31",
            marker: 115,

            sides: {
                "side-1": {
                    name: "Side I",
                    classification: "Normal",
                    conditionScore: 88,
                    roughness: 0.27,
                    frequency: 48,
                    amplitude: 0.21,
                    action: "Continue routine inspection",
                    profile: [
                        212, 205, 215, 202, 210, 219, 204,
                        213, 201, 209, 217, 205, 212, 200,
                        214, 207, 218, 203, 211, 199, 216,
                        206, 213, 202, 215, 208
                    ]
                },

                "side-2": {
                    name: "Side II",
                    classification: "Corrugation detected",
                    conditionScore: 58,
                    roughness: 0.71,
                    frequency: 79,
                    amplitude: 0.54,
                    action: "Schedule rail grinding inspection",
                    profile: [
                        210, 167, 224, 141, 218, 122, 230,
                        111, 226, 130, 216, 102, 235, 119,
                        225, 96, 231, 115, 220, 105, 234,
                        124, 218, 137, 227, 151
                    ]
                }
            }
        },

        "003": {
            id: "RC-003",
            section: "CC-21 / 440 m",
            detectedClass: "Normal",
            confidence: 94,
            time: "15:02:46",
            marker: 210,

            sides: {
                "side-1": {
                    name: "Side I",
                    classification: "Normal",
                    conditionScore: 90,
                    roughness: 0.24,
                    frequency: 46,
                    amplitude: 0.19,
                    action: "Continue routine inspection",
                    profile: [
                        217, 209, 214, 205, 219, 208, 215,
                        203, 212, 218, 207, 213, 201, 216,
                        209, 219, 205, 211, 204, 217, 208,
                        215, 202, 212, 206, 218
                    ]
                },

                "side-2": {
                    name: "Side II",
                    classification: "Normal",
                    conditionScore: 92,
                    roughness: 0.21,
                    frequency: 43,
                    amplitude: 0.15,
                    action: "Continue routine inspection",
                    profile: [
                        221, 214, 218, 207, 215, 211, 220,
                        209, 216, 205, 213, 219, 210, 217,
                        208, 214, 221, 211, 216, 206, 215,
                        209, 219, 212, 217, 210
                    ]
                }
            }
        },

        "004": {
            id: "RC-004",
            section: "DT-12 / 275 m",
            detectedClass: "Side I",
            confidence: 89,
            time: "15:11:08",
            marker: 92,

            sides: {
                "side-1": {
                    name: "Side I",
                    classification: "Corrugation detected",
                    conditionScore: 61,
                    roughness: 0.66,
                    frequency: 73,
                    amplitude: 0.49,
                    action: "Inspect Side I within 48 hours",
                    profile: [
                        214, 172, 220, 148, 228, 129, 217,
                        110, 235, 121, 223, 99, 229, 117,
                        219, 106, 237, 128, 225, 112, 232,
                        137, 218, 144, 227, 158
                    ]
                },

                "side-2": {
                    name: "Side II",
                    classification: "Normal",
                    conditionScore: 87,
                    roughness: 0.3,
                    frequency: 51,
                    amplitude: 0.23,
                    action: "Continue routine inspection",
                    profile: [
                        211, 202, 216, 199, 208, 218, 201,
                        213, 197, 210, 219, 204, 215, 198,
                        211, 206, 217, 200, 214, 196, 209,
                        218, 203, 212, 199, 216
                    ]
                }
            }
        },

        "005": {
            id: "RC-005",
            section: "NE-07 / 510 m",
            detectedClass: "Side II",
            confidence: 93,
            time: "15:19:54",
            marker: 245,

            sides: {
                "side-1": {
                    name: "Side I",
                    classification: "Normal",
                    conditionScore: 89,
                    roughness: 0.26,
                    frequency: 47,
                    amplitude: 0.2,
                    action: "Continue routine inspection",
                    profile: [
                        216, 208, 214, 201, 218, 205, 212,
                        200, 215, 207, 219, 203, 211, 198,
                        217, 206, 213, 202, 220, 204, 214,
                        199, 216, 208, 212, 205
                    ]
                },

                "side-2": {
                    name: "Side II",
                    classification: "Corrugation detected",
                    conditionScore: 55,
                    roughness: 0.76,
                    frequency: 82,
                    amplitude: 0.58,
                    action: "Prioritise rail surface maintenance",
                    profile: [
                        218, 160, 229, 136, 216, 105, 238,
                        118, 222, 91, 241, 112, 225, 98,
                        235, 120, 215, 87, 243, 109, 231,
                        127, 219, 141, 228, 152
                    ]
                }
            }
        },

        "006": {
            id: "RC-006",
            section: "TE-16 / 360 m",
            detectedClass: "Normal",
            confidence: 95,
            time: "15:27:22",
            marker: 178,

            sides: {
                "side-1": {
                    name: "Side I",
                    classification: "Normal",
                    conditionScore: 93,
                    roughness: 0.2,
                    frequency: 44,
                    amplitude: 0.14,
                    action: "Continue routine inspection",
                    profile: [
                        220, 213, 217, 209, 215, 221, 211,
                        218, 207, 214, 219, 210, 216, 205,
                        213, 220, 209, 217, 208, 215, 219,
                        211, 216, 206, 214, 218
                    ]
                },

                "side-2": {
                    name: "Side II",
                    classification: "Normal",
                    conditionScore: 90,
                    roughness: 0.25,
                    frequency: 49,
                    amplitude: 0.19,
                    action: "Continue routine inspection",
                    profile: [
                        215, 205, 218, 202, 212, 220, 204,
                        216, 200, 210, 219, 206, 214, 201,
                        217, 207, 221, 203, 213, 198, 216,
                        208, 218, 202, 211, 205
                    ]
                }
            }
        }
    };


    /* ==================================================
       ACTIVE STATE
       ================================================== */

    let activeInspection = inspectionSelector?.value || "001";
    let activeSide = "side-1";


    function isWarning(sideData) {
        return sideData.classification !== "Normal";
    }


    function updateText(element, value) {
        if (element) {
            element.textContent = value;
        }
    }


    /* ==================================================
       CREATE SVG PROFILE PATH
       ================================================== */

    function createProfilePath(points, closeArea = false) {
        if (!points.length) {
            return "";
        }

        const chartWidth = 1000;
        const chartHeight = 300;
        const step = chartWidth / (points.length - 1);

        let path = points
            .map((point, index) => {
                const x = Math.round(index * step);

                return `${index === 0 ? "M" : "L"}${x} ${point}`;
            })
            .join(" ");

        if (closeArea) {
            path += ` L${chartWidth} ${chartHeight}`;
            path += ` L0 ${chartHeight} Z`;
        }

        return path;
    }


    /* ==================================================
       RENDER COMPLETE INSPECTION
       ================================================== */

    function renderInspection(inspectionNumber) {
        const inspection = inspectionData[inspectionNumber];

        if (!inspection) {
            return;
        }

        activeInspection = inspectionNumber;

        /*
         * Automatically select the affected side.
         * For a normal record, Side I remains selected.
         */

        if (inspection.detectedClass === "Side II") {
            activeSide = "side-2";
        } else {
            activeSide = "side-1";
        }

        updateText(inspectionId, inspection.id);
        updateText(trackSection, inspection.section);
        updateText(detectedClass, inspection.detectedClass);
        updateText(modelConfidence, `${inspection.confidence}%`);
        updateText(inspectionTime, inspection.time);
        updateText(markerPosition, `${inspection.marker} m`);

        updateSummaryStatus(inspection);
        updateMarker(inspection);
        updateRailButtons(inspection);
        renderSide(activeSide);
    }


    /* ==================================================
       SUMMARY CONDITION
       ================================================== */

    function updateSummaryStatus(inspection) {
        if (!detectedClass) {
            return;
        }

        const warning = inspection.detectedClass !== "Normal";

        detectedClass.classList.toggle("summary-warning", warning);
        detectedClass.classList.toggle("summary-normal", !warning);
    }


    /* ==================================================
       INSPECTION MARKER
       ================================================== */

    function updateMarker(inspection) {
        if (!inspectionMarker) {
            return;
        }

        /*
         * Convert the inspection position into a visual
         * percentage while keeping it inside the map.
         */

        const maximumDistance = Number(
            inspection.section.match(/(\d+)\s*m/)?.[1] || 320
        );

        const percentage = Math.max(
            7,
            Math.min(
                93,
                (inspection.marker / maximumDistance) * 100
            )
        );

        inspectionMarker.style.left = `${percentage}%`;
    }


    /* ==================================================
       UPDATE SIDE BUTTONS
       ================================================== */

    function updateRailButtons(inspection) {
        railSideButtons.forEach((button) => {
            const sideKey = button.dataset.side;
            const sideData = inspection.sides[sideKey];

            if (!sideData) {
                return;
            }

            const selected = sideKey === activeSide;
            const warning = isWarning(sideData);

            button.classList.toggle("selected", selected);
            button.classList.toggle("warning-side", warning);

            button.setAttribute(
                "aria-pressed",
                selected ? "true" : "false"
            );

            const condition = button.querySelector(".side-condition");

            updateText(
                condition,
                warning ? "Corrugation" : "Normal"
            );
        });
    }


    /* ==================================================
       RENDER SELECTED SIDE
       ================================================== */

    function renderSide(sideKey) {
        const inspection = inspectionData[activeInspection];
        const sideData = inspection?.sides[sideKey];

        if (!sideData) {
            return;
        }

        activeSide = sideKey;

        const warning = isWarning(sideData);

        updateRailButtons(inspection);

        updateText(selectedSideName, sideData.name);
        updateText(selectedSideStatus, sideData.classification);

        if (selectedSideStatus) {
            selectedSideStatus.classList.toggle(
                "warning-status",
                warning
            );

            selectedSideStatus.classList.toggle(
                "normal-status",
                !warning
            );
        }

        if (conditionScore) {
            conditionScore.innerHTML = `
                ${sideData.conditionScore}
                <small>/100</small>
            `;
        }

        if (conditionScale) {
            conditionScale.style.setProperty(
                "--condition-width",
                `${sideData.conditionScore}%`
            );

            conditionScale.style.width =
                `${sideData.conditionScore}%`;

            conditionScale.classList.toggle(
                "warning-fill",
                warning
            );
        }

        updateText(
            roughnessValue,
            sideData.roughness.toFixed(2)
        );

        updateText(
            frequencyValue,
            `${sideData.frequency} Hz`
        );

        updateText(
            amplitudeValue,
            `${sideData.amplitude.toFixed(2)} mm`
        );

        updateText(
            classificationValue,
            sideData.classification
        );

        updateText(
            recommendedAction,
            sideData.action
        );

        updateProfile(sideData, warning);
    }


    /* ==================================================
       UPDATE PROFILE GRAPH
       ================================================== */

    function updateProfile(sideData, warning) {
        const linePath = createProfilePath(
            sideData.profile,
            false
        );

        const areaPath = createProfilePath(
            sideData.profile,
            true
        );

        profileLine?.setAttribute("d", linePath);
        profileArea?.setAttribute("d", areaPath);

        profileLine?.classList.toggle(
            "warning-profile",
            warning
        );
    }


    /* ==================================================
       EVENTS
       ================================================== */

    inspectionSelector?.addEventListener("change", (event) => {
        renderInspection(event.target.value);
    });


    railSideButtons.forEach((button, index) => {
        button.addEventListener("click", () => {
            renderSide(button.dataset.side);
        });


        /*
         * Keyboard support:
         * left/right/up/down changes the selected rail.
         */

        button.addEventListener("keydown", (event) => {
            const allowedKeys = [
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown",
                "Home",
                "End"
            ];

            if (!allowedKeys.includes(event.key)) {
                return;
            }

            event.preventDefault();

            let nextIndex = index;

            if (
                event.key === "ArrowRight" ||
                event.key === "ArrowDown"
            ) {
                nextIndex = (index + 1) % railSideButtons.length;
            }

            if (
                event.key === "ArrowLeft" ||
                event.key === "ArrowUp"
            ) {
                nextIndex =
                    (index - 1 + railSideButtons.length) %
                    railSideButtons.length;
            }

            if (event.key === "Home") {
                nextIndex = 0;
            }

            if (event.key === "End") {
                nextIndex = railSideButtons.length - 1;
            }

            railSideButtons[nextIndex].focus();
            railSideButtons[nextIndex].click();
        });
    });


    /* ==================================================
       INITIAL PAGE
       ================================================== */

    renderInspection(activeInspection);
});