document.addEventListener("DOMContentLoaded", () => {
    const dashboard = document.querySelector(".overview-dashboard");

    if (!dashboard) {
        return;
    }


    /* ==================================================
       ELEMENT REFERENCES
       ================================================== */

    const trainSelector = dashboard.querySelector(
        "#overview-train-selector"
    );

    const periodButtons = [
        ...dashboard.querySelectorAll(
            ".chart-period-selector button"
        )
    ];

    const chartCanvas = dashboard.querySelector(
        "#fleet-condition-chart"
    );

    const chartLoadingState = dashboard.querySelector(
        "#chart-loading-state"
    );

    const eventList = dashboard.querySelector(
        "#overview-event-list"
    );


    /* ==================================================
       DEMONSTRATION DATA
       This is used until the Flask JSON API is available.
       ================================================== */

    const demonstrationData = {
        "train-07": {
            fleetScore: 81,
            fleetDescription: "Two systems require review",
            warningCount: 2,
            warningDescription: "Doors and ACV",

            systems: {
                doors: {
                    score: 72,
                    status: "Attention",
                    statusType: "warning",
                    asset: "Door D3-04"
                },

                acv: {
                    score: 68,
                    status: "Inspect",
                    statusType: "warning",
                    asset: "Car 01"
                },

                rail: {
                    score: 94,
                    status: "Normal",
                    statusType: "normal",
                    asset: "Track EW-14"
                },

                shm: {
                    score: 78,
                    status: "Review",
                    statusType: "review",
                    asset: "Support A"
                }
            },

            histories: {
                "1H": {
                    labels: [
                        "13:30",
                        "13:40",
                        "13:50",
                        "14:00",
                        "14:10",
                        "14:20",
                        "Now"
                    ],
                    values: [86, 85, 84, 84, 83, 82, 81]
                },

                "6H": {
                    labels: [
                        "09:00",
                        "10:00",
                        "11:00",
                        "12:00",
                        "13:00",
                        "14:00",
                        "Now"
                    ],
                    values: [88, 87, 86, 85, 84, 82, 81]
                },

                "24H": {
                    labels: [
                        "00:00",
                        "04:00",
                        "08:00",
                        "12:00",
                        "16:00",
                        "20:00",
                        "Now"
                    ],
                    values: [91, 90, 89, 87, 85, 83, 81]
                }
            },

            events: [
                {
                    time: "14:32:16",
                    system: "Doors",
                    systemKey: "doors",
                    message:
                        "Motor current exceeded the learned range",
                    asset: "D3-04",
                    type: "warning",
                    action: "Review"
                },
                {
                    time: "14:29:04",
                    system: "ACV",
                    systemKey: "acv",
                    message:
                        "Temperature variance increased",
                    asset: "Car 01",
                    type: "warning",
                    action: "Review"
                },
                {
                    time: "13:57:10",
                    system: "Rail",
                    systemKey: "rail",
                    message:
                        "Track-profile inspection completed",
                    asset: "EW-14",
                    type: "normal",
                    action: "View"
                }
            ]
        },


        "train-12": {
            fleetScore: 92,
            fleetDescription: "All systems remain stable",
            warningCount: 0,
            warningDescription: "No active warnings",

            systems: {
                doors: {
                    score: 93,
                    status: "Normal",
                    statusType: "normal",
                    asset: "Door D2-01"
                },

                acv: {
                    score: 90,
                    status: "Stable",
                    statusType: "normal",
                    asset: "Car 04"
                },

                rail: {
                    score: 96,
                    status: "Normal",
                    statusType: "normal",
                    asset: "Track NS-09"
                },

                shm: {
                    score: 91,
                    status: "Healthy",
                    statusType: "normal",
                    asset: "Support B"
                }
            },

            histories: {
                "1H": {
                    labels: [
                        "13:30",
                        "13:40",
                        "13:50",
                        "14:00",
                        "14:10",
                        "14:20",
                        "Now"
                    ],
                    values: [91, 92, 92, 91, 92, 92, 92]
                },

                "6H": {
                    labels: [
                        "09:00",
                        "10:00",
                        "11:00",
                        "12:00",
                        "13:00",
                        "14:00",
                        "Now"
                    ],
                    values: [90, 91, 91, 92, 91, 92, 92]
                },

                "24H": {
                    labels: [
                        "00:00",
                        "04:00",
                        "08:00",
                        "12:00",
                        "16:00",
                        "20:00",
                        "Now"
                    ],
                    values: [89, 90, 90, 91, 91, 92, 92]
                }
            },

            events: [
                {
                    time: "14:27:42",
                    system: "Structural Health",
                    systemKey: "shm",
                    message:
                        "Structural monitoring cycle completed",
                    asset: "Support B",
                    type: "normal",
                    action: "View"
                },
                {
                    time: "14:14:08",
                    system: "Doors",
                    systemKey: "doors",
                    message:
                        "Door cycle completed within expected range",
                    asset: "D2-01",
                    type: "normal",
                    action: "View"
                },
                {
                    time: "13:48:31",
                    system: "Rail",
                    systemKey: "rail",
                    message:
                        "Track-profile reading remained stable",
                    asset: "NS-09",
                    type: "normal",
                    action: "View"
                }
            ]
        }
    };


    /* ==================================================
       STATE
       ================================================== */

    let activeTrainId =
        trainSelector?.value || "train-07";

    let activePeriod = "24H";

    let activeData = demonstrationData[activeTrainId];

    let conditionChart = null;


    /* ==================================================
       HELPERS
       ================================================== */

    const setText = (id, value) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    };


    const getSystemLink = (systemKey) => {
        const row = dashboard.querySelector(
            `.health-row[data-system="${systemKey}"]`
        );

        return row?.getAttribute("href") || "#";
    };


    const setLoading = (isLoading) => {
        if (!chartLoadingState) {
            return;
        }

        chartLoadingState.hidden = !isLoading;
    };


    /* ==================================================
       JSON/API LOADING
       Falls back to demonstration data until API exists.
       ================================================== */

    const loadOverviewData = async (trainId) => {
        setLoading(true);

        try {
            const response = await fetch(
                `/api/overview?train=${encodeURIComponent(trainId)}`,
                {
                    headers: {
                        Accept: "application/json"
                    }
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Overview API returned ${response.status}`
                );
            }

            const result = await response.json();

            if (!result || !result.systems) {
                throw new Error("Invalid overview JSON");
            }

            return result;
        } catch (error) {
            /*
             * The API has not been connected yet.
             * Continue using realistic demonstration data.
             */
            return (
                demonstrationData[trainId] ||
                demonstrationData["train-07"]
            );
        } finally {
            setLoading(false);
        }
    };


    /* ==================================================
       SINGAPORE CLOCK
       ================================================== */

    const updateSingaporeClock = () => {
        const clock = document.getElementById(
            "overview-clock"
        );

        if (!clock) {
            return;
        }

        clock.textContent = new Intl.DateTimeFormat(
            "en-SG",
            {
                timeZone: "Asia/Singapore",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }
        ).format(new Date());
    };


    /* ==================================================
       SYSTEM MATRIX
       ================================================== */

    const updateSystemRow = (systemKey, system) => {
        if (!system) {
            return;
        }

        const row = dashboard.querySelector(
            `.health-row[data-system="${systemKey}"]`
        );

        setText(
            `${systemKey}-condition-score`,
            system.score
        );

        setText(
            `${systemKey}-condition-status`,
            system.status
        );

        setText(
            `${systemKey}-primary-asset`,
            system.asset
        );

        if (!row) {
            return;
        }

        row.classList.remove(
            "status-warning",
            "status-review",
            "status-normal"
        );

        const validType = [
            "warning",
            "review",
            "normal"
        ].includes(system.statusType)
            ? system.statusType
            : "normal";

        row.classList.add(`status-${validType}`);

        row.setAttribute(
            "aria-label",
            `${row.querySelector(
                ".health-name strong"
            )?.textContent || systemKey}: ` +
            `${system.score} out of 100, ${system.status}`
        );
    };


    const renderSystemMatrix = (systems) => {
        updateSystemRow("doors", systems.doors);
        updateSystemRow("acv", systems.acv);
        updateSystemRow("rail", systems.rail);
        updateSystemRow("shm", systems.shm);
    };


    /* ==================================================
       EVENT FEED
       ================================================== */

    const renderEvents = (events = []) => {
        if (!eventList) {
            return;
        }

        eventList.replaceChildren();

        events.slice(0, 3).forEach((event) => {
            const item = document.createElement("li");
            const time = document.createElement("time");
            const system = document.createElement("span");
            const message = document.createElement("strong");
            const asset = document.createElement("span");
            const link = document.createElement("a");

            item.className =
                `event-row event-${event.type || "normal"}`;

            time.dateTime = event.time;
            time.textContent = event.time;

            system.className = "event-system";
            system.textContent = event.system;

            message.textContent = event.message;

            asset.className = "event-asset";
            asset.textContent = event.asset;

            link.href = getSystemLink(event.systemKey);
            link.textContent = `${event.action || "View"} →`;

            item.append(
                time,
                system,
                message,
                asset,
                link
            );

            eventList.append(item);
        });
    };


    /* ==================================================
       CONDITION CHART
       ================================================== */

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 550,
            easing: "easeOutQuart"
        },
        interaction: {
            intersect: false,
            mode: "index"
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                displayColors: false,
                backgroundColor: "#202024",
                titleColor: "#ffffff",
                bodyColor: "#ffffff",
                padding: 12,
                cornerRadius: 2,
                callbacks: {
                    label(context) {
                        if (
                            context.dataset.label ===
                            "Attention threshold"
                        ) {
                            return "Attention threshold: 70";
                        }

                        return `Condition: ${context.parsed.y}/100`;
                    }
                }
            }
        },
        scales: {
            x: {
                border: {
                    display: false
                },
                grid: {
                    display: false
                },
                ticks: {
                    color: "#85858c",
                    font: {
                        family: "Instrument Sans",
                        size: 10
                    }
                }
            },
            y: {
                suggestedMin: 60,
                suggestedMax: 100,
                border: {
                    display: false
                },
                grid: {
                    color: "#e1e1e4"
                },
                ticks: {
                    color: "#85858c",
                    stepSize: 10,
                    font: {
                        family: "Instrument Sans",
                        size: 10
                    },
                    callback(value) {
                        return `${value}`;
                    }
                }
            }
        }
    };


    const createConditionChart = (history) => {
        if (
            !chartCanvas ||
            typeof window.Chart === "undefined"
        ) {
            return;
        }

        conditionChart = new window.Chart(
            chartCanvas,
            {
                type: "line",

                data: {
                    labels: history.labels,

                    datasets: [
                        {
                            label: "Network condition",
                            data: history.values,

                            borderColor: "#202024",
                            backgroundColor:
                                "rgba(32, 32, 36, 0.06)",

                            borderWidth: 2.5,
                            pointRadius: 0,
                            pointHoverRadius: 5,
                            pointHoverBackgroundColor:
                                "#df293a",

                            fill: true,
                            tension: 0.3
                        },

                        {
                            label: "Attention threshold",
                            data: history.labels.map(
                                () => 70
                            ),

                            borderColor: "#df293a",
                            borderWidth: 1.5,
                            borderDash: [6, 6],

                            pointRadius: 0,
                            pointHoverRadius: 0,

                            fill: false,
                            tension: 0
                        }
                    ]
                },

                options: chartOptions
            }
        );
    };


    const updateConditionChart = (history) => {
        if (!history) {
            return;
        }

        if (!conditionChart) {
            createConditionChart(history);
            return;
        }

        conditionChart.data.labels = history.labels;

        conditionChart.data.datasets[0].data =
            history.values;

        conditionChart.data.datasets[1].data =
            history.labels.map(() => 70);

        conditionChart.update();
    };

    function updateFleetSummary(data) {
    document.getElementById("overview-fleet-description").textContent =
        data.fleetDescription ?? "No fleet condition available";
}

    /* ==================================================
       COMPLETE OVERVIEW RENDER
       ================================================== */

    const renderOverview = (data) => {
        if (!data) {
            return;
        }

        activeData = data;

        setText(
            "overview-fleet-score",
            data.fleetScore
        );

        setText(
            "current-network-condition",
            data.fleetScore
        );

        setText(
            "overview-fleet-description",
            data.fleetDescription
        );

        setText(
            "overview-warning-count",
            String(data.warningCount).padStart(2, "0")
        );

        setText(
            "overview-warning-description",
            data.warningDescription
        );

        renderSystemMatrix(data.systems);
        renderEvents(data.events);

        const history =
            data.histories?.[activePeriod] ||
            data.histories?.["24H"];

        updateConditionChart(history);
    };


    /* ==================================================
       TRAIN SELECTION
       ================================================== */

    const changeTrain = async (trainId) => {
        activeTrainId = trainId;

        const data = await loadOverviewData(trainId);

        renderOverview(data);
    };


    trainSelector?.addEventListener(
        "change",
        (event) => {
            changeTrain(event.target.value);
        }
    );


    /* ==================================================
       CHART PERIOD BUTTONS
       ================================================== */

    periodButtons.forEach((button) => {
        button.setAttribute(
            "aria-pressed",
            String(button.classList.contains("active"))
        );

        button.addEventListener("click", () => {
            activePeriod = button.dataset.period;

            periodButtons.forEach((otherButton) => {
                const isActive =
                    otherButton === button;

                otherButton.classList.toggle(
                    "active",
                    isActive
                );

                otherButton.setAttribute(
                    "aria-pressed",
                    String(isActive)
                );
            });

            const history =
                activeData?.histories?.[activePeriod];

            updateConditionChart(history);
        });
    });


    /* ==================================================
       INITIAL RENDER
       ================================================== */

    updateSingaporeClock();

    window.setInterval(
        updateSingaporeClock,
        1000
    );

    changeTrain(activeTrainId);
});