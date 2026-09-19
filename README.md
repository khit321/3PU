# RailPulse - Predictive Train Condition Monitoring

RailPulse is a railway condition-monitoring application developed for **Nebula X Hackathon 2026, Problem Statement 3: Predictive Fault Detection**. It processes telemetry from four train subsystems and presents actionable maintenance information through a web dashboard and an optional AI assistant.

## Features

- Door fault detection from motor-current and command telemetry
- Air-conditioning and ventilation (ACV) car ranking
- Rail-corrugation classification using XGBoost
- Structural health monitoring (SHM) risk prediction
- Unified, severity-ranked alert feed
- Batch export of competition-ready prediction CSV files
- Live LTA DataMall integration when credentials are configured
- Optional grounded chatbot using Vertex AI Gemini, Gemini API, or OpenAI
- Docker configuration for deployment to Google Cloud Run

## Architecture

```text
Telemetry files
      |
      v
Subsystem diagnostics
(Door / ACV / Rail / SHM)
      |
      v
FastAPI backend  <---->  LTA DataMall / AI provider
      |
      v
Flask dashboard
```

The dashboard does not run prediction models directly. It sends telemetry to the FastAPI backend, which owns the diagnostic models, alert history, submission exports, external-data integration, and chatbot tools.

## Project Structure

```text
.
|-- app/                         FastAPI backend
|   |-- main.py                  Application entry point
|   |-- config.py                Environment-based configuration
|   |-- routers/                 API endpoints
|   |-- services/                Diagnostics, alerts, LTA client, and CSV export
|   |-- chatbot/                 Grounded chatbot implementation
|   `-- models/                  API data schemas
|-- data/                        Model artifacts and representative samples
|-- hackathon/hackathon/         Flask dashboard
|-- scripts/                     Local utility scripts
|-- tests/                       Test directory
|-- Dockerfile                   Cloud Run backend image
|-- requirements.txt             Backend Python dependencies
`-- .env.example                 Safe configuration template
```

## Requirements

- Python 3.11 recommended
- `pip`
- Google Cloud CLI for Cloud Run deployment
- LTA DataMall key only if live LTA data is required
- Google Cloud/AI credentials only if the chatbot is enabled

## Run Locally

### 1. Start the FastAPI backend

From this directory:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --host 127.0.0.1 --port 8080
```

The backend will be available at:

- API: `http://127.0.0.1:8080`
- Interactive API documentation: `http://127.0.0.1:8080/docs`
- Health check: `http://127.0.0.1:8080/healthz`

The prediction endpoints work without LTA or chatbot credentials. Add credentials to `.env` only for the optional integrations you intend to demonstrate.

### 2. Start the dashboard

Open a second terminal:

```powershell
cd hackathon\hackathon
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:BACKEND_BASE_URL = "http://127.0.0.1:8080"
python app.py
```

Open `http://127.0.0.1:5000` in a browser.

## Configuration

Copy `.env.example` to `.env`. Never commit the completed `.env` file or any credentials.

| Variable | Purpose | Default |
|---|---|---|
| `DOOR_MODE` | `rule` or `model` | `rule` |
| `ACV_MODE` | `rule` or `model` | `rule` |
| `RAIL_CORRUGATION_MODE` | Rail diagnostic mode | `model` |
| `SHM_MODE` | SHM diagnostic mode | `model` |
| `LTA_ACCOUNT_KEY` | LTA DataMall authentication | Empty |
| `LLM_PROVIDER` | `vertex`, `gemini_api_key`, or `openai` | `vertex` |
| `GCP_PROJECT` | Google Cloud project ID | Empty |
| `GCP_LOCATION` | Vertex AI region | `asia-southeast1` |
| `ALLOWED_ORIGINS` | Allowed dashboard origins | `*` |

When LTA credentials or connectivity are unavailable, the dashboard remains operational and reports the LTA integration as unavailable.

## Main API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/healthz` | Service health check |
| `GET` | `/api/predictions/modes` | Active diagnostic mode for each subsystem |
| `POST` | `/api/predictions/{subsystem}` | Analyze one telemetry file |
| `GET` | `/api/alerts` | Return the unified alert feed |
| `GET` | `/api/dashboard/summary` | Return dashboard summary data |
| `POST` | `/api/chat` | Ask the grounded AI assistant a question |
| `POST` | `/api/submission/door` | Export Door prediction CSV |
| `POST` | `/api/submission/acv` | Export ACV prediction CSV |
| `POST` | `/api/submission/rail_corrugation` | Export Rail prediction CSV |
| `POST` | `/api/submission/shm` | Export SHM prediction CSV |

Supported subsystem names for the general prediction endpoint are `door`, `acv`, `rail_corrugation`, and `shm`.

## Producing Prediction Files

Use the dashboard export controls or the `/api/submission/*` endpoints to process the held-out test files. The backend returns one CSV for each attempted subsystem:

```text
door_predictions.csv
acv_predictions.csv
rail_predictions.csv
shm_predictions.csv
```

Before submission, verify every filename, column name, timestamp format, and prediction value against the official subsystem specification. Place only the required `*_predictions.csv` files directly inside `predictions.zip`.

## Deploy the Backend to Google Cloud Run

Authenticate with Google Cloud and select the hackathon project:

```powershell
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

Deploy from this directory:

```powershell
gcloud run deploy nebula-x-backend `
  --source . `
  --region asia-southeast1 `
  --allow-unauthenticated `
  --set-env-vars "LLM_PROVIDER=vertex,GCP_PROJECT=YOUR_PROJECT_ID,GCP_LOCATION=asia-southeast1,ALLOWED_ORIGINS=*"
```

Do not place secrets directly in source code or commit them to Git. Use Cloud Run environment variables or Google Secret Manager for sensitive values such as `LTA_ACCOUNT_KEY`.

The included Dockerfile deploys the FastAPI backend. The Flask dashboard can be deployed as a second Cloud Run service with `BACKEND_BASE_URL` set to the backend service URL.

## Verification Status

The following checks were completed in a clean Python environment:

- Backend dependencies installed successfully from `requirements.txt`
- FastAPI application imported and started successfully
- Root and health endpoints returned HTTP 200
- Dashboard summary remained available without LTA credentials
- All Flask dashboard pages rendered successfully
- Dashboard connected successfully to the running backend
- Door, ACV, Rail Corrugation, and SHM sample exports returned HTTP 200 and valid CSV responses

The saved scikit-learn artifacts were created with version 1.3.2 while the application uses 1.5.1. This produces a compatibility warning during startup, but the supplied sample models completed the verified prediction tests successfully.

## Security Notes

- Never commit `.env`, API keys, service-account files, or passwords.
- Use `.env.example` only as a template.
- Validate uploaded files before using the service outside the hackathon environment.
- Replace permissive CORS (`ALLOWED_ORIGINS=*`) with the deployed dashboard URL for production use.

## Team

Developed for Nebula X Hackathon 2026 by Ren, May, and Thuzar.
