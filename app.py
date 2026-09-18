from datetime import datetime, timezone
from pathlib import Path
import re

import numpy as np
import pandas as pd
from flask import Flask, jsonify, render_template

from diagnosis import predict_shm


app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
SHM_DATA_DIR = BASE_DIR / "data" / "shm"
SHM_MODEL_DIR = BASE_DIR / "saved_models"


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
# SHM HELPERS
# ==================================================

def find_shm_file(record_id: str) -> Path | None:
    """
    Find the CSV belonging to a selected SHM record.

    Supported examples:
    001.csv
    shm_001.csv
    SHM_001.csv
    structure_001.csv
    """
    possible_files = [
        SHM_DATA_DIR / f"{record_id}.csv",
        SHM_DATA_DIR / f"shm_{record_id}.csv",
        SHM_DATA_DIR / f"SHM_{record_id}.csv",
        SHM_DATA_DIR / f"structure_{record_id}.csv",
    ]

    for file_path in possible_files:
        if file_path.is_file():
            return file_path

    return None


def extract_signal_statistics(shm_df: pd.DataFrame) -> dict:
    """
    Calculate the real signal measurements displayed by shm.html.
    This uses the same first column used by diagnosis.py.
    """
    stress = pd.to_numeric(shm_df.iloc[:, 0], errors="coerce")
    stress = stress.dropna().to_numpy(dtype=float)

    if stress.size == 0:
        raise ValueError("The selected SHM file contains no valid sensor values.")

    mean_value = float(np.mean(stress))
    peak_to_peak = float(np.ptp(stress))
    rms_value = float(np.sqrt(np.mean(np.square(stress))))

    if stress.size > 1:
        centred_signal = stress - mean_value
        fft_magnitude = np.abs(np.fft.rfft(centred_signal))
        frequencies = np.fft.rfftfreq(stress.size)

        # Ignore the zero-frequency/DC component.
        if fft_magnitude.size > 1:
            dominant_index = int(np.argmax(fft_magnitude[1:]) + 1)
            dominant_frequency = float(frequencies[dominant_index])
        else:
            dominant_frequency = 0.0
    else:
        dominant_frequency = 0.0

    return {
        "mean": mean_value,
        "peak_to_peak": peak_to_peak,
        "rms": rms_value,
        "dominant_frequency": dominant_frequency,
    }


def prepare_chart_samples(shm_df: pd.DataFrame, limit: int = 2000) -> list:
    """
    Reduce very large signals before sending them to the browser.
    The model still receives the complete dataset.
    """
    stress = pd.to_numeric(shm_df.iloc[:, 0], errors="coerce")
    stress = stress.dropna().to_numpy(dtype=float)

    if stress.size <= limit:
        return stress.tolist()

    sample_indexes = np.linspace(
        0,
        stress.size - 1,
        num=limit,
        dtype=int
    )

    return stress[sample_indexes].tolist()


# ==================================================
# SHM PREDICTION API
# ==================================================

@app.route("/api/shm/<record_id>", methods=["GET"])
def shm_prediction(record_id):
    # Only accept record identifiers such as 001, 002 or 120.
    if not re.fullmatch(r"\d{1,6}", record_id):
        return jsonify({
            "error": "Invalid SHM record identifier."
        }), 400

    normalised_record_id = record_id.zfill(3)
    data_file = find_shm_file(normalised_record_id)

    if data_file is None:
        return jsonify({
            "error": (
                f"No SHM dataset was found for record "
                f"{normalised_record_id}."
            )
        }), 404

    required_model_files = [
        SHM_MODEL_DIR / "shm_global_edges.npy",
        SHM_MODEL_DIR / "shm_scaler.pkl",
        SHM_MODEL_DIR / "shm_XGBoost_Reg.json",
    ]

    missing_model_files = [
        file_path.name
        for file_path in required_model_files
        if not file_path.is_file()
    ]

    if missing_model_files:
        return jsonify({
            "error": (
                "Missing SHM model file(s): "
                + ", ".join(missing_model_files)
            )
        }), 500

    try:
        shm_df = pd.read_csv(data_file)

        if shm_df.empty:
            return jsonify({
                "error": "The selected SHM dataset is empty."
            }), 422

        prediction = predict_shm(
            shm_df,
            model_dir=str(SHM_MODEL_DIR)
        )

        statistics = extract_signal_statistics(shm_df)
        chart_samples = prepare_chart_samples(shm_df)

        original_sample_count = int(
            pd.to_numeric(
                shm_df.iloc[:, 0],
                errors="coerce"
            ).notna().sum()
        )

        return jsonify({
            "record_id": normalised_record_id,
            "structure_id": f"SHM-{normalised_record_id}",
            "source_file": data_file.name,
            "predicted_damage": float(prediction),
            "features": statistics,
            "stress_samples": chart_samples,
            "sample_count": original_sample_count,
            "predicted_at": datetime.now(timezone.utc).isoformat()
        })

    except ValueError as error:
        return jsonify({
            "error": str(error)
        }), 422

    except Exception as error:
        app.logger.exception(
            "SHM prediction failed for record %s",
            normalised_record_id
        )

        return jsonify({
            "error": f"SHM model error: {error}"
        }), 500


if __name__ == "__main__":
    app.run(debug=True)