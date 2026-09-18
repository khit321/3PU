/* RailPulse — Structural Health Monitoring */

document.addEventListener("DOMContentLoaded", () => {
    const selector = document.querySelector("#structure-selector");

    if (!selector) {
        console.error("SHM selector was not found.");
        return;
    }

    const el = {
        structureId: document.querySelector("#structure-id"),
        structureRecord: document.querySelector("#structure-record"),
        predictedDamage: document.querySelector("#predicted-damage"),
        structureCondition: document.querySelector("#structure-condition"),
        updatedTime: document.querySelector("#shm-updated-time"),
        sampleCount: document.querySelector("#shm-sample-count"),

        damageCondition: document.querySelector("#damage-condition"),
        damageStatus: document.querySelector("#damage-status"),
        damageValue: document.querySelector("#damage-value"),
        damageScaleFill: document.querySelector("#damage-scale-fill"),
        damageMarker: document.querySelector("#current-damage-marker"),

        mean: document.querySelector("#shm-mean-value"),
        peakToPeak: document.querySelector("#shm-peak-value"),
        rms: document.querySelector("#shm-rms-value"),
        frequency: document.querySelector("#shm-frequency-value"),
        action: document.querySelector("#structure-action"),

        line: document.querySelector("#shm-response-line"),
        area: document.querySelector("#shm-response-area")
    };

    let activeRequest = null;


    /* ==================================================
       GENERAL HELPERS
       ================================================== */

    function setText(element, value) {
        if (element) {
            element.textContent = value;
        }
    }


    function formatNumber(value, digits = 4) {
        const parsedValue = Number(value);

        if (!Number.isFinite(parsedValue)) {
            return "—";
        }

        return parsedValue.toFixed(digits);
    }


    function normaliseRecordId(recordId) {
        return String(recordId).padStart(3, "0");
    }


    /* ==================================================
       DAMAGE CLASSIFICATION
       ================================================== */

    function getCondition(damage) {
        if (damage < 0.3) {
            return {
                label: "Healthy",
                badgeClass: "healthy-status",
                summaryClass: "summary-normal",
                action: "Continue routine monitoring"
            };
        }

        if (damage < 0.7) {
            return {
                label: "Review",
                badgeClass: "review-status",
                summaryClass: "summary-review",
                action: "Schedule an engineering inspection"
            };
        }

        return {
            label: "Critical",
            badgeClass: "critical-status",
            summaryClass: "summary-critical",
            action: "Prioritise inspection and maintenance"
        };
    }


    function setConditionClass(element, className) {
        if (!element) return;

        element.classList.remove(
            "summary-pending",
            "summary-normal",
            "summary-review",
            "summary-critical",
            "healthy-status",
            "review-status",
            "critical-status"
        );

        element.classList.add(className);
    }


    /* ==================================================
       RESET DISPLAY
       ================================================== */

    function resetDisplay(recordId) {
        const normalisedId = normaliseRecordId(recordId);

        setText(el.structureId, `SHM-${normalisedId}`);
        setText(el.structureRecord, `Structure ${normalisedId}`);
        setText(el.predictedDamage, "—");
        setText(el.structureCondition, "—");
        setText(el.updatedTime, "—");
        setText(el.sampleCount, "— samples");

        setText(el.damageCondition, "—");
        setText(el.damageStatus, "Awaiting result");
        setText(el.damageValue, "—");

        setText(el.mean, "—");
        setText(el.peakToPeak, "—");
        setText(el.rms, "—");
        setText(el.frequency, "—");
        setText(el.action, "Awaiting model result");

        setConditionClass(
            el.structureCondition,
            "summary-pending"
        );

        if (el.damageStatus) {
            el.damageStatus.classList.remove(
                "healthy-status",
                "review-status",
                "critical-status"
            );
        }

        if (el.damageScaleFill) {
            el.damageScaleFill.style.setProperty(
                "--damage-width",
                "0%"
            );
        }

        if (el.damageMarker) {
            el.damageMarker.hidden = true;
            el.damageMarker.style.setProperty(
                "--marker-position",
                "0%"
            );
        }

        if (el.line) {
            el.line.setAttribute("d", "");
        }

        if (el.area) {
            el.area.setAttribute("d", "");
        }
    }


    /* ==================================================
       SVG SIGNAL CHART
       ================================================== */

    function drawSignal(rawSamples) {
        if (
            !el.line ||
            !el.area ||
            !Array.isArray(rawSamples)
        ) {
            return;
        }

        const validSamples = rawSamples
            .map(Number)
            .filter(value => Number.isFinite(value));

        if (validSamples.length < 2) {
            el.line.setAttribute("d", "");
            el.area.setAttribute("d", "");
            return;
        }

        /*
         * Limit the number of SVG points for performance.
         * This does not affect the model prediction.
         */
        const step = Math.max(
            1,
            Math.ceil(validSamples.length / 500)
        );

        const samples = validSamples.filter(
            (_, index) => index % step === 0
        );

        const width = 1000;
        const height = 360;
        const verticalPadding = 24;

        const minimum = Math.min(...samples);
        const maximum = Math.max(...samples);
        const range = maximum - minimum || 1;

        const points = samples.map((value, index) => {
            const x =
                (index / Math.max(samples.length - 1, 1)) *
                width;

            const normalisedValue =
                (value - minimum) / range;

            const y =
                verticalPadding +
                (1 - normalisedValue) *
                (height - verticalPadding * 2);

            return [x, y];
        });

        const linePath = points
            .map(([x, y], index) => {
                const command = index === 0 ? "M" : "L";

                return (
                    `${command}${x.toFixed(2)} ` +
                    `${y.toFixed(2)}`
                );
            })
            .join(" ");

        const firstX = points[0][0].toFixed(2);
        const lastX = points[points.length - 1][0].toFixed(2);

        const areaPath =
            `${linePath} ` +
            `L${lastX} ${height} ` +
            `L${firstX} ${height} Z`;

        el.line.setAttribute("d", linePath);
        el.area.setAttribute("d", areaPath);
    }


    /* ==================================================
       RENDER API RESULT
       ================================================== */

    function renderResult(data, selectedRecord) {
        const damage = Number(
            data.predicted_damage ?? data.prediction
        );

        if (!Number.isFinite(damage)) {
            throw new Error(
                "The server returned an invalid prediction."
            );
        }

        const condition = getCondition(damage);
        const features =
            data.features ?? data.statistics ?? {};

        const samples =
            data.stress_samples ?? data.samples ?? [];

        const recordId = normaliseRecordId(
            data.record_id ?? selectedRecord
        );

        const percentage = Math.min(
            Math.max(damage * 100, 0),
            100
        );


        /* Summary */

        setText(
            el.structureId,
            data.structure_id ?? `SHM-${recordId}`
        );

        setText(
            el.structureRecord,
            `Structure ${recordId}`
        );

        setText(
            el.predictedDamage,
            formatNumber(damage)
        );

        setText(
            el.structureCondition,
            condition.label
        );

        setText(
            el.updatedTime,
            formatPredictionTime(data.predicted_at)
        );


        /* Classification */

        setText(
            el.damageCondition,
            condition.label
        );

        setText(
            el.damageStatus,
            condition.label
        );

        setText(
            el.damageValue,
            formatNumber(damage)
        );

        setText(
            el.action,
            data.recommended_action ?? condition.action
        );


        /* Signal measurements */

        setText(
            el.sampleCount,
            `${data.sample_count ?? samples.length} samples`
        );

        setText(
            el.mean,
            formatNumber(features.mean)
        );

        setText(
            el.peakToPeak,
            formatNumber(
                features.peak_to_peak ?? features.ptp
            )
        );

        setText(
            el.rms,
            formatNumber(features.rms)
        );

        setText(
            el.frequency,
            formatNumber(
                features.dominant_frequency ??
                features.dom_freq,
                6
            )
        );


        /* Status colours */

        setConditionClass(
            el.structureCondition,
            condition.summaryClass
        );

        setConditionClass(
            el.damageStatus,
            condition.badgeClass
        );


        /* Scale */

        if (el.damageScaleFill) {
            el.damageScaleFill.style.setProperty(
                "--damage-width",
                `${percentage}%`
            );
        }

        if (el.damageMarker) {
            el.damageMarker.hidden = false;

            el.damageMarker.style.setProperty(
                "--marker-position",
                `${percentage}%`
            );
        }


        /* Graph */

        drawSignal(samples);
    }


    function formatPredictionTime(timestampValue) {
        if (!timestampValue) {
            return "—";
        }

        const timestamp = new Date(timestampValue);

        if (Number.isNaN(timestamp.getTime())) {
            return "—";
        }

        return timestamp.toLocaleTimeString("en-SG", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            timeZone: "Asia/Singapore"
        });
    }


    /* ==================================================
       ERROR DISPLAY
       ================================================== */

    function showError(message) {
        setText(el.structureCondition, "Unavailable");
        setText(el.damageCondition, "Unavailable");
        setText(el.damageStatus, "Error");
        setText(el.damageValue, "—");
        setText(el.action, message);

        setConditionClass(
            el.structureCondition,
            "summary-critical"
        );

        setConditionClass(
            el.damageStatus,
            "critical-status"
        );

        if (el.damageMarker) {
            el.damageMarker.hidden = true;
        }

        if (el.damageScaleFill) {
            el.damageScaleFill.style.setProperty(
                "--damage-width",
                "0%"
            );
        }
    }


    /* ==================================================
       API REQUEST
       ================================================== */

    async function loadRecord(recordId) {
        if (activeRequest) {
            activeRequest.abort();
        }

        activeRequest = new AbortController();

        /*
         * This was previously reset(record), which caused
         * a ReferenceError and stopped the API request.
         */
        resetDisplay(recordId);

        try {
            const response = await fetch(
                `/api/shm/${encodeURIComponent(recordId)}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json"
                    },
                    signal: activeRequest.signal
                }
            );

            const data = await response
                .json()
                .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.error ??
                    `Prediction failed (${response.status}).`
                );
            }

            renderResult(data, recordId);

        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }

            showError(
                error.message || "Unable to load prediction."
            );

            console.error(
                "SHM prediction error:",
                error
            );
        }
    }


    /* ==================================================
       EVENTS
       ================================================== */

    selector.addEventListener("change", () => {
        loadRecord(selector.value);
    });

    loadRecord(selector.value);
});