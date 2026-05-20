import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Tuple

VALID_VERDICTS = frozenset({"correct", "incorrect_real", "incorrect_fake"})

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
FEEDBACK_PATH = BASE_DIR / "data" / "user_feedback.csv"
MODEL_PATH = BASE_DIR / "model" / "model.pkl"
METRICS_PATH = BASE_DIR / "model" / "metrics.json"

FEEDBACK_COLUMNS = [
    *FEATURE_COLUMNS,
    "label",
    "vk_id",
    "predicted_label",
    "verdict",
    "true_label",
    "submitted_at",
]

_model: RandomForestClassifier | None = None


def _label_to_int(label: str) -> int:
    return 1 if label.upper() == "FAKE" else 0


def _load_training_data() -> pd.DataFrame:
    base = pd.read_csv(DATASET_PATH)
    if not FEEDBACK_PATH.exists():
        return base

    feedback = pd.read_csv(FEEDBACK_PATH)
    if feedback.empty:
        return base

    feedback_features = feedback[FEATURE_COLUMNS + ["label"]]
    return pd.concat([base, feedback_features], ignore_index=True)


def train_and_save_model() -> RandomForestClassifier:
    df = _load_training_data()
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
        "training_samples": int(len(df)),
        "feedback_samples": int(len(pd.read_csv(FEEDBACK_PATH))) if FEEDBACK_PATH.exists() else 0,
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


def _ensure_feedback_file() -> None:
    FEEDBACK_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not FEEDBACK_PATH.exists():
        pd.DataFrame(columns=FEEDBACK_COLUMNS).to_csv(FEEDBACK_PATH, index=False)


def _migrate_feedback_columns(feedback: pd.DataFrame) -> pd.DataFrame:
    for column in FEEDBACK_COLUMNS:
        if column not in feedback.columns:
            feedback[column] = pd.NA
    return feedback[FEEDBACK_COLUMNS]


def load_feedback_stats() -> Dict[str, Any]:
    _ensure_feedback_file()
    feedback = pd.read_csv(FEEDBACK_PATH)
    if feedback.empty:
        return {
            "total": 0,
            "correct": 0,
            "incorrect_real": 0,
            "incorrect_fake": 0,
            "labels_real": 0,
            "labels_fake": 0,
            "accuracy_percent": 0.0,
        }

    feedback = _migrate_feedback_columns(feedback)
    total = int(len(feedback))
    correct = int((feedback["verdict"] == "correct").sum())
    incorrect_real = int((feedback["verdict"] == "incorrect_real").sum())
    incorrect_fake = int((feedback["verdict"] == "incorrect_fake").sum())
    labels_real = int((feedback["label"] == 0).sum())
    labels_fake = int((feedback["label"] == 1).sum())
    known_verdicts = correct + incorrect_real + incorrect_fake
    accuracy_percent = round(correct / known_verdicts * 100, 1) if known_verdicts else 0.0

    return {
        "total": total,
        "correct": correct,
        "incorrect_real": incorrect_real,
        "incorrect_fake": incorrect_fake,
        "labels_real": labels_real,
        "labels_fake": labels_fake,
        "accuracy_percent": accuracy_percent,
    }


def add_feedback_sample(
    vk_id: str,
    features: Dict[str, float],
    true_label: str,
    predicted_label: str,
    verdict: str,
) -> Dict:
    global _model

    verdict_key = verdict.lower()
    if verdict_key not in VALID_VERDICTS:
        raise ValueError(
            f"verdict должен быть одним из: {', '.join(sorted(VALID_VERDICTS))}"
        )

    _ensure_feedback_file()
    feedback = pd.read_csv(FEEDBACK_PATH)
    feedback = _migrate_feedback_columns(feedback)
    if str(vk_id) in feedback["vk_id"].astype(str).values:
        feedback = feedback[feedback["vk_id"].astype(str) != str(vk_id)]

    row = {
        **{col: float(features[col]) for col in FEATURE_COLUMNS},
        "label": _label_to_int(true_label),
        "vk_id": str(vk_id),
        "predicted_label": predicted_label.upper(),
        "verdict": verdict_key,
        "true_label": true_label.upper(),
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
    feedback = pd.concat([feedback, pd.DataFrame([row])], ignore_index=True)
    feedback.to_csv(FEEDBACK_PATH, index=False)

    _model = train_and_save_model()
    return load_metrics()
