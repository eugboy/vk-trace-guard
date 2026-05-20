# TraceGuard VK

AI-powered VK digital footprint analysis system for fake account detection.

## Stack

- Backend: FastAPI + scikit-learn
- Frontend: Angular + PrimeNG + Chart.js
- ML model: RandomForestClassifier

## Project structure

- `backend/` - API, VK integration, feature engineering, ML model pipeline
- `frontend/` - Angular dashboard and user analyzer

## Run backend

1. `cd backend`
2. `python -m venv .venv`
3. Windows: `.venv\Scripts\activate`
4. `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and set `VK_TOKEN` (required)
6. Set `GROQ_API_KEY` in `.env` ([Groq Console](https://console.groq.com/))
7. `uvicorn main:app --reload`

Backend runs at `http://127.0.0.1:8000`.

## Run frontend

1. `cd frontend`
2. `npm install`
3. `npm run start`

Frontend runs at `http://127.0.0.1:4200`.

## Key endpoints

- `POST /predict` with `{ "vk_id": "id1" }`
- `POST /feedback` — user label for retraining (`verdict`: `correct`, `incorrect_real`, `incorrect_fake`)
- `GET /feedback/stats` — statistics from `backend/data/user_feedback.csv`
- `GET /history` (last 10 analyses)
- `GET /metrics` (model metrics + feature importance)

## Notes

- All profile data is loaded from VK API. On error, the API returns the VK error message text.
- AI analysis (блок «Ollama» в UI) идёт через Groq OpenAI-compatible API (`https://api.groq.com/openai/v1`). В `.env` нужен только `GROQ_API_KEY` (также читается `OLLAMA_API_KEY` для совместимости). Модель зашита в коде, настраивать не нужно. Если API недоступен, ML-результат всё равно возвращается.
- Model is trained from `backend/data/sample_vk_dataset.csv` plus user feedback in `backend/data/user_feedback.csv`, then persisted to `backend/model/model.pkl`.
