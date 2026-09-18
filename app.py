import os
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import requests
import joblib
import xgboost as xgb

from flask import Flask, jsonify, render_template, request
from scipy.stats import skew, kurtosis

from diagnosis import extract_shm_features, predict_shm
# This imports the original trained-model function.
# diagnosis.py itself remains unchanged.

app = Flask(__name__)


# ==================================================
# PROJECT PATHS
# ==================================================

BASE_DIR = Path(__file__).resolve().parent

SHM_DATA_DIR = BASE_DIR / "data" / "shm"

# If your model folder is named "shm", change this to:
# SHM_MODEL_DIR = BASE_DIR / "shm"
SHM_MODEL_DIR = BASE_DIR / "shm"

# Reference predictions supplied by the SHM batch model. They are used only
# for comparison/ranking; the uploaded file is still predicted live.
SHM_REFERENCE_PREDICTIONS = {
    "test01.csv": 0.041464, "test02.csv": 0.856480,
    "test03.csv": 0.452787, "test04.csv": 0.030476,
    "test05.csv": 0.031731, "test06.csv": 0.487717,
    "test07.csv": 0.217784, "test08.csv": 0.071171,
    "test09.csv": 0.062316, "test10.csv": 0.098465,
    "test11.csv": 0.048818, "test12.csv": 0.283775,
    "test13.csv": 0.427836, "test14.csv": 0.428186,
    "test15.csv": 0.241956, "test16.csv": 0.060812
}

# ==================================================
# LTA DATAMALL CONFIGURATION
# ==================================================

LTA_BASE_URL = (
    "https://datamall2.mytransport.sg/"
    "ltaodataservice/"
)

# The key is read from PowerShell.
# Never write the real key inside this file.
LTA_ACCOUNT_KEY = os.getenv("LTA_ACCOUNT_KEY")

def get_lta_data(endpoint, parameters=None):
    """
    Retrieves live information from LTA DataMall.
    """

    if not LTA_ACCOUNT_KEY:
        raise RuntimeError(
            "LTA_ACCOUNT_KEY is not configured."
        )

    response = requests.get(
        f"{LTA_BASE_URL}{endpoint}",
        headers={
            "AccountKey": LTA_ACCOUNT_KEY,
            "Accept": "application/json"
        },
        params=parameters,
        timeout=10
    )

    response.raise_for_status()

    return response.json()
# ==================================================
# PAGE ROUTES
# ==================================================

@app.route("/")
def overview():
    return render_template("dashboard.html")


@app.route("/doors")
def door_monitoring():
    return render_template("door.html")


@app.route("/acv")
def acv_monitoring():
    return render_template("acv.html")


@app.route("/rail-corrugation")
def rail_monitoring():
    return render_template("rail.html")


@app.route("/shm")
def shm_monitoring():
    return render_template("shm.html")


# ==================================================
# DASHBOARD-ONLY SHM CALCULATIONS
# ==================================================

def safe_number(value):
    """
    Converts NumPy numbers into JSON-safe Python values.
    """

    converted_value = float(value)

    if not np.isfinite(converted_value):
        return None

    return converted_value


def calculate_shm_dashboard_statistics(dataframe):
    """
    Calculates measurements shown by the dashboard.

    This function does not change:
    - the trained XGBoost model
    - the scaler
    - the model features
    - diagnosis.py
    """

    if dataframe.empty:
        raise ValueError("The selected SHM dataset is empty.")

    stress = pd.to_numeric(
        dataframe.iloc[:, 0],
        errors="coerce"
    ).dropna().to_numpy(dtype=float)

    if stress.size < 2:
        raise ValueError(
            "The SHM dataset requires at least "
            "two valid stress samples."
        )

    mean_value = np.mean(stress)
    standard_deviation = np.std(stress)
    peak_to_peak = np.ptp(stress)
    rms_value = np.sqrt(np.mean(stress ** 2))

    skewness_value = skew(stress)
    kurtosis_value = kurtosis(stress)

    fft_values = np.fft.rfft(stress)
    fft_magnitude = np.abs(fft_values)
    frequencies = np.fft.rfftfreq(stress.size)

    dominant_index = int(np.argmax(fft_magnitude))

    return {
        "mean": safe_number(mean_value),
        "standard_deviation": safe_number(
            standard_deviation
        ),
        "peak_to_peak": safe_number(peak_to_peak),
        "ptp": safe_number(peak_to_peak),
        "rms": safe_number(rms_value),
        "skewness": safe_number(skewness_value),
        "kurtosis": safe_number(kurtosis_value),
        "dominant_frequency": safe_number(
            frequencies[dominant_index]
        ),
        "dom_freq": safe_number(
            frequencies[dominant_index]
        ),
        "dominant_magnitude": safe_number(
            fft_magnitude[dominant_index]
        )
    }


def classify_shm_damage(predicted_damage):
    """
    Converts the regression output into dashboard wording.

    These are dashboard interpretation thresholds,
    not part of the trained XGBoost model.
    """

    if predicted_damage < 0.3:
        return {
            "condition": "Healthy",
            "recommended_action": (
                "Continue routine monitoring"
            )
        }

    if predicted_damage < 0.7:
        return {
            "condition": "Review",
            "recommended_action": (
                "Schedule an engineering inspection"
            )
        }

    return {
        "condition": "Critical",
        "recommended_action": (
            "Prioritise inspection and maintenance"
        )
    }


def calculate_threshold_comparison(predicted_damage):
    """Return exact distances from the dashboard decision thresholds."""
    return {
        "review_threshold": 0.3,
        "critical_threshold": 0.7,
        "above_review_by": safe_number(max(predicted_damage - 0.3, 0)),
        "below_critical_by": safe_number(max(0.7 - predicted_damage, 0)),
        "above_critical_by": safe_number(max(predicted_damage - 0.7, 0))
    }


def calculate_severity_rank(predicted_damage, file_name):
    """Compare a live result with the supplied 16-record prediction batch."""
    normalized_name = Path(file_name).name.lower()
    reference = dict(SHM_REFERENCE_PREDICTIONS)
    reference[normalized_name] = float(predicted_damage)
    scores = sorted(reference.values(), reverse=True)
    rank = 1 + sum(score > predicted_damage for score in scores)
    batch_mean = float(np.mean(list(SHM_REFERENCE_PREDICTIONS.values())))

    return {
        "rank": rank,
        "total": len(reference),
        "batch_mean": batch_mean,
        "difference_from_batch_mean": float(predicted_damage - batch_mean),
        "percent_from_batch_mean": (
            float(((predicted_damage - batch_mean) / batch_mean) * 100)
            if batch_mean else None
        )
    }


def explain_shm_prediction(dataframe):
    """
    Calculate real XGBoost feature contributions and translate the strongest
    positive contribution groups into operator-facing findings.

    The original diagnosis.py prediction pipeline is not modified.
    """
    edges = np.load(SHM_MODEL_DIR / "shm_global_edges.npy")
    scaler = joblib.load(SHM_MODEL_DIR / "shm_scaler.pkl")
    model = xgb.XGBRegressor()
    model.load_model(SHM_MODEL_DIR / "shm_XGBoost_Reg.json")

    raw_features = extract_shm_features(dataframe, edges).reshape(1, -1)
    scaled_features = scaler.transform(raw_features)
    contributions = model.get_booster().predict(
        xgb.DMatrix(scaled_features),
        pred_contribs=True
    )[0][:-1]

    scalar_names = [
        "length", "mean", "standard_deviation", "peak_to_peak", "rms",
        "skewness", "kurtosis", "percentile_5", "percentile_25",
        "percentile_75", "percentile_95", "interquartile_range",
        "mean_crossings", "miner_proxy", "rms_trend", "maximum_window_rms",
        "half_ratio", "spectral_energy", "spectral_centroid",
        "dominant_frequency", "dominant_magnitude"
    ]
    feature_names = scalar_names + [
        f"rainflow_bin_{index + 1}"
        for index in range(len(edges) - 1)
    ]

    groups = {
        "fatigue_cycles": {
            "features": {"miner_proxy"},
            "finding": "Repeated high-load stress cycles influenced the result.",
            "concern": "Possible fatigue accumulation at the monitored sensor location."
        },
        "stress_excursions": {
            "features": {
                "peak_to_peak", "percentile_5", "percentile_95",
                "dominant_magnitude"
            },
            "finding": "Large stress changes or peak events influenced the result.",
            "concern": "Possible impact loading or excessive structural movement."
        },
        "response_intensity": {
            "features": {"rms", "maximum_window_rms", "spectral_energy"},
            "finding": "Elevated structural response intensity influenced the result.",
            "concern": "Possible sustained vibration, looseness or abnormal loading."
        },
        "rising_response": {
            "features": {"rms_trend", "half_ratio"},
            "finding": "The stress response increased during the recording.",
            "concern": "The monitored condition may be developing rather than remaining stable."
        },
        "signal_instability": {
            "features": {
                "standard_deviation", "interquartile_range", "mean_crossings",
                "skewness", "kurtosis"
            },
            "finding": "Irregular or unstable stress behaviour influenced the result.",
            "concern": "Possible intermittent loading, movement or sensor instability."
        },
        "repeated_vibration": {
            "features": {"spectral_centroid", "dominant_frequency"},
            "finding": "A repeated vibration pattern influenced the result.",
            "concern": "Possible resonance or a repeating mechanical excitation."
        },
        "baseline_load": {
            "features": {"mean", "percentile_25", "percentile_75"},
            "finding": "The overall stress level influenced the result.",
            "concern": "Possible change in the structure's usual loading condition."
        }
    }

    grouped_values = {name: 0.0 for name in groups}
    for feature_name, contribution in zip(feature_names, contributions):
        positive_value = max(float(contribution), 0.0)
        if feature_name.startswith("rainflow_bin_"):
            grouped_values["fatigue_cycles"] += positive_value
            continue
        for group_name, group in groups.items():
            if feature_name in group["features"]:
                grouped_values[group_name] += positive_value
                break

    ranked_groups = sorted(
        grouped_values.items(), key=lambda item: item[1], reverse=True
    )
    ranked_groups = [item for item in ranked_groups if item[1] > 0][:3]
    positive_total = sum(grouped_values.values()) or 1.0

    findings = [
        {
            "key": group_name,
            "finding": groups[group_name]["finding"],
            "possible_concern": groups[group_name]["concern"],
            "contribution_share": float((value / positive_total) * 100)
        }
        for group_name, value in ranked_groups
    ]

    return findings


def build_operator_assessment(dataframe, predicted_damage, file_name):
    interpretation = classify_shm_damage(predicted_damage)
    findings = explain_shm_prediction(dataframe)
    condition = interpretation["condition"]

    if condition == "Healthy":
        decision = (
            "No immediate intervention indicated. Continue routine monitoring "
            "and compare the next sensor record for change."
        )
    elif condition == "Review":
        decision = (
            "Schedule an engineering inspection of the monitored sensor area. "
            "Check for fatigue cracking, looseness and unexpected movement."
        )
    else:
        decision = (
            "Prioritise an engineering inspection and follow the approved "
            "maintenance procedure before continued operation."
        )

    return {
        "condition": condition,
        "threshold_comparison": calculate_threshold_comparison(predicted_damage),
        "severity": calculate_severity_rank(predicted_damage, file_name),
        "findings": findings,
        "primary_finding": (
            findings[0]["finding"] if findings
            else "The combined stress pattern influenced the model result."
        ),
        "possible_concern": (
            findings[0]["possible_concern"] if findings
            else "Further engineering review is required to identify the cause."
        ),
        "maintenance_decision": decision
    }


# ==================================================
# SHM PREDICTION API
# ==================================================

@app.get("/api/shm/<record_id>")
def shm_prediction_api(record_id):
    """
    Example:
    /api/shm/001

    Structure 001 loads:
    data/shm/train01.csv
    """

    if not record_id.isdigit():
        return jsonify({
            "error": "The SHM record ID must be numeric."
        }), 400

    normalized_id = record_id.zfill(3)
    dataset_number = int(normalized_id)

    dataset_path = (
        SHM_DATA_DIR /
        f"train{dataset_number:02d}.csv"
    )

    if not dataset_path.is_file():
        return jsonify({
            "error": (
                f"No SHM dataset was found for "
                f"record {normalized_id}. "
                f"Expected file: {dataset_path.name}"
            )
        }), 404

    try:
        dataframe = pd.read_csv(dataset_path)

        if dataframe.empty:
            raise ValueError(
                "The selected SHM dataset is empty."
            )

        # Validate the first column without modifying
        # the dataframe sent to the original model.
        stress_column = pd.to_numeric(
            dataframe.iloc[:, 0],
            errors="coerce"
        )

        if stress_column.isna().any():
            raise ValueError(
                "The first column of the SHM dataset "
                "contains missing or non-numeric values."
            )

        if len(stress_column) < 2:
            raise ValueError(
                "The SHM dataset requires at least "
                "two stress samples."
            )

        # This is the real trained-model prediction.
        predicted_damage = predict_shm(
            dataframe,
            model_dir=str(SHM_MODEL_DIR)
        )

        # These are real statistics calculated from
        # the same selected input dataset.
        statistics = calculate_shm_dashboard_statistics(
            dataframe
        )

        interpretation = classify_shm_damage(
            predicted_damage
        )

        assessment = build_operator_assessment(
            dataframe,
            predicted_damage,
            dataset_path.name
        )

        stress_samples = (
            stress_column
            .astype(float)
            .tolist()
        )

        return jsonify({
            "record_id": normalized_id,
            "structure_id": f"SHM-{normalized_id}",
            "predicted_damage": predicted_damage,
            "prediction": predicted_damage,
            "condition": interpretation["condition"],
            "recommended_action": (
                assessment["maintenance_decision"]
            ),
            "assessment": assessment,
            "threshold_comparison": assessment["threshold_comparison"],
            "severity": assessment["severity"],
            "findings": assessment["findings"],
            "sample_count": len(stress_samples),
            "features": statistics,
            "statistics": statistics,
            "stress_samples": stress_samples,
            "samples": stress_samples,
            "predicted_at": (
                datetime.now(timezone.utc).isoformat()
            )
        })

    except FileNotFoundError as error:
        app.logger.exception(
            "An SHM model file is missing."
        )

        return jsonify({
            "error": (
                "An SHM model file is missing. "
                f"{error}"
            )
        }), 500

    except ValueError as error:
        app.logger.exception(
            "Invalid SHM data for record %s.",
            normalized_id
        )

        return jsonify({
            "error": str(error)
        }), 400

    except Exception as error:
        app.logger.exception(
            "SHM prediction failed for record %s.",
            normalized_id
        )

        return jsonify({
            "error": (
                "The SHM prediction could not be completed. "
                f"{error}"
            )
        }), 500
@app.post("/api/shm/predict")
def predict_uploaded_shm():
    uploaded_file = request.files.get("shm_file")

    if uploaded_file is None:
        return jsonify({
            "error": "No SHM CSV file was provided."
        }), 400

    if uploaded_file.filename == "":
        return jsonify({
            "error": "Please select an SHM CSV file."
        }), 400

    if not uploaded_file.filename.lower().endswith(".csv"):
        return jsonify({
            "error": "The selected file must be a CSV file."
        }), 400

    try:
        # Reads the uploaded file directly into memory.
        # It is not permanently stored.
        dataframe = pd.read_csv(uploaded_file.stream)

        if dataframe.empty:
            raise ValueError("The uploaded CSV is empty.")

        stress = pd.to_numeric(
            dataframe.iloc[:, 0],
            errors="coerce"
        )

        if stress.isna().any():
            raise ValueError(
                "The first CSV column must contain only "
                "numeric stress measurements."
            )

        if len(stress) < 2:
            raise ValueError(
                "At least two stress samples are required."
            )

        # Uses the original diagnosis.py.
        predicted_damage = predict_shm(
            dataframe,
            model_dir=str(SHM_MODEL_DIR)
        )

        statistics = calculate_shm_dashboard_statistics(
            dataframe
        )

        interpretation = classify_shm_damage(
            predicted_damage
        )

        assessment = build_operator_assessment(
            dataframe,
            predicted_damage,
            uploaded_file.filename
        )

        stress_samples = stress.astype(float).tolist()

        return jsonify({
            "record_id": uploaded_file.filename,
            "structure_id": uploaded_file.filename,
            "predicted_damage": predicted_damage,
            "prediction": predicted_damage,
            "condition": interpretation["condition"],
            "recommended_action": (
                assessment["maintenance_decision"]
            ),
            "assessment": assessment,
            "threshold_comparison": assessment["threshold_comparison"],
            "severity": assessment["severity"],
            "findings": assessment["findings"],
            "sample_count": len(stress_samples),
            "features": statistics,
            "statistics": statistics,
            "stress_samples": stress_samples,
            "samples": stress_samples,
            "predicted_at": (
                datetime.now(timezone.utc).isoformat()
            )
        })

    except ValueError as error:
        return jsonify({
            "error": str(error)
        }), 400

    except Exception as error:
        app.logger.exception("Uploaded SHM prediction failed")

        return jsonify({
            "error": f"SHM prediction failed: {error}"
        }), 500
# ==================================================
# LIVE LTA TRAIN SERVICE STATUS API
# ==================================================

@app.get("/api/lta/train-service-status")
def lta_train_service_status():
    try:
        payload = get_lta_data("TrainServiceAlerts")
        service_data = payload.get("value", {})

        status_code = int(service_data.get("Status", 0))
        affected_segments = service_data.get(
            "AffectedSegments"
        ) or []

        raw_messages = service_data.get("Message") or []

        advisories = [
            {
                "content": message.get("Content", ""),
                "created_at": message.get("CreatedDate")
            }
            for message in raw_messages
            if isinstance(message, dict)
        ]

        if status_code == 1:
            status = "Normal"
            description = "Normal service or minor delays"

        elif status_code == 2:
            status = "Disrupted"
            description = "Major train service disruption reported"

        else:
            status = "Unknown"
            description = "LTA returned an unknown service status"

        return jsonify({
            "connected": True,
            "status_code": status_code,
            "status": status,
            "description": description,
            "affected_segments": affected_segments,
            "advisories": advisories,
            "checked_at": datetime.now(
                timezone.utc
            ).isoformat()
        })

    except RuntimeError as error:
        return jsonify({
            "connected": False,
            "error": str(error)
        }), 503

    except requests.RequestException as error:
        app.logger.exception(
            "LTA DataMall request failed"
        )

        return jsonify({
            "connected": False,
            "error": "Unable to contact LTA DataMall.",
            "details": str(error)
        }), 502

    except Exception as error:
        app.logger.exception(
            "LTA service status failed"
        )

        return jsonify({
            "connected": False,
            "error": (
                "LTA service data could not be processed: "
                f"{error}"
            )
        }), 500
# ==================================================
# START FLASK
# ==================================================

if __name__ == "__main__":
    app.run(debug=True)
