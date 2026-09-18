/* RailPulse — Structural Health Monitoring */
document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.querySelector("#shm-file-input");
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
        severityRank: document.querySelector("#shm-severity-rank"),
        reviewDelta: document.querySelector("#shm-review-delta"),
        criticalGap: document.querySelector("#shm-critical-gap"),
        primaryFinding: document.querySelector("#shm-primary-finding"),
        possibleConcern: document.querySelector("#shm-possible-concern"),
        findingsList: document.querySelector("#shm-findings-list"),
        line: document.querySelector("#shm-response-line"),
        area: document.querySelector("#shm-response-area")
    };
    const lta = {
        panel: document.querySelector("#lta-service-panel"),
        status: document.querySelector("#lta-service-status"),
        description: document.querySelector("#lta-service-description"),
        affectedCount: document.querySelector("#lta-affected-count"),
        advisoryCount: document.querySelector("#lta-advisory-count"),
        checkedTime: document.querySelector("#lta-checked-time"),
        details: document.querySelector("#lta-advisory-details"),
        list: document.querySelector("#lta-advisory-list")
    };
    let activeRequest = null;

    function setText(element, value) {
        if (element) element.textContent = value;
    }

    function formatNumber(value, digits = 4) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed.toFixed(digits) : "—";
    }

    function formatSingaporeTime(value) {
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleTimeString("en-SG", {
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: false, timeZone: "Asia/Singapore"
        });
    }

    function getCondition(damage) {
        if (damage < 0.3) return {
            label: "Healthy", badgeClass: "healthy-status",
            summaryClass: "summary-normal", action: "Continue routine monitoring"
        };
        if (damage < 0.7) return {
            label: "Review", badgeClass: "review-status",
            summaryClass: "summary-review", action: "Schedule an engineering inspection"
        };
        return {
            label: "Critical", badgeClass: "critical-status",
            summaryClass: "summary-critical", action: "Prioritise inspection and maintenance"
        };
    }

    function setConditionClass(element, className) {
        if (!element) return;
        element.classList.remove(
            "summary-pending", "summary-normal", "summary-review", "summary-critical",
            "healthy-status", "review-status", "critical-status"
        );
        element.classList.add(className);
    }

    function resetDisplay(fileName = "") {
        const displayName = fileName || "No file selected";
        const recordName = fileName.replace(/\.csv$/i, "");
        setText(el.structureId, recordName ? `SHM-${recordName}` : "—");
        setText(el.structureRecord, displayName);
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
        setText(el.action, "Select a CSV sensor record to run the model");
        setConditionClass(el.structureCondition, "summary-pending");
        if (el.damageStatus) el.damageStatus.classList.remove(
            "healthy-status", "review-status", "critical-status"
        );
        if (el.damageScaleFill) el.damageScaleFill.style.setProperty("--damage-width", "0%");
        if (el.damageMarker) {
            el.damageMarker.hidden = true;
            el.damageMarker.style.setProperty("--marker-position", "0%");
        }
        if (el.line) el.line.setAttribute("d", "");
        if (el.area) el.area.setAttribute("d", "");
    }

    function drawSignal(rawSamples) {
        if (!el.line || !el.area || !Array.isArray(rawSamples)) return;
        const validSamples = rawSamples.map(Number).filter(Number.isFinite);
        if (validSamples.length < 2) {
            el.line.setAttribute("d", "");
            el.area.setAttribute("d", "");
            return;
        }
        const step = Math.max(1, Math.ceil(validSamples.length / 500));
        const samples = validSamples.filter((_, index) => index % step === 0);
        const width = 1000;
        const height = 360;
        const padding = 24;
        const minimum = Math.min(...samples);
        const maximum = Math.max(...samples);
        const range = maximum - minimum || 1;
        const points = samples.map((value, index) => [
            (index / Math.max(samples.length - 1, 1)) * width,
            padding + (1 - ((value - minimum) / range)) * (height - padding * 2)
        ]);
        const linePath = points.map(([x, y], index) =>
            `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
        ).join(" ");
        const firstX = points[0][0].toFixed(2);
        const lastX = points[points.length - 1][0].toFixed(2);
        el.line.setAttribute("d", linePath);
        el.area.setAttribute("d", `${linePath} L${lastX} ${height} L${firstX} ${height} Z`);
    }

    function renderResult(data, uploadedFileName) {
        const damage = Number(data.predicted_damage ?? data.prediction);
        if (!Number.isFinite(damage)) throw new Error("The server returned an invalid prediction.");
        const condition = getCondition(damage);
        const conditionLabel = data.condition ?? condition.label;
        const features = data.features ?? data.statistics ?? {};
        const samples = data.stress_samples ?? data.samples ?? [];
        const percentage = Math.min(Math.max(damage * 100, 0), 100);
        const assessment = data.assessment ?? {};

        const severity =
            data.severity ??
            assessment.severity ??
            {};

        const thresholds =
            data.threshold_comparison ??
            assessment.threshold_comparison ??
            {};

        const findings =
            data.findings ??
            assessment.findings ??
            [];
        const recordName = String(data.record_id ?? uploadedFileName.replace(/\.csv$/i, ""));

        setText(el.structureId, data.structure_id ?? `SHM-${recordName}`);
        setText(el.structureRecord, data.file_name ?? uploadedFileName);
        setText(el.predictedDamage, formatNumber(damage));
        setText(el.structureCondition, conditionLabel);
        setText(el.updatedTime, formatSingaporeTime(data.predicted_at));
        setText(el.damageCondition, conditionLabel);
        setText(el.damageStatus, conditionLabel);
        setText(el.damageValue, formatNumber(damage));
        setText(el.action, data.recommended_action ?? condition.action);
        setText(el.sampleCount, `${data.sample_count ?? samples.length} samples`);
        setText(el.mean, formatNumber(features.mean));
        setText(el.peakToPeak, formatNumber(features.peak_to_peak ?? features.ptp));
        setText(el.rms, formatNumber(features.rms));
        setText(el.frequency, formatNumber(features.dominant_frequency ?? features.dom_freq, 6));
        setText(
            el.severityRank,
            Number.isFinite(Number(severity.rank)) &&
            Number.isFinite(Number(severity.total))
                ? `${severity.rank} of ${severity.total}`
                : "—"
        );

        setText(
            el.reviewDelta,
            formatNumber(thresholds.above_review_by)
        );

        setText(
            el.criticalGap,
            formatNumber(thresholds.below_critical_by)
        );

        setText(
            el.primaryFinding,
            assessment.primary_finding ??
            "No dominant model finding was returned."
        );

        setText(
            el.possibleConcern,
            assessment.possible_concern ??
            "Engineering interpretation is unavailable."
        );

        renderModelFindings(findings);
        setConditionClass(el.structureCondition, condition.summaryClass);
        setConditionClass(el.damageStatus, condition.badgeClass);
        if (el.damageScaleFill) el.damageScaleFill.style.setProperty("--damage-width", `${percentage}%`);
        if (el.damageMarker) {
            el.damageMarker.hidden = false;
            el.damageMarker.style.setProperty("--marker-position", `${percentage}%`);
        }
        drawSignal(samples);
    }
            function renderModelFindings(findings) {
            if (!el.findingsList) return;

            el.findingsList.replaceChildren();

            if (!Array.isArray(findings) || findings.length === 0) {
                const emptyItem = document.createElement("li");
                const emptyText = document.createElement("span");

                emptyText.textContent =
                    "No positive model contribution was returned.";

                emptyItem.append(emptyText);
                el.findingsList.append(emptyItem);
                return;
            }

            findings.slice(0, 3).forEach((finding) => {
                const item = document.createElement("li");
                const description = document.createElement("span");
                const contribution = document.createElement("strong");

                description.textContent =
                    finding.finding ?? "Model contribution";

                const share = Number(finding.contribution_share);

                contribution.textContent = Number.isFinite(share)
                    ? `${share.toFixed(0)}% influence`
                    : "";

                item.append(description, contribution);
                el.findingsList.append(item);
            });
        }
    function showPredictionError(message) {
        setText(el.structureCondition, "Unavailable");
        setText(el.damageCondition, "Unavailable");
        setText(el.damageStatus, "Error");
        setText(el.damageValue, "—");
        setText(el.action, message);
        setConditionClass(el.structureCondition, "summary-critical");
        setConditionClass(el.damageStatus, "critical-status");
        if (el.damageMarker) el.damageMarker.hidden = true;
        if (el.damageScaleFill) el.damageScaleFill.style.setProperty("--damage-width", "0%");
    }

    async function loadUploadedFile(file) {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".csv")) {
            showPredictionError("Please select a CSV sensor file.");
            return;
        }
        if (activeRequest) activeRequest.abort();
        activeRequest = new AbortController();
        resetDisplay(file.name);
        const formData = new FormData();
        formData.append("shm_file", file);
        try {
            const response = await fetch("/api/shm/predict", {
                method: "POST", body: formData,
                headers: { Accept: "application/json" }, signal: activeRequest.signal
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error ?? `Prediction failed (${response.status}).`);
            renderResult(data, file.name);
        } catch (error) {
            if (error.name !== "AbortError") {
                showPredictionError(error.message);
                console.error("SHM prediction error:", error);
            }
        }
    }

    function renderAdvisories(advisories) {
        if (!lta.list || !lta.details) return;
        lta.list.replaceChildren();
        lta.details.hidden = advisories.length === 0;
        advisories.forEach((advisory) => {
            const item = document.createElement("article");
            const time = document.createElement("time");
            const message = document.createElement("p");
            item.className = "lta-advisory-item";
            time.dateTime = advisory.created_at ?? "";
            const created = advisory.created_at ? new Date(advisory.created_at) : null;
            time.textContent = created && !Number.isNaN(created.getTime())
                ? created.toLocaleString("en-SG", {
                    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Singapore"
                })
                : "Time unavailable";
            message.textContent = advisory.content ?? "No advisory text supplied.";
            item.append(time, message);
            lta.list.append(item);
        });
    }

    async function loadLtaStatus() {
        if (!lta.panel) return;
        try {
            const response = await fetch("/api/lta/train-service-status", {
                headers: { Accept: "application/json" }, cache: "no-store"
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.connected === false) {
                throw new Error(data.error ?? "LTA service data is unavailable.");
            }
            const advisories = Array.isArray(data.advisories) ? data.advisories : [];
            const affected = Array.isArray(data.affected_segments) ? data.affected_segments : [];
            const state = Number(data.status_code) === 2 ? "disrupted" : "normal";
            lta.panel.dataset.state = state;
            setText(lta.status, data.status ?? (state === "normal" ? "Operational" : "Disrupted"));
            setText(lta.description, data.description ?? "Live LTA status received");
            setText(lta.affectedCount, String(affected.length));
            setText(lta.advisoryCount, String(advisories.length));
            setText(lta.checkedTime, formatSingaporeTime(data.checked_at));
            renderAdvisories(advisories);
        } catch (error) {
            lta.panel.dataset.state = "unavailable";
            setText(lta.status, "Unavailable");
            setText(lta.description, error.message);
            setText(lta.affectedCount, "—");
            setText(lta.advisoryCount, "—");
            setText(lta.checkedTime, "—");
            setText(el.severityRank, "—");
            setText(el.reviewDelta, "—");
            setText(el.criticalGap, "—");
            setText(
                el.primaryFinding,
                fileName
                    ? "Analysing the selected sensor record…"
                    : "Select a sensor record to begin assessment."
            );
            setText(el.possibleConcern, "—");

            if (el.findingsList) {
                el.findingsList.replaceChildren();
            }
            renderAdvisories([]);
            console.error("LTA status error:", error);
        }
    }

    if (fileInput) {
        fileInput.addEventListener("change", () => loadUploadedFile(fileInput.files?.[0]));
        resetDisplay();
    }
    loadLtaStatus();
    const refreshTimer = window.setInterval(loadLtaStatus, 120000);
    window.addEventListener("pagehide", () => window.clearInterval(refreshTimer), { once: true });
});
