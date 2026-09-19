import os
import re
import numpy as np
import pandas as pd
import rainflow
import xgboost as xgb
import joblib
from scipy.stats import skew, kurtosis, linregress

# ==========================================
# 1. DOOR SUBSYSTEM (Rule-Based)
# ==========================================
def analyze_door_data(door_df: pd.DataFrame) -> pd.DataFrame:
    # Fix timestamps
    time_str = door_df['Datetime'].astype(str).str.split('-').apply(lambda x: '-'.join(x[:6]))
    door_df['parsed_time'] = pd.to_datetime(time_str, format='%Y-%m-%d-%H-%M-%S', errors='coerce')
    door_df = door_df.sort_values(by='parsed_time').reset_index(drop=True)

    # Segment moving doors
    active_mask = (door_df['Open command'] == 1) | (door_df['Close command'] == 1) | (door_df['Door is opening'] == 1)
    door_df['segment_id'] = (~active_mask).cumsum()
    segments = door_df[active_mask].groupby('segment_id')

    results = []
    for _, seg in segments:
        start_time = seg['parsed_time'].min().strftime('%Y-%m-%d %H:%M:%S')
        end_time = seg['parsed_time'].max().strftime('%Y-%m-%d %H:%M:%S')
        max_current = seg['Motor current(mA)'].max()
        prediction = "Abnormal resistance" if max_current > 800 else "Normal"
        results.append({'start_time': start_time, 'end_time': end_time, 'prediction': prediction})
        
    return pd.DataFrame(results)


# ==========================================
# 2. ACV SUBSYSTEM (Statistical Math)
# ==========================================
def analyze_acv_data(acv_df: pd.DataFrame) -> str:
    car_numbers = list(set(re.findall(r'Car (\d{2})', ' '.join(acv_df.columns))))
    car_scores = {}

    for car in car_numbers:
        temp_cols = [c for c in acv_df.columns if f'Car {car}' in c and 'Temperatu' in c]
        if temp_cols:
            temp_data = acv_df[temp_cols].apply(pd.to_numeric, errors='coerce')
            car_scores[car] = temp_data.var().sum()
        else:
            car_scores[car] = 0.0

    ranked_cars = sorted(car_scores, key=car_scores.get, reverse=True)
    return "|".join(ranked_cars)


# ==========================================
# 3. RAIL CORRUGATION SUBSYSTEM (ML)
# ==========================================
def extract_rail_features(df: pd.DataFrame) -> np.ndarray:
    num_df = df.select_dtypes(include=[np.number])
    fft_peaks = np.abs(np.fft.rfft(num_df.values, axis=0)).max(axis=0)
    return np.hstack([num_df.std().values, fft_peaks])


# ==========================================
# 4. SHM SUBSYSTEM (26-Feature Physics + ML)
# ==========================================
def extract_shm_features(df: pd.DataFrame, global_edges: np.ndarray) -> np.ndarray:
    stress = df.iloc[:, 0].values
    length = len(stress)

    # 1. Distribution Stats
    mean_val = np.mean(stress)
    std_val = np.std(stress)
    ptp = np.ptp(stress)
    rms = np.sqrt(np.mean(stress**2))
    skew_val = skew(stress)
    kurt_val = kurtosis(stress)
    p5, p25, p75, p95 = np.percentile(stress, [5, 25, 75, 95])
    iqr = p75 - p25
    mean_crossings = np.sum(np.diff(stress > mean_val) != 0) / length

    # 2. Rainflow Fatigue Physics
    rf_cycles = list(rainflow.extract_cycles(stress))
    ranges = np.array([c[0] for c in rf_cycles])
    counts = np.array([c[2] for c in rf_cycles])

    miner_proxy = np.sum((ranges**3) * counts) if len(ranges) > 0 else 0

    if len(ranges) > 0:
        hist, _ = np.histogram(ranges, bins=global_edges, weights=counts)
    else:
        hist = np.zeros(len(global_edges) - 1)

    # 3. Non-Stationarity & Trends
    num_windows = 5
    splits = np.array_split(stress, num_windows)
    window_rms = [np.sqrt(np.mean(w**2)) for w in splits if len(w) > 0]

    if len(window_rms) > 1:
        slope, _, _, _, _ = linregress(range(len(window_rms)), window_rms)
        max_win_rms = np.max(window_rms)
    else:
        slope, max_win_rms = 0, rms

    half_idx = length // 2
    rms_first = np.sqrt(np.mean(stress[:half_idx]**2)) if half_idx > 0 else rms
    rms_second = np.sqrt(np.mean(stress[half_idx:]**2)) if half_idx > 0 else rms
    half_ratio = rms_second / (rms_first + 1e-8)

    # 4. Frequency-Domain (FFT)
    fft_vals = np.fft.rfft(stress)
    fft_mag = np.abs(fft_vals)
    freqs = np.fft.rfftfreq(length)

    spectral_energy = np.sum(fft_mag**2)
    spectral_centroid = np.sum(freqs * fft_mag) / (np.sum(fft_mag) + 1e-8)
    dom_idx = np.argmax(fft_mag)
    dom_freq = freqs[dom_idx]
    dom_mag = fft_mag[dom_idx]

    scalar_features = [
        length, mean_val, std_val, ptp, rms, skew_val, kurt_val,
        p5, p25, p75, p95, iqr, mean_crossings,
        miner_proxy, slope, max_win_rms, half_ratio,
        spectral_energy, spectral_centroid, dom_freq, dom_mag
    ]
    return np.hstack([scalar_features, hist])


def predict_shm(df: pd.DataFrame, model_dir: str = "saved_models") -> float:
    # Load artifacts
    edges_path = os.path.join(model_dir, "shm_global_edges.npy")
    scaler_path = os.path.join(model_dir, "shm_scaler.pkl")
    model_path = os.path.join(model_dir, "shm_XGBoost_Reg.json")

    global_edges = np.load(edges_path)
    scaler = joblib.load(scaler_path)
    
    model = xgb.XGBRegressor()
    model.load_model(model_path)

    # Extract features & scale
    features = extract_shm_features(df, global_edges).reshape(1, -1)
    features_scaled = scaler.transform(features)

    # Predict in log space and reverse via expm1
    log_pred = model.predict(features_scaled)[0]
    pred_val = float(np.clip(np.expm1(log_pred), a_min=0, a_max=None))
    
    return pred_val