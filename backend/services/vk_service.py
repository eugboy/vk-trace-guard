import os
import time
import json
import logging
from typing import Dict, List, Any, Optional

import requests


VK_API_URL = "https://api.vk.com/method"
VK_API_VERSION = "5.199"


def get_vk_token() -> str:
    token = os.getenv("VK_TOKEN")
    if not token:
        raise RuntimeError("VK_TOKEN is missing")
    print("VK TOKEN:", token)
    return token


# =========================
# LOGGER SETUP
# =========================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger("vk-service")


# =========================
# HTTP SESSION (faster + reuse connections)
# =========================

session = requests.Session()


# =========================
# CORE VK CALL
# =========================

def vk_call(method: str, params: Dict) -> Dict:
    url = f"{VK_API_URL}/{method}"

    payload = {
        "access_token": get_vk_token(),
        "v": VK_API_VERSION,
        **params
    }

    response = requests.get(url, params=payload, timeout=10)

    print("\n===== VK REQUEST =====")
    print("URL:", response.url)
    print("STATUS:", response.status_code)
    print("RESPONSE TEXT:", response.text)

    data = response.json()

    if "error" in data:
        print("VK ERROR:", data["error"])
        raise RuntimeError(f"VK error: {data['error']}")

    return data.get("response", {})


# =========================
# USER PROFILE
# =========================

def get_vk_user_profile(user_id: str) -> Dict[str, Any]:
    try:
        users = vk_call(
            "users.get",
            {
                "user_ids": user_id,
                "fields": "photo_200,about,followers_count"
            }
        )

        user = users[0]

        friends = vk_call("friends.get", {"user_id": user["id"]})
        groups = vk_call("groups.get", {"user_id": user["id"]})
        wall = vk_call("wall.get", {"owner_id": user["id"], "count": 1})

        return {
            "vk_id": str(user.get("id")),
            "full_name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
            "friends_count": friends.get("count", 0),
            "groups_count": groups.get("count", 0),
            "posts_count": wall.get("count", 0),
            "followers_count": user.get("followers_count", 0),
            "has_avatar": bool(user.get("photo_200")),
            "bio_filled": bool(user.get("about")),
            "avatar_url": user.get("photo_200", ""),
            "bio_text": user.get("about", ""),
            "data_source": "vk_api",
        }

    except Exception as e:
        logger.error(f"PROFILE ERROR: {e}")
        raise


# =========================
# FRIENDS / FOLLOWERS
# =========================

def get_user_friends(user_id: str, limit: int = 20) -> List[str]:
    data = vk_call("friends.get", {
        "user_id": user_id,
        "count": limit
    })

    return [str(x) for x in data.get("items", [])][:limit]


# =========================
# GROUP MEMBERS
# =========================

def get_group_members(group_id: str, limit: int = 20) -> List[str]:
    group_id = group_id.replace("https://vk.com/", "").replace("public", "")

    data = vk_call("groups.getMembers", {
        "group_id": group_id,
        "count": limit
    })

    return [str(x) for x in data.get("items", [])][:limit]


# =========================
# SIMPLE HEALTHCHECK
# =========================

def vk_healthcheck() -> bool:
    try:
        vk_call("users.get", {"user_ids": "1"})
        logger.info("VK HEALTHCHECK OK")
        return True
    except Exception as e:
        logger.error(f"VK HEALTHCHECK FAILED: {e}")
        return False