import logging
from collections import deque
from typing import Any, Deque, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.feature_engineering import (
    build_feature_vector,
    explain_risk_factors,
    map_risk_level,
)
from services.ml_service import (
    VALID_VERDICTS,
    add_feedback_sample,
    load_feedback_stats,
    load_metrics,
    predict_sample,
)
from services.ollama_service import OllamaError, analyze_profile as ollama_analyze_profile
from services.vk_service import VkApiError, get_vk_user_profile

logger = logging.getLogger(__name__)

router = APIRouter(tags=["prediction"])
analysis_history: Deque[Dict] = deque(maxlen=10)


class AnalyzeRequest(BaseModel):
    vk_id: str


class FeedbackRequest(BaseModel):
    vk_id: str
    features: Dict[str, float]
    predicted_label: str
    verdict: str


class FeedbackResponse(BaseModel):
    message: str
    true_label: str
    metrics: Dict[str, Any]


class AnalyzeResponse(BaseModel):
    vk_id: str
    label: str
    probability: float
    risk_level: str
    reasons: List[str]
    features: Dict[str, float]
    profile_info: Dict[str, Any]
    ollama_analysis: Optional[str] = None
    ollama_error: Optional[str] = None


def normalize_vk_id(vk_id: str) -> str:
    vk_id = vk_id.strip()

    if "vk.com/" in vk_id:
        vk_id = vk_id.split("vk.com/")[-1]

    vk_id = vk_id.strip("/")

    if vk_id.startswith("id"):
        vk_id = vk_id[2:]

    return vk_id


def build_profile_info(profile: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "full_name": profile.get("full_name", ""),
        "avatar_url": profile.get("avatar_url", ""),
        "bio_text": profile.get("bio_text", ""),
        "data_source": profile.get("data_source", "vk_api"),
        "has_avatar": bool(profile.get("has_avatar", False)),
        "bio_filled": bool(profile.get("bio_filled", False)),
    }


async def analyze_profile(vk_id: str) -> AnalyzeResponse:
    clean_id = normalize_vk_id(vk_id)
    profile = get_vk_user_profile(clean_id)
    features = build_feature_vector(profile)
    label, probability = predict_sample(features)
    risk_level = map_risk_level(probability)
    reasons = explain_risk_factors(features, probability)

    ollama_analysis: Optional[str] = None
    ollama_error: Optional[str] = None

    try:
        ollama_analysis = await ollama_analyze_profile(
            vk_id=str(profile.get("vk_id", clean_id)),
            profile=profile,
            features=features,
            label=label,
            probability=probability,
            risk_level=risk_level,
            reasons=reasons,
        )
    except OllamaError as exc:
        ollama_error = str(exc)
        logger.warning("Ollama analysis failed: %s", exc)

    response = AnalyzeResponse(
        vk_id=str(profile.get("vk_id", clean_id)),
        label=label,
        probability=round(probability, 4),
        risk_level=risk_level,
        reasons=reasons,
        features=features,
        profile_info=build_profile_info(profile),
        ollama_analysis=ollama_analysis,
        ollama_error=ollama_error,
    )

    analysis_history.appendleft({"vk_id": vk_id, **response.model_dump()})
    return response


@router.post("/predict", response_model=AnalyzeResponse)
async def predict(request: AnalyzeRequest) -> AnalyzeResponse:
    try:
        return await analyze_profile(request.vk_id)
    except VkApiError as exc:
        raise HTTPException(status_code=400, detail=exc.error_msg) from exc
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/history")
def history() -> List[Dict]:
    return list(analysis_history)


@router.get("/metrics")
def metrics() -> Dict:
    return load_metrics()


def _true_label_from_verdict(predicted_label: str, verdict: str) -> str:
    predicted = predicted_label.upper()
    if predicted not in {"REAL", "FAKE"}:
        raise HTTPException(status_code=400, detail="Некорректная метка предсказания")

    verdict_key = verdict.lower()
    if verdict_key not in VALID_VERDICTS:
        raise HTTPException(
            status_code=400,
            detail=f"verdict должен быть: {', '.join(sorted(VALID_VERDICTS))}",
        )

    if verdict_key == "correct":
        return predicted
    if verdict_key == "incorrect_real":
        return "REAL"
    return "FAKE"


@router.get("/feedback/stats")
def feedback_stats() -> Dict[str, Any]:
    return load_feedback_stats()


@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(request: FeedbackRequest) -> FeedbackResponse:
    try:
        true_label = _true_label_from_verdict(
            request.predicted_label,
            request.verdict,
        )
        metrics = add_feedback_sample(
            vk_id=normalize_vk_id(request.vk_id),
            features=request.features,
            true_label=true_label,
            predicted_label=request.predicted_label,
            verdict=request.verdict,
        )
        return FeedbackResponse(
            message="Разметка сохранена, модель переобучена",
            true_label=true_label,
            metrics=metrics,
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc
