/* ==================================================
   RAILPULSE — ACV FAULT LOCALISATION
   Demonstration data until the real model is connected
   ================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const caseSelector = document.querySelector(".case-selector select");
    const carButtons = [...document.querySelectorAll(".acv-carriage")];
    const chartColumns = [...document.querySelectorAll(".variance-column")];
    const rankingBody = document.querySelector(".ranking-table tbody");

    const detailPanel = document.querySelector(".car-detail-panel");
    const detailTitle = detailPanel?.querySelector("h2");
    const detailStatus = detailPanel?.querySelector(".car-status");
    const varianceNumber = detailPanel?.querySelector(
        ".variance-reading strong"
    );
    const varianceScale = document.querySelector("#variance-scale-fill");
    const readingValues = [
        ...document.querySelectorAll(".car-readings dd")
    ];

    const summaryValues = [
        ...document.querySelectorAll(".acv-summary strong")
    ];


    /* ==================================================
       DEMONSTRATION DATA

       Replace this object later with results returned
       by the teammate's ACV model.
       ================================================== */

    const acvCases = {
        "01": {
            filename: "acv_case_01.xlsx",
            faultyCar: "01",
            confidence: 92,
            status: "Fault localised",
            updated: "14:32:18",
            cars: {
                "01": {
                    variance: 0.92,
                    rms: 4.81,
                    peak: 8.42,
                    mean: 2.74
                },
                "02": {
                    variance: 0.28,
                    rms: 1.89,
                    peak: 3.11,
                    mean: 1.36
                },
                "03": {
                    variance: 0.36,
                    rms: 2.14,
                    peak: 3.68,
                    mean: 1.51
                },
                "04": {
                    variance: 0.22,
                    rms: 1.67,
                    peak: 2.86,
                    mean: 1.18
                },
                "05": {
                    variance: 0.31,
                    rms: 1.96,
                    peak: 3.32,
                    mean: 1.42
                },
                "06": {
                    variance: 0.25,
                    rms: 1.74,
                    peak: 2.97,
                    mean: 1.24
                }
            }
        },

        "02": {
            filename: "acv_case_02.xlsx",
            faultyCar: "02",
            confidence: 89,
            status: "Fault localised",
            updated: "14:35:42",
            cars: {
                "01": {
                    variance: 0.25,
                    rms: 1.76,
                    peak: 2.98,
                    mean: 1.27
                },
                "02": {
                    variance: 0.87,
                    rms: 4.45,
                    peak: 7.91,
                    mean: 2.58
                },
                "03": {
                    variance: 0.34,
                    rms: 2.08,
                    peak: 3.55,
                    mean: 1.48
                },
                "04": {
                    variance: 0.29,
                    rms: 1.91,
                    peak: 3.18,
                    mean: 1.38
                },
                "05": {
                    variance: 0.21,
                    rms: 1.62,
                    peak: 2.73,
                    mean: 1.14
                },
                "06": {
                    variance: 0.27,
                    rms: 1.82,
                    peak: 3.06,
                    mean: 1.31
                }
            }
        },

        "03": {
            filename: "acv_case_03.xlsx",
            faultyCar: "03",
            confidence: 94,
            status: "Fault localised",
            updated: "14:39:06",
            cars: {
                "01": {
                    variance: 0.24,
                    rms: 1.72,
                    peak: 2.92,
                    mean: 1.21
                },
                "02": {
                    variance: 0.32,
                    rms: 2.01,
                    peak: 3.42,
                    mean: 1.44
                },
                "03": {
                    variance: 0.95,
                    rms: 4.96,
                    peak: 8.71,
                    mean: 2.89
                },
                "04": {
                    variance: 0.35,
                    rms: 2.11,
                    peak: 3.62,
                    mean: 1.53
                },
                "05": {
                    variance: 0.28,
                    rms: 1.87,
                    peak: 3.14,
                    mean: 1.34
                },
                "06": {
                    variance: 0.23,
                    rms: 1.69,
                    peak: 2.84,
                    mean: 1.19
                }
            }
        },

        "04": {
            filename: "acv_case_04.xlsx",
            faultyCar: "04",
            confidence: 90,
            status: "Fault localised",
            updated: "14:42:33",
            cars: {
                "01": {
                    variance: 0.29,
                    rms: 1.92,
                    peak: 3.19,
                    mean: 1.37
                },
                "02": {
                    variance: 0.26,
                    rms: 1.79,
                    peak: 3.01,
                    mean: 1.29
                },
                "03": {
                    variance: 0.37,
                    rms: 2.18,
                    peak: 3.74,
                    mean: 1.57
                },
                "04": {
                    variance: 0.89,
                    rms: 4.57,
                    peak: 8.06,
                    mean: 2.67
                },
                "05": {
                    variance: 0.33,
                    rms: 2.04,
                    peak: 3.48,
                    mean: 1.46
                },
                "06": {
                    variance: 0.22,
                    rms: 1.65,
                    peak: 2.79,
                    mean: 1.16
                }
            }
        },

        "05": {
            filename: "acv_case_05.xlsx",
            faultyCar: "06",
            confidence: 91,
            status: "Fault localised",
            updated: "14:46:15",
            cars: {
                "01": {
                    variance: 0.26,
                    rms: 1.81,
                    peak: 3.04,
                    mean: 1.3
                },
                "02": {
                    variance: 0.31,
                    rms: 1.98,
                    peak: 3.36,
                    mean: 1.43
                },
                "03": {
                    variance: 0.23,
                    rms: 1.68,
                    peak: 2.85,
                    mean: 1.2
                },
                "04": {
                    variance: 0.35,
                    rms: 2.12,
                    peak: 3.61,
                    mean: 1.54
                },
                "05": {
                    variance: 0.38,
                    rms: 2.21,
                    peak: 3.79,
                    mean: 1.6
                },
                "06": {
                    variance: 0.91,
                    rms: 4.72,
                    peak: 8.25,
                    mean: 2.76
                }
            }
        },

        "06": {
            filename: "acv_case_06.xlsx",
            faultyCar: "01",
            confidence: 88,
            status: "Fault localised",
            updated: "14:49:27",
            cars: {
                "01": {
                    variance: 0.85,
                    rms: 4.31,
                    peak: 7.68,
                    mean: 2.51
                },
                "02": {
                    variance: 0.33,
                    rms: 2.05,
                    peak: 3.49,
                    mean: 1.47
                },
                "03": {
                    variance: 0.27,
                    rms: 1.83,
                    peak: 3.08,
                    mean: 1.32
                },
                "04": {
                    variance: 0.24,
                    rms: 1.71,
                    peak: 2.91,
                    mean: 1.22
                },
                "05": {
                    variance: 0.36,
                    rms: 2.16,
                    peak: 3.69,
                    mean: 1.55
                },
                "06": {
                    variance: 0.29,
                    rms: 1.9,
                    peak: 3.2,
                    mean: 1.36
                }
            }
        }
    };


    /* ==================================================
       HELPERS
       ================================================== */

    let activeCase = getCaseNumber(caseSelector?.value) || "01";
    let activeCar = acvCases[activeCase].faultyCar;


    function getCaseNumber(value) {
        const match = String(value || "").match(/\d+/);

        if (!match) {
            return null;
        }

        return match[0].padStart(2, "0");
    }


    function getCarNumber(element) {
        const rawValue =
            element?.dataset.car ||
            element?.dataset.node ||
            element?.textContent;

        const match = String(rawValue || "").match(/\d+/);

        if (!match) {
            return null;
        }

        return match[0].padStart(2, "0");
    }


    function formatVariance(value) {
        return Number(value).toFixed(2);
    }


    function getConditionLabel(carNumber, currentCase) {
        if (carNumber === currentCase.faultyCar) {
            return "Highest variance";
        }

        return "Within baseline";
    }


    /* ==================================================
       UPDATE COMPLETE CASE
       ================================================== */

    function renderCase(caseNumber) {
        const currentCase = acvCases[caseNumber];

        if (!currentCase) {
            return;
        }

        activeCase = caseNumber;
        activeCar = currentCase.faultyCar;

        updateSummary(currentCase);
        updateTrain(currentCase);
        updateChart(currentCase);
        updateRanking(currentCase);
        updateDetail(activeCar);
    }


    /* ==================================================
       UPDATE SUMMARY
       ================================================== */

    function updateSummary(currentCase) {
        const highestVariance =
            currentCase.cars[currentCase.faultyCar].variance;

        const values = [
            currentCase.filename,
            `Car ${currentCase.faultyCar}`,
            formatVariance(highestVariance),
            `${currentCase.confidence}%`,
            currentCase.updated
        ];

        summaryValues.forEach((element, index) => {
            if (values[index] !== undefined) {
                element.textContent = values[index];
            }
        });
    }


    /* ==================================================
       UPDATE TRAIN
       ================================================== */

    function updateTrain(currentCase) {
        carButtons.forEach((button) => {
            const carNumber = getCarNumber(button);
            const isFaulty = carNumber === currentCase.faultyCar;

            button.classList.toggle("highest-risk", isFaulty);
            button.classList.toggle(
                "selected",
                carNumber === activeCar
            );

            button.setAttribute(
                "aria-pressed",
                carNumber === activeCar ? "true" : "false"
            );

            const statusText = button.querySelector(
                ".car-condition, em, small:last-child"
            );

            if (statusText && !statusText.classList.contains("car-number")) {
                statusText.textContent = isFaulty
                    ? "Highest variance"
                    : "Normal";
            }
        });
    }


    /* ==================================================
       UPDATE DETAIL PANEL
       ================================================== */

    function updateDetail(carNumber) {
        const currentCase = acvCases[activeCase];
        const carData = currentCase?.cars[carNumber];

        if (!carData) {
            return;
        }

        activeCar = carNumber;

        const isFaulty = carNumber === currentCase.faultyCar;
        const variancePercentage = Math.min(
            Math.round(carData.variance * 100),
            100
        );

        carButtons.forEach((button) => {
            const selected = getCarNumber(button) === carNumber;

            button.classList.toggle("selected", selected);
            button.setAttribute(
                "aria-pressed",
                selected ? "true" : "false"
            );
        });

        chartColumns.forEach((column) => {
            const selected = getCarNumber(column) === carNumber;

            column.classList.toggle("selected", selected);
            column.setAttribute(
                "aria-pressed",
                selected ? "true" : "false"
            );
        });

        if (detailTitle) {
            detailTitle.textContent = `Car ${carNumber}`;
        }

        if (detailStatus) {
            detailStatus.textContent = getConditionLabel(
                carNumber,
                currentCase
            );

            detailStatus.classList.toggle(
                "warning-status",
                isFaulty
            );
        }

        if (varianceNumber) {
            varianceNumber.innerHTML = `
                ${formatVariance(carData.variance)}
                <small>variance index</small>
            `;
        }

        if (varianceScale) {
            varianceScale.style.setProperty(
                "--variance-width",
                `${variancePercentage}%`
            );

            varianceScale.style.width = `${variancePercentage}%`;
        }

        const readings = [
            carData.rms.toFixed(2),
            carData.peak.toFixed(2),
            carData.mean.toFixed(2),
            `${currentCase.confidence}%`
        ];

        readingValues.forEach((element, index) => {
            if (readings[index] !== undefined) {
                element.textContent = readings[index];
            }
        });
    }


    /* ==================================================
       UPDATE CHART
       ================================================== */

    function updateChart(currentCase) {
        const maximumVariance = Math.max(
            ...Object.values(currentCase.cars).map(
                (car) => car.variance
            )
        );

        chartColumns.forEach((column) => {
            const carNumber = getCarNumber(column);
            const carData = currentCase.cars[carNumber];

            if (!carData) {
                return;
            }

            const barHeight = Math.max(
                12,
                Math.round(
                    (carData.variance / maximumVariance) * 92
                )
            );

            const isFaulty =
                carNumber === currentCase.faultyCar;

            column.style.setProperty(
                "--column-height",
                `${barHeight}%`
            );

            column.classList.toggle(
                "warning-column",
                isFaulty
            );

            column.classList.toggle(
                "selected",
                carNumber === activeCar
            );

            const valueText = column.querySelector("strong");
            const carText = column.querySelector("span");

            if (valueText) {
                valueText.textContent = formatVariance(
                    carData.variance
                );
            }

            if (carText) {
                carText.textContent = `Car ${carNumber}`;
            }
        });
    }


    /* ==================================================
       UPDATE RANKING TABLE
       ================================================== */

    function updateRanking(currentCase) {
        if (!rankingBody) {
            return;
        }

        const ranking = Object.entries(currentCase.cars)
            .map(([carNumber, values]) => ({
                carNumber,
                ...values
            }))
            .sort((a, b) => b.variance - a.variance);

        rankingBody.innerHTML = ranking
            .map((car, index) => {
                const isFaulty =
                    car.carNumber === currentCase.faultyCar;

                return `
                    <tr class="${
                        isFaulty ? "ranking-warning" : ""
                    }">
                        <td>${String(index + 1).padStart(2, "0")}</td>
                        <td>Car ${car.carNumber}</td>
                        <td>${formatVariance(car.variance)}</td>
                        <td>${car.rms.toFixed(2)}</td>
                        <td>
                            <span class="${
                                isFaulty
                                    ? "table-warning"
                                    : "table-normal"
                            }">
                                ${
                                    isFaulty
                                        ? "Inspect first"
                                        : "Normal"
                                }
                            </span>
                        </td>
                    </tr>
                `;
            })
            .join("");
    }


    /* ==================================================
       EVENTS
       ================================================== */

    caseSelector?.addEventListener("change", (event) => {
        const selectedCase = getCaseNumber(event.target.value);

        if (selectedCase && acvCases[selectedCase]) {
            renderCase(selectedCase);
        }
    });


    carButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const carNumber = getCarNumber(button);

            if (carNumber) {
                updateDetail(carNumber);
            }
        });
    });


    chartColumns.forEach((column) => {
        column.addEventListener("click", () => {
            const carNumber = getCarNumber(column);

            if (carNumber) {
                updateDetail(carNumber);

                document
                    .querySelector(
                        `.acv-carriage[data-car="${carNumber}"]`
                    )
                    ?.focus({
                        preventScroll: true
                    });
            }
        });
    });


    /* ==================================================
       KEYBOARD NAVIGATION
       Left/right arrows move between train carriages.
       ================================================== */

    carButtons.forEach((button, index) => {
        button.addEventListener("keydown", (event) => {
            let nextIndex = index;

            if (event.key === "ArrowRight") {
                nextIndex = (index + 1) % carButtons.length;
            } else if (event.key === "ArrowLeft") {
                nextIndex =
                    (index - 1 + carButtons.length) %
                    carButtons.length;
            } else if (event.key === "Home") {
                nextIndex = 0;
            } else if (event.key === "End") {
                nextIndex = carButtons.length - 1;
            } else {
                return;
            }

            event.preventDefault();

            carButtons[nextIndex].focus();
            carButtons[nextIndex].click();
        });
    });


    /* ==================================================
       INITIAL PAGE
       ================================================== */

    renderCase(activeCase);
});