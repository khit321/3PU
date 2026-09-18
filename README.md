# RailPulse — Restored Frontend

Complete Flask interface with four pages:

- Overview
- Anomaly Detection
- Fault Diagnosis
- Failure Forecast

The current values are demonstration data stored in `app.py`. Replace the `DEMO` dictionary or `/api/status` response when the model outputs are ready.

## Run

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000`.
