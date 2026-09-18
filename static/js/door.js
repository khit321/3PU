document.addEventListener("DOMContentLoaded", () => {
    const dashboard = document.querySelector(".door-dashboard");

    if (!dashboard) return;


    /* ==================================================
       TEMPORARY DASHBOARD DATA

       This object will later be replaced by:
       fetch("/api/doors")
       ================================================== */

    const doorData = {
        "D1-01": {
            name: "Door D1-01",
            state: "Closed",
            command: "No active command",
            motorCurrent: 5.7,
            motorVoltage: 50.0,
            position: 0,
            openingTime: 2.3,
            closingTime: 3.6,
            force: 842,
            locked: true,
            status: "normal",
            statusLabel: "Normal"
        },

        "D2-02": {
            name: "Door D2-02",
            state: "Open",
            command: "Open command completed",
            motorCurrent: 5.9,
            motorVoltage: 50.0,
            position: 100,
            openingTime: 2.4,
            closingTime: 3.7,
            force: 876,
            locked: false,
            status: "normal",
            statusLabel: "Normal"
        },

        "D3-04": {
            name: "Door D3-04",
            state: "Closing",
            command: "Close command active",
            motorCurrent: 8.4,
            motorVoltage: 50.0,
            position: 38,
            openingTime: 2.4,
            closingTime: 4.8,
            force: 1045,
            locked: false,
            status: "attention",
            statusLabel: "Attention"
        },

        "D4-01": {
            name: "Door D4-01",
            state: "Closed",
            command: "Door locked",
            motorCurrent: 5.5,
            motorVoltage: 49.8,
            position: 0,
            openingTime: 2.3,
            closingTime: 3.5,
            force: 821,
            locked: true,
            status: "normal",
            statusLabel: "Normal"
        }
    };


    /* ==================================================
       CHART DATA
       ================================================== */

    const chartPaths = {
        normal: {
            30: `
                M60 242
                C110 236 145 244 190 232
                S270 224 315 233
                S390 241 435 226
                S510 217 555 229
                S635 239 680 225
                S755 215 800 228
                S895 235 970 224
            `,

            300: `
                M60 235
                C115 218 160 239 215 225
                S315 215 370 231
                S470 240 525 220
                S630 210 685 228
                S785 236 840 218
                S925 210 970 226
            `,

            1800: `
                M60 230
                C140 217 195 236 275 224
                S420 214 500 229
                S645 237 725 219
                S875 211 970 225
            `
        },

        attention: {
            30: `
                M60 242
                C100 235 130 240 165 232
                S230 220 270 226
                S335 240 375 224
                S440 212 480 220
                S545 234 585 214
                S650 190 690 180
                S745 153 785 112
                S850 76 900 95
                S945 116 970 104
            `,

            300: `
                M60 238
                C120 229 160 241 220 230
                S330 218 390 232
                S500 242 560 218
                S670 196 730 170
                S820 125 870 146
                S930 123 970 137
            `,

            1800: `
                M60 235
                C135 225 195 239 270 229
                S420 215 495 232
                S640 224 710 198
                S820 170 875 145
                S940 130 970 139
            `
        }
    };


    const chartPoints = {
        normal: {
            30: { x: 970, y: 224 },
            300: { x: 970, y: 226 },
            1800: { x: 970, y: 225 }
        },

        attention: {
            30: { x: 970, y: 104 },
            300: { x: 970, y: 137 },
            1800: { x: 970, y: 139 }
        }
    };


    /* ==================================================
       ELEMENTS
       ================================================== */

    const trainSelector = document.querySelector("#door-train");
    const doorSelector = document.querySelector("#door-asset");

    const elements = {
        state: document.querySelector("#current-door-state"),
        command: document.querySelector("#current-command"),
        motorCurrent: document.querySelector("#current-motor-current"),
        motorVoltage: document.querySelector("#current-motor-voltage"),
        position: document.querySelector("#current-door-position"),

        chartCurrent: document.querySelector("#chart-current-value"),
        chartPath: document.querySelector("#motor-current-path"),
        chartPoint: document.querySelector("#latest-signal-point"),
        chartStatus: document.querySelector("#signal-status"),

        doorName: document.querySelector("#mechanism-door-name"),
        componentStatus: document.querySelector("#component-status"),

        doorMechanism: document.querySelector("#door-mechanism"),
        opening: document.querySelector("#door-opening"),
        positionIndicator: document.querySelector(
            "#door-position-indicator"
        ),

        openingTime: document.querySelector("#opening-time"),
        closingTime: document.querySelector("#closing-time"),
        force: document.querySelector("#electrodynamic-force"),
        locked: document.querySelector("#door-locked"),

        cycleBody: document.querySelector("#door-cycle-body")
    };

    const timeButtons = [
        ...document.querySelectorAll(".time-button")
    ];

    let selectedRange = 30;


    /* ==================================================
       HELPERS
       ================================================== */

    const setText = (element, value) => {
        if (element) {
            element.textContent = value;
        }
    };


    const getSelectedDoor = () => {
        const selectedId = doorSelector?.value || "D3-04";

        return doorData[selectedId] || doorData["D3-04"];
    };


    /* ==================================================
       PHYSICAL DOOR POSITION
       ================================================== */

    const updateDoorPosition = (position) => {
        const safePosition = Math.max(
            0,
            Math.min(100, Number(position))
        );

        const leftLeaf = document.querySelector(
            ".door-leaf-left"
        );

        const rightLeaf = document.querySelector(
            ".door-leaf-right"
        );

        const movement = safePosition * 0.48;

        if (leftLeaf) {
            leftLeaf.style.transform =
                `translateX(-${movement}%)`;
        }

        if (rightLeaf) {
            rightLeaf.style.transform =
                `translateX(${movement}%)`;
        }

        if (elements.opening) {
            elements.opening.style.setProperty(
                "--door-opening",
                `${safePosition * 0.72}%`
            );
        }

        if (elements.positionIndicator) {
            elements.positionIndicator.style.left =
                `${safePosition}%`;
        }

        elements.doorMechanism?.classList.toggle(
            "is-open",
            safePosition >= 95
        );
    };


    /* ==================================================
       CHART
       ================================================== */

    const updateChart = () => {
        const door = getSelectedDoor();

        const condition =
            door.status === "attention"
                ? "attention"
                : "normal";

        const path =
            chartPaths[condition][selectedRange];

        const point =
            chartPoints[condition][selectedRange];

        if (elements.chartPath) {
            elements.chartPath.setAttribute(
                "d",
                path.replace(/\s+/g, " ").trim()
            );
        }

        if (elements.chartPoint) {
            elements.chartPoint.setAttribute(
                "cx",
                point.x
            );

            elements.chartPoint.setAttribute(
                "cy",
                point.y
            );
        }

        setText(
            elements.chartCurrent,
            `${door.motorCurrent.toFixed(1)} A`
        );
    };


    /* ==================================================
       CURRENT DOOR
       ================================================== */

    const renderDoor = () => {
        const door = getSelectedDoor();

        setText(elements.state, door.state);
        setText(elements.command, door.command);

        setText(
            elements.motorCurrent,
            `${door.motorCurrent.toFixed(1)} A`
        );

        setText(
            elements.motorVoltage,
            `${door.motorVoltage.toFixed(1)} V`
        );

        setText(
            elements.position,
            `${door.position}%`
        );

        setText(elements.doorName, door.name);
        setText(
            elements.componentStatus,
            door.statusLabel
        );

        setText(
            elements.openingTime,
            `${door.openingTime.toFixed(1)} s`
        );

        setText(
            elements.closingTime,
            `${door.closingTime.toFixed(1)} s`
        );

        setText(
            elements.force,
            door.force.toLocaleString("en-SG")
        );

        setText(
            elements.locked,
            door.locked ? "Yes" : "No"
        );

        const warning =
            door.status === "attention";

        setText(
            elements.chartStatus,
            warning
                ? "Deviation detected"
                : "Within expected range"
        );

        elements.chartStatus?.classList.toggle(
            "signal-status-warning",
            warning
        );

        elements.componentStatus?.classList.toggle(
            "component-warning",
            warning
        );

        elements.componentStatus?.classList.toggle(
            "component-normal",
            !warning
        );

        updateDoorPosition(door.position);
        updateChart();
        updateCycleTable(door);
    };


    /* ==================================================
       RECENT CYCLES
       ================================================== */

    const updateCycleTable = (door) => {
        if (!elements.cycleBody) return;

        const isWarning =
            door.status === "attention";

        const currentValues = [
            {
                cycle: 1248,
                time: "14:32:16",
                current: door.motorCurrent,
                opening: door.openingTime,
                closing: door.closingTime,
                warning: isWarning
            },
            {
                cycle: 1247,
                time: "14:29:42",
                current: 6.3,
                opening: 2.4,
                closing: 3.7,
                warning: false
            },
            {
                cycle: 1246,
                time: "14:27:08",
                current: 6.1,
                opening: 2.3,
                closing: 3.6,
                warning: false
            },
            {
                cycle: 1245,
                time: "14:24:35",
                current: 6.4,
                opening: 2.4,
                closing: 3.8,
                warning: false
            },
            {
                cycle: 1244,
                time: "14:21:59",
                current: 6.2,
                opening: 2.4,
                closing: 3.7,
                warning: false
            }
        ];

        elements.cycleBody.innerHTML =
            currentValues
                .map((cycle) => {
                    const resultClass =
                        cycle.warning
                            ? "result-warning"
                            : "result-normal";

                    const result =
                        cycle.warning
                            ? "Attention"
                            : "Normal";

                    const rowClass =
                        cycle.warning
                            ? "cycle-warning"
                            : "";

                    return `
                        <tr class="${rowClass}">
                            <td>${cycle.cycle.toLocaleString("en-SG")}</td>
                            <td>${cycle.time}</td>
                            <td>${cycle.current.toFixed(1)} A</td>
                            <td>${cycle.opening.toFixed(1)} s</td>
                            <td>${cycle.closing.toFixed(1)} s</td>
                            <td>
                                <span class="${resultClass}">
                                    ${result}
                                </span>
                            </td>
                        </tr>
                    `;
                })
                .join("");
    };


    /* ==================================================
       EVENTS
       ================================================== */

    doorSelector?.addEventListener("change", () => {
        renderDoor();
    });


    trainSelector?.addEventListener("change", () => {
        /*
         * Temporary behaviour.
         * Later this will request the selected train's
         * model output from Flask.
         */

        if (trainSelector.value === "train-12") {
            doorSelector.value = "D2-02";
        } else {
            doorSelector.value = "D3-04";
        }

        renderDoor();
    });


    timeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            selectedRange = Number(
                button.dataset.range
            );

            timeButtons.forEach((item) => {
                item.classList.toggle(
                    "active",
                    item === button
                );
            });

            updateChart();
        });
    });


    /* ==================================================
       INITIAL RENDER
       ================================================== */

    renderDoor();
});