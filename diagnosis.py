import os
import re

import joblib
import numpy as np
import pandas as pd
import rainflow
import xgboost as xgb

from scipy.stats import skew, kurtosis, linregress


# ==========================================
# 1. DOOR SUBSYSTEM (Rule-Based)
# ==========================================

def analyze_door_data(
    door_df: pd.DataFrame
) -> pd.DataFrame:

    # Fix timestamps
    time_str = (
        door_df["Datetime"]
        .astype(str)
        .str.split("-")
        .apply(lambda x: "-".join(x[:6]))
    )

    door_df["parsed_time"] = pd.to_datetime(
        time_str,
        format="%Y-%m-%d-%H-%M-%S",
        errors="coerce"
    )

    door_df = (
        door_df
        .sort_values(by="parsed_time")
        .reset_index(drop=True)
    )

    # Segment moving doors
    active_mask = (
        (door_df["Open command"] == 1) |
        (door_df["Close command"] == 1) |
        (door_df["Door is opening"] == 1)
    )

    door_df["segment_id"] = (~active_mask).cumsum()

    segments = (
        door_df[active_mask]
        .groupby("segment_id")
    )

    results = []

    for _, segment in segments:
        start_time = (
            segment["parsed_time"]
            .min()
            .strftime("%Y-%m-%d %H:%M:%S")
        )

        end_time = (
            segment["parsed_time"]
            .max()
            .strftime("%Y-%m-%d %H:%M:%S")
        )

        maximum_current = segment[
            "Motor current(mA)"
        ].max()

        prediction = (
            "Abnormal resistance"
            if maximum_current > 800
            else "Normal"
        )

        results.append({
            "start_time": start_time,
            "end_time": end_time,
            "prediction": prediction
        })

    return pd.DataFrame(results)


# ==========================================
# 2. ACV SUBSYSTEM (Statistical Math)
# ==========================================

def analyze_acv_data(
    acv_df: pd.DataFrame
) -> str:

    car_numbers = list(
        set(
            re.findall(
                r"Car (\d{2})",
                " ".join(acv_df.columns)
            )
        )
    )

    car_scores = {}

    for car in car_numbers:
        temperature_columns = [
            column
            for column in acv_df.columns
            if (
                f"Car {car}" in column and
                "Temperatu" in column
            )
        ]

        if temperature_columns:
            temperature_data = (
                acv_df[temperature_columns]
                .apply(
                    pd.to_numeric,
                    errors="coerce"
                )
            )

            car_scores[car] = (
                temperature_data
                .var()
                .sum()
            )

        else:
            car_scores[car] = 0.0

    ranked_cars = sorted(
        car_scores,
        key=car_scores.get,
        reverse=True
    )

    return "|".join(ranked_cars)


# ==========================================
# 3. RAIL CORRUGATION SUBSYSTEM (ML)
# ==========================================

def extract_rail_features(
    df: pd.DataFrame
) -> np.ndarray:

    numeric_df = df.select_dtypes(
        include=[np.number]
    )

    fft_peaks = np.abs(
        np.fft.rfft(
            numeric_df.values,
            axis=0
        )
    ).max(axis=0)

    return np.hstack([
        numeric_df.std().values,
        fft_peaks
    ])


# ==========================================
# 4. SHM SUBSYSTEM
# 26-Feature Physics + Machine Learning
# ==========================================

def extract_shm_features(
    df: pd.DataFrame,
    global_edges: np.ndarray
) -> np.ndarray:

    stress = df.iloc[:, 0].values
    length = len(stress)

    # --------------------------------------
    # 1. Distribution statistics
    # --------------------------------------

    mean_value = np.mean(stress)
    standard_deviation = np.std(stress)
    peak_to_peak = np.ptp(stress)

    rms = np.sqrt(
        np.mean(stress ** 2)
    )

    skewness_value = skew(stress)
    kurtosis_value = kurtosis(stress)

    percentile_5, percentile_25, \
        percentile_75, percentile_95 = (
            np.percentile(
                stress,
                [5, 25, 75, 95]
            )
        )

    interquartile_range = (
        percentile_75 - percentile_25
    )

    mean_crossings = (
        np.sum(
            np.diff(
                stress > mean_value
            ) != 0
        ) / length
    )

    # --------------------------------------
    # 2. Rainflow fatigue physics
    # --------------------------------------

    rainflow_cycles = list(
        rainflow.extract_cycles(stress)
    )

    cycle_ranges = np.array([
        cycle[0]
        for cycle in rainflow_cycles
    ])

    cycle_counts = np.array([
        cycle[2]
        for cycle in rainflow_cycles
    ])

    miner_proxy = (
        np.sum(
            (cycle_ranges ** 3) *
            cycle_counts
        )
        if len(cycle_ranges) > 0
        else 0
    )

    if len(cycle_ranges) > 0:
        histogram, _ = np.histogram(
            cycle_ranges,
            bins=global_edges,
            weights=cycle_counts
        )

    else:
        histogram = np.zeros(
            len(global_edges) - 1
        )

    # --------------------------------------
    # 3. Non-stationarity and trends
    # --------------------------------------

    number_of_windows = 5

    signal_windows = np.array_split(
        stress,
        number_of_windows
    )

    window_rms = [
        np.sqrt(np.mean(window ** 2))
        for window in signal_windows
        if len(window) > 0
    ]

    if len(window_rms) > 1:
        slope, _, _, _, _ = linregress(
            range(len(window_rms)),
            window_rms
        )

        maximum_window_rms = np.max(
            window_rms
        )

    else:
        slope = 0
        maximum_window_rms = rms

    half_index = length // 2

    rms_first_half = (
        np.sqrt(
            np.mean(
                stress[:half_index] ** 2
            )
        )
        if half_index > 0
        else rms
    )

    rms_second_half = (
        np.sqrt(
            np.mean(
                stress[half_index:] ** 2
            )
        )
        if half_index > 0
        else rms
    )

    half_ratio = (
        rms_second_half /
        (rms_first_half + 1e-8)
    )

    # --------------------------------------
    # 4. Frequency-domain features
    # --------------------------------------

    fft_values = np.fft.rfft(stress)
    fft_magnitude = np.abs(fft_values)
    frequencies = np.fft.rfftfreq(length)

    spectral_energy = np.sum(
        fft_magnitude ** 2
    )

    spectral_centroid = (
        np.sum(
            frequencies *
            fft_magnitude
        ) /
        (
            np.sum(fft_magnitude) +
            1e-8
        )
    )

    dominant_index = np.argmax(
        fft_magnitude
    )

    dominant_frequency = frequencies[
        dominant_index
    ]

    dominant_magnitude = fft_magnitude[
        dominant_index
    ]

    scalar_features = [
        length,
        mean_value,
        standard_deviation,
        peak_to_peak,
        rms,
        skewness_value,
        kurtosis_value,
        percentile_5,
        percentile_25,
        percentile_75,
        percentile_95,
        interquartile_range,
        mean_crossings,
        miner_proxy,
        slope,
        maximum_window_rms,
        half_ratio,
        spectral_energy,
        spectral_centroid,
        dominant_frequency,
        dominant_magnitude
    ]

    return np.hstack([
        scalar_features,
        histogram
    ])


def predict_shm(
    df: pd.DataFrame,
    model_dir: str = "saved_models"
) -> float:

    # Load model artifacts
    edges_path = os.path.join(
        model_dir,
        "shm_global_edges.npy"
    )

    scaler_path = os.path.join(
        model_dir,
        "shm_scaler.pkl"
    )

    model_path = os.path.join(
        model_dir,
        "shm_XGBoost_Reg.json"
    )

    global_edges = np.load(
        edges_path
    )

    scaler = joblib.load(
        scaler_path
    )

    model = xgb.XGBRegressor()

    model.load_model(
        model_path
    )

    # Extract and scale model features
    features = extract_shm_features(
        df,
        global_edges
    ).reshape(1, -1)

    scaled_features = scaler.transform(
        features
    )

    # Predict in logarithmic space
    log_prediction = model.predict(
        scaled_features
    )[0]

    # Convert the prediction back to its
    # original scale
    predicted_value = float(
        np.clip(
            np.expm1(log_prediction),
            a_min=0,
            a_max=None
        )
    )

    return predicted_value


# ==========================================
# 5. SHM DASHBOARD STATISTICS
# ==========================================

def get_shm_dashboard_data(
    df: pd.DataFrame
) -> dict:
    """
    Generate named statistics for the SHM dashboard.

    This function does not change the trained model,
    the model features, the scaler or the prediction.
    It only prepares readable measurements for the UI.
    """

    if df.empty:
        raise ValueError(
            "The SHM dataset is empty."
        )

    stress = pd.to_numeric(
        df.iloc[:, 0],
        errors="coerce"
    ).dropna().to_numpy(dtype=float)

    if stress.size < 2:
        raise ValueError(
            "The SHM dataset requires at least "
            "two valid stress samples."
        )

    length = stress.size

    # --------------------------------------
    # Distribution measurements
    # --------------------------------------

    mean_value = np.mean(stress)
    standard_deviation = np.std(stress)
    peak_to_peak = np.ptp(stress)

    rms_value = np.sqrt(
        np.mean(stress ** 2)
    )

    skewness_value = skew(stress)
    kurtosis_value = kurtosis(stress)

    # --------------------------------------
    # Rainflow fatigue measurements
    # --------------------------------------

    rainflow_cycles = list(
        rainflow.extract_cycles(stress)
    )

    cycle_ranges = np.array(
        [
            cycle[0]
            for cycle in rainflow_cycles
        ],
        dtype=float
    )

    cycle_counts = np.array(
        [
            cycle[2]
            for cycle in rainflow_cycles
        ],
        dtype=float
    )

    if cycle_ranges.size > 0:
        miner_proxy = np.sum(
            (cycle_ranges ** 3) *
            cycle_counts
        )

        total_cycles = np.sum(
            cycle_counts
        )

        maximum_cycle_range = np.max(
            cycle_ranges
        )

    else:
        miner_proxy = 0.0
        total_cycles = 0.0
        maximum_cycle_range = 0.0

    # --------------------------------------
    # RMS trend measurements
    # --------------------------------------

    signal_windows = [
        window
        for window in np.array_split(
            stress,
            5
        )
        if window.size > 0
    ]

    window_rms = np.array([
        np.sqrt(
            np.mean(window ** 2)
        )
        for window in signal_windows
    ])

    if window_rms.size > 1:
        rms_slope = linregress(
            np.arange(
                window_rms.size
            ),
            window_rms
        ).slope

    else:
        rms_slope = 0.0

    maximum_window_rms = np.max(
        window_rms
    )

    half_index = length // 2

    rms_first_half = (
        np.sqrt(
            np.mean(
                stress[:half_index] ** 2
            )
        )
        if half_index > 0
        else rms_value
    )

    rms_second_half = (
        np.sqrt(
            np.mean(
                stress[half_index:] ** 2
            )
        )
        if half_index > 0
        else rms_value
    )

    half_ratio = (
        rms_second_half /
        (rms_first_half + 1e-8)
    )

    # --------------------------------------
    # Frequency-domain measurements
    # --------------------------------------

    fft_values = np.fft.rfft(
        stress
    )

    fft_magnitude = np.abs(
        fft_values
    )

    frequencies = np.fft.rfftfreq(
        length
    )

    spectral_energy = np.sum(
        fft_magnitude ** 2
    )

    spectral_centroid = (
        np.sum(
            frequencies *
            fft_magnitude
        ) /
        (
            np.sum(fft_magnitude) +
            1e-8
        )
    )

    dominant_index = int(
        np.argmax(fft_magnitude)
    )

    dominant_frequency = frequencies[
        dominant_index
    ]

    dominant_magnitude = fft_magnitude[
        dominant_index
    ]

    # --------------------------------------
    # JSON-safe value conversion
    # --------------------------------------

    def safe_float(value):
        converted_value = float(value)

        if not np.isfinite(converted_value):
            return None

        return converted_value

    return {
        "sample_count": int(length),

        "mean": safe_float(
            mean_value
        ),

        "standard_deviation": safe_float(
            standard_deviation
        ),

        "peak_to_peak": safe_float(
            peak_to_peak
        ),

        "rms": safe_float(
            rms_value
        ),

        "skewness": safe_float(
            skewness_value
        ),

        "kurtosis": safe_float(
            kurtosis_value
        ),

        "miner_proxy": safe_float(
            miner_proxy
        ),

        "rainflow_cycles": safe_float(
            total_cycles
        ),

        "maximum_cycle_range": safe_float(
            maximum_cycle_range
        ),

        "rms_slope": safe_float(
            rms_slope
        ),

        "maximum_window_rms": safe_float(
            maximum_window_rms
        ),

        "half_ratio": safe_float(
            half_ratio
        ),

        "spectral_energy": safe_float(
            spectral_energy
        ),

        "spectral_centroid": safe_float(
            spectral_centroid
        ),

        "dominant_frequency": safe_float(
            dominant_frequency
        ),

        "dominant_magnitude": safe_float(
            dominant_magnitude
        )
    }