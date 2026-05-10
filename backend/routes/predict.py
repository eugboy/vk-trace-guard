# from collections import deque
# from typing import Any, Deque, Dict, List

# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel

# from services.feature_engineering import (
#     build_feature_vector,
#     explain_risk_factors,
#     map_risk_level,
# )
# from services.ml_service import load_metrics, predict_sample
# from services.vk_service import extract_numeric_id, get_vk_user_profile


# router = APIRouter(tags=["prediction"])
# analysis_history: Deque[Dict] = deque(maxlen=10)


# class AnalyzeRequest(BaseModel):
#     vk_id: str


# class AnalyzeResponse(BaseModel):
#     vk_id: str
#     label: str
#     probability: float
#     risk_level: str
#     reasons: List[str]
#     features: Dict[str, float]
#     profile_info: Dict[str, Any]


# def analyze_vk_profile(vk_id: str) -> AnalyzeResponse:
#     profile = get_vk_user_profile(extract_numeric_id(vk_id))
#     features = build_feature_vector(profile)
#     label, probability = predict_sample(features)
#     risk_level = map_risk_level(probability)
#     reasons = explain_risk_factors(features, probability)

#     response = AnalyzeResponse(
#         vk_id=str(profile.get("vk_id", vk_id)),
#         label=label,
#         probability=round(probability, 4),
#         risk_level=risk_level,
#         reasons=reasons,
#         features=features,
#         profile_info={
#             "full_name": profile.get("full_name", ""),
#             "avatar_url": profile.get("avatar_url", ""),
#             "bio_text": profile.get("bio_text", ""),
#             "data_source": profile.get("data_source", "mock"),
#             "has_avatar": bool(profile.get("has_avatar", False)),
#             "bio_filled": bool(profile.get("bio_filled", False)),
#             "created_at": profile.get("created_at"),
#         },
#     )
#     analysis_history.appendleft({"vk_id": vk_id, **response.model_dump()})
#     return response


# @router.post("/predict", response_model=AnalyzeResponse)
# def predict(request: AnalyzeRequest) -> AnalyzeResponse:
#     try:
#         return analyze_vk_profile(request.vk_id)
#     except Exception as exc:  # noqa: BLE001
#         raise HTTPException(status_code=400, detail=f"Analysis failed: {exc}") from exc


# @router.get("/history")
# def history() -> List[Dict]:
#     return list(analysis_history)


# @router.get("/metrics")
# def metrics() -> Dict:
#     return load_metrics()

from collections import deque
from typing import Any, Deque, Dict, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.feature_engineering import (
    build_feature_vector,
    explain_risk_factors,
    map_risk_level,
)
from services.ml_service import load_metrics, predict_sample
from services.vk_service import get_vk_user_profile


router = APIRouter(tags=["prediction"])
analysis_history: Deque[Dict] = deque(maxlen=10)


class AnalyzeRequest(BaseModel):
    vk_id: str


class AnalyzeResponse(BaseModel):
    vk_id: str
    label: str
    probability: float
    risk_level: str
    reasons: List[str]
    features: Dict[str, float]
    profile_info: Dict[str, Any]


# -------------------------
# SAFE VK ID NORMALIZER
# -------------------------
def normalize_vk_id(vk_id: str) -> str:
    vk_id = vk_id.strip()

    if "vk.com/" in vk_id:
        vk_id = vk_id.split("vk.com/")[-1]

    if vk_id.startswith("id"):
        vk_id = vk_id.replace("id", "")

    return vk_id


def analyze_vk_profile(vk_id: str) -> AnalyzeResponse:
    clean_id = normalize_vk_id(vk_id)

    profile = get_vk_user_profile(clean_id)

    features = build_feature_vector(profile)
    label, probability = predict_sample(features)
    risk_level = map_risk_level(probability)
    reasons = explain_risk_factors(features, probability)

    response = AnalyzeResponse(
        vk_id=str(profile.get("vk_id", clean_id)),
        label=label,
        probability=round(probability, 4),
        risk_level=risk_level,
        reasons=reasons,
        features=features,
        profile_info={
            "full_name": profile.get("full_name", ""),
            "avatar_url": profile.get("avatar_url", ""),
            "bio_text": profile.get("bio_text", ""),
            "data_source": profile.get("data_source", "mock"),
            "has_avatar": bool(profile.get("has_avatar", False)),
            "bio_filled": bool(profile.get("bio_filled", False)),
            "created_at": profile.get("created_at"),
        },
    )

    analysis_history.appendleft({"vk_id": vk_id, **response.model_dump()})
    return response


@router.post("/predict", response_model=AnalyzeResponse)
def predict(request: AnalyzeRequest) -> AnalyzeResponse:
    try:
        return analyze_vk_profile(request.vk_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Analysis failed: {exc}") from exc


@router.get("/history")
def history() -> List[Dict]:
    return list(analysis_history)


@router.get("/metrics")
def metrics() -> Dict:
    return load_metrics()