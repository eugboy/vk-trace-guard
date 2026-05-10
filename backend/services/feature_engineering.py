from datetime import datetime
from typing import Dict


FEATURE_COLUMNS = [
    "followers_count",
    "friends_count",
    "posts_count",
    "groups_count",
    "account_age_days",
    "has_avatar",
    "bio_filled",
    "followers_friends_ratio",
]


def build_feature_vector(profile: Dict) -> Dict[str, float]:
    followers_count = float(profile.get("followers_count", 0))
    friends_count = float(profile.get("friends_count", 0))
    posts_count = float(profile.get("posts_count", 0))
    groups_count = float(profile.get("groups_count", 0))
    created_at = profile.get("created_at")
    account_age_days = 365.0
    if created_at:
        delta = datetime.utcnow() - datetime.fromisoformat(created_at)
        account_age_days = max(1.0, float(delta.days))

    has_avatar = 1.0 if profile.get("has_avatar") else 0.0
    bio_filled = 1.0 if profile.get("bio_filled") else 0.0
    followers_friends_ratio = followers_count / max(friends_count, 1.0)

    return {
        "followers_count": followers_count,
        "friends_count": friends_count,
        "posts_count": posts_count,
        "groups_count": groups_count,
        "account_age_days": account_age_days,
        "has_avatar": has_avatar,
        "bio_filled": bio_filled,
        "followers_friends_ratio": followers_friends_ratio,
    }


def map_risk_level(probability: float) -> str:
    if probability >= 0.75:
        return "HIGH"
    if probability >= 0.45:
        return "MEDIUM"
    return "LOW"


def explain_risk_factors(features: Dict[str, float], probability: float) -> list[str]:
    reasons: list[str] = []
    if features["friends_count"] < 30:
        reasons.append("Low friends count")
    if features["has_avatar"] == 0:
        reasons.append("No profile avatar")
    if features["account_age_days"] < 120:
        reasons.append("New account")
    if features["posts_count"] < 5:
        reasons.append("Very low posting activity")
    if features["followers_friends_ratio"] > 10:
        reasons.append("Unusual followers/friends ratio")
    if probability > 0.8 and not reasons:
        reasons.append("Combined ML risk signals")
    return reasons
