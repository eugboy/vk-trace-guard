import json
from pathlib import Path
from typing import Dict, Tuple

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split

from services.feature_engineering import FEATURE_COLUMNS


BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "data" / "sample_vk_dataset.csv"
MODEL_PATH = BASE_DIR / "model" / "model.pkl"
METRICS_PATH = BASE_DIR / "model" / "metrics.json"

_model: RandomForestClassifier | None = None


def train_and_save_model() -> RandomForestClassifier:
    df = pd.read_csv(DATASET_PATH)
    x = df[FEATURE_COLUMNS]
    y = df["label"]

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42, stratify=y
    )
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(x_train, y_train)

    y_pred = model.predict(x_test)
    metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred)), 4),
        "recall": round(float(recall_score(y_test, y_pred)), 4),
        "f1_score": round(float(f1_score(y_test, y_pred)), 4),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "feature_importance": {
            col: round(float(imp), 4)
            for col, imp in zip(FEATURE_COLUMNS, model.feature_importances_, strict=True)
        },
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return model


def ensure_model_loaded() -> None:
    global _model
    if MODEL_PATH.exists():
        _model = joblib.load(MODEL_PATH)
        return
    _model = train_and_save_model()


def get_model() -> RandomForestClassifier:
    if _model is None:
        ensure_model_loaded()
    return _model  # type: ignore[return-value]


def predict_sample(features: Dict[str, float]) -> Tuple[str, float]:
    model = get_model()
    frame = pd.DataFrame([features], columns=FEATURE_COLUMNS)
    proba = float(model.predict_proba(frame)[0][1])
    label = "FAKE" if proba >= 0.5 else "REAL"
    return label, proba


def load_metrics() -> Dict:
    if not METRICS_PATH.exists():
        ensure_model_loaded()
    return json.loads(METRICS_PATH.read_text(encoding="utf-8"))
