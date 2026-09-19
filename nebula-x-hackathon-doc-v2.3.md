# Nebula X Hackathon — Master Project Doc V2.3

> **Purpose of this doc:** Single source of truth for the project, updated with technical stack decisions for AI model building, GCP infrastructure, and execution pipeline. Written plainly so any AI assistant or teammate can pick it up with zero prior context and give useful help.

## 1. Event Basics

- **Hackathon:** Nebula X Hackathon 2026 (Land Transport Authority)
- **Duration:** 3 days (Friday 18 Sep 2026, 5:00 PM – Sunday 20 Sep 2026, 5:00 PM)
- **Presentation Checkpoints:** Day 2 (Top 10 Selection at 4:00 PM Submission Cutoff) AND Day 3 (Finalist Presentations)
- **Problem Statement:** Selected at registration; LTA dataset released on Day 1
- **Team Size:** 3 members

## 2. Team & Roles

| Person | Role | Primary Deliverables & Tech Stack |
|---|---|---|
| **Ren** | AI & Model Building Lead | Python 3.10+, Scikit-Learn, XGBoost, BigQuery, GCS, Vertex AI Workbench, `*_predictions.csv` pipeline |
| **May** | Chatbot & AI Integration | Interactive LLM layer integrated on top of the dashboard; assists Thuzar with UI logic |
| **Thuzar** | Dashboard / UI / Presentation | Frontend dashboard visualization, alert system UI, hosting, and Day 2/Day 3 slide decks |

## 3. Problem Statement Chosen

**Problem Statement 3: Predictive Fault Detection** ("A living railway whispers secrets about our trains")

- **Goal:** Build an AI/ML solution that ingests high-velocity telemetry (doors, braking relays, bogie temperature sensors) to detect early anomalies, predict future fault risks, and output structured predictions.
- **Key Deliverable:** A folder containing `*_predictions.csv` formatted per LTA's `Problem_Statement_3_Specifications.md`, alongside GitHub repo, hosted prototype, video pitch, and results zip.

## 4. Product Concept & Technical Architecture

### 4.1 The 3 Product Layers

1. **AI Model Layer (Ren):** Ingests sensor streams from GCP BigQuery/GCS, runs anomaly detection, supervised fault classification, and trend forecasting, surfacing feature importance and risk scores.
2. **Dashboard Layer (Thuzar & May):** Visualizes current system status, health scores, and real-time alerts for non-technical railway operators.
3. **Chatbot Layer (May):** An interactive LLM agent connected to dashboard analytical outputs to handle natural language operator queries during the live demo.

### 4.2 Ren's AI Model Architecture (Scikit-Learn + XGBoost + GCP Setup)

| Model Type | Algorithm / Stack | Use Case & Value |
|---|---|---|
| **Model 1: Anomaly Detector** | Scikit-Learn (`IsolationForest`) | Unsupervised baseline detection on unlabeled high-frequency telemetry; flags signal deviations from normal operating state. |
| **Model 2: Supervised Classifier** | XGBoost (`XGBClassifier`) | Primary workhorse model for labeled datasets; outputs fault probabilities and SHAP/feature importance rankings for root-cause analysis. |
| **Model 3: Temporal Forecaster** | XGBoost (`XGBRegressor` + Lag Features) | Rapid time-series trend regression using rolling statistics and lagged features to predict sensor drift and future threshold breaches without deep learning training overhead. |

### 4.3 Data Resilience Adapter

To counteract potential hackathon-day data schema curveballs (e.g., long vs. wide data formats, irregular time-step frequencies, missing timestamps, or multi-table relational splits), Ren's pre-built code includes:

- **Automated Schema Pivot Utility:** Automatically detects long-format telemetry and converts it to wide feature vectors.
- **Sliding-Window & Lag Generator:** Computes rolling means, rolling standard deviations, min/max ranges, and t-k temporal lag features for XGBoost inputs.
- **Universal CSV Formatter:** Decouples model output probability vectors so they can easily be mapped to LTA's required `*_predictions.csv` format on Day 1.

### 4.4 AI Code Foundations & Explanations

#### Model 1: Anomaly Detector

**Simple Explanation:** This model acts as our baseline security guard. The `data_resilience_adapter` computes rolling statistics to smooth out noisy sensor data. The `IsolationForest` then learns what "normal" railway operations look like. If it sees incoming data that strays too far from this normal baseline, it flags an anomaly risk score.

```python
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

def data_resilience_adapter(df: pd.DataFrame, feature_cols: list, window: int = 5, lags: int = 3) -> pd.DataFrame:
    df_engineered = df.copy()
    for col in feature_cols:
        df_engineered[f'{col}_roll_mean'] = df_engineered[col].rolling(window=window).mean()
        for k in range(1, lags + 1):
            df_engineered[f'{col}_lag_{k}'] = df_engineered[col].shift(k)
    return df_engineered.dropna()

def train_anomaly_detector(df: pd.DataFrame, features: list) -> pd.DataFrame:
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df[features])

    iso_forest = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    iso_forest.fit(X_scaled)

    df['anomaly_risk_score'] = iso_forest.score_samples(X_scaled) * -1
    return df
```

#### Model 2: Supervised Classifier

**Simple Explanation:** This is our workhorse model that trains on previously known (labeled) faults. The `XGBClassifier` calculates the exact probability of a fault occurring. More importantly, it uses SHAP values to explain why the fault is happening (e.g., "Fault probability is 85% because the bogie temperature is heavily elevated"), which can be sent straight to the dashboard.

```python
def train_supervised_classifier(X_train: pd.DataFrame, y_train: pd.Series, X_test: pd.DataFrame) -> tuple:
    xgb_model = xgb.XGBClassifier(objective='binary:logistic', n_estimators=150, learning_rate=0.1, max_depth=5, random_state=42, eval_metric='logloss')
    xgb_model.fit(X_train, y_train)
    fault_probabilities = xgb_model.predict_proba(X_test)[:, 1]
    feature_importance = pd.DataFrame({'Feature': X_train.columns, 'Importance': xgb_model.feature_importances_}).sort_values(by='Importance', ascending=False)
    return xgb_model, fault_probabilities, feature_importance

def generate_shap_rankings(model, X_test: pd.DataFrame):
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test)
    return explainer, shap_values
```

#### Model 3: Temporal Forecaster

**Simple Explanation:** Rather than waiting for a fault to happen, this model predicts where the telemetry is going. By shifting the data forward in time (the horizon), the `XGBRegressor` learns to forecast what a sensor's reading will be in the near future. If that future prediction crosses a safety limit, it immediately triggers an early warning breach alert.

```python
def create_forecasting_target(df: pd.DataFrame, target_col: str, horizon: int = 5) -> pd.DataFrame:
    df_forecasting = df.copy()
    df_forecasting[f'{target_col}_future_{horizon}'] = df_forecasting[target_col].shift(-horizon)
    return df_forecasting.dropna()

def train_temporal_forecaster(X_train: pd.DataFrame, y_train: pd.Series, X_test: pd.DataFrame) -> tuple:
    xgb_regressor = xgb.XGBRegressor(n_estimators=150, learning_rate=0.05, max_depth=6, random_state=42, objective='reg:squarederror')
    xgb_regressor.fit(X_train, y_train)
    return xgb_regressor, xgb_regressor.predict(X_test)

def detect_future_breaches(predicted_values: np.ndarray, upper_threshold: float) -> np.ndarray:
    return (predicted_values >= upper_threshold).astype(int)
```

### 4.5 The Unified AI Pipeline (Jupyter Architecture)

To handle multiple, unsynchronized CSV datasets on Day 1, the AI models are wrapped in a 6-block end-to-end Jupyter Notebook (`nebula-x-pipeline.ipynb`):

1. **Data Ingestion:** Loads bogie, door, and fault CSVs from a local directory.
2. **Preprocessing:** Merges asynchronous CSVs using `pd.merge_asof` to snap closest timestamps together, avoiding data leakage via temporal splitting.
3. **Model Training:** Executes Models 1, 2, and 3 in sequence.
4. **CSV Formatter:** Translates the outputs into the exact `*_predictions.csv` files needed for the final LTA submission.

## 5. Google Cloud Platform (GCP) Infrastructure

- **Data Warehouse & Ingestion:** BigQuery for high-volume time-series queries and quick AI-assisted EDA using Gemini in BigQuery; Pub/Sub for handling streaming telemetry feeds.
- **Object Storage:** Google Cloud Storage (GCS) buckets for raw telemetry CSVs, model weight artifacts, and prediction outputs.
- **Compute & Development Environment:** Vertex AI Workbench (JupyterLab inside GCP) or local VS Code using gcloud SDK / Google Colab for rapid model iterations.

## 6. Pre-Hackathon & Hackathon Day Execution Strategy

### 6.1 Pre-Hackathon Objectives (Before Sep 18)

- Build and test the pre-built Python pipeline with synthetic simulated telemetry (Isolation Forest + XGBoost Classification & Regression).
- Complete GCP pre-work labs: BigQuery Qwik Start, Explore Data with Gemini in BigQuery, Cloud Storage CLI/SDK, and Pub/Sub Python.
- Lock in local Jupyter architecture and CSV merging strategy.

### 6.2 Hackathon Day Objectives (Sep 18–19)

**5:00 PM Friday Drop (The Battle Plan):**

- **Download:** Save the LTA CSVs to the local `./lta_telemetry` folder. Check the files to identify the actual column names for timestamp, equipment ID, and fault labels.
- **Edit Block 1:** Update the `pd.read_csv` filenames to match the LTA drop.
- **Edit Block 6:** Map the newly discovered column names to the execution variables (`time_col`, `id_col`, `target_fault_col`, `target_sensor_col`).
- **Execute:** "Run All Cells" to generate the `LTA_PS3_Submission` folder locally.
- **Handoff:** Upload the outputs to the team's GCS bucket immediately so Thuzar and May can connect the UI and Chatbot layers.

- Finalize remaining video pitch and slide deck requirements.
- Submit before Saturday 19 Sep, 4:00 PM SGT.

## 7. Open Questions & TBD Status

- **Ren's Tech Stack:** ✅ Finalized (Python 3.10+, Scikit-Learn IsolationForest, XGBoost XGBClassifier & XGBRegressor, `pd.merge_asof` pipeline).
- **Dashboard Framework:** TBD (Thuzar to select framework and hosting service).
- **Chatbot Framework:** TBD (May to select drag-and-drop LLM tool/framework).
- **Dataset Domain Details:** TBD (Released on Day 1 by LTA).

## 8. Status Log

- **Updated:** September 15, 2026 — Master doc updated to V2.3. Unified end-to-end Jupyter notebook architecture locked in. Multi-CSV merging strategy (`merge_asof`) and Universal CSV Formatter added to handle LTA data curveballs. Day 1 step-by-step execution battle plan finalized.
