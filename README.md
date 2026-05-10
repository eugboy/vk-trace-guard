# TraceGuard VK

AI-powered VK digital footprint analysis system for fake account detection.

## Stack

- Backend: FastAPI + scikit-learn
- Frontend: Angular + PrimeNG + Chart.js
- ML model: RandomForestClassifier

## Project structure

- `backend/` - API, VK integration, feature engineering, ML model pipeline
- `frontend/` - Angular dashboard and analyzers

## Run backend

1. `cd backend`
2. `python -m venv .venv`
3. Windows: `.venv\Scripts\activate`
4. `pip install -r requirements.txt`
5. Optional VK token: copy `.env.example` to `.env` and set `VK_TOKEN`
6. `uvicorn main:app --reload`

Backend runs at `http://127.0.0.1:8000`.

## Run frontend

1. `cd frontend`
2. `npm install`
3. `npm run start`

Frontend runs at `http://127.0.0.1:4200`.

## Key endpoints

- `POST /predict` with `{ "vk_id": "id1" }`
- `POST /analyze-followers` with `{ "vk_id": "id1", "limit": 20 }`
- `POST /analyze-community` with `{ "group_id": "public1", "limit": 20 }`
- `GET /history` (last 10 analyses)
- `GET /metrics` (model metrics + feature importance)

## Notes

- If VK API data is unavailable, backend automatically uses mock fallback profile data.
- Model is trained from `backend/data/sample_vk_dataset.csv` and persisted to `backend/model/model.pkl`.
