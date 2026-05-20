import logging
import os
from typing import Any, Dict

import requests

VK_API_URL = "https://api.vk.com/method"
VK_API_VERSION = "5.199"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("vk-service")

session = requests.Session()


class VkApiError(RuntimeError):
    def __init__(self, error: Dict[str, Any]) -> None:
        self.error_code = error.get("error_code")
        self.error_msg = error.get("error_msg") or "Неизвестная ошибка VK API"
        super().__init__(self.error_msg)


def get_vk_token() -> str:
    token = os.getenv("VK_TOKEN", "").strip()
    if not token:
        raise RuntimeError("VK_TOKEN не задан. Добавьте токен в backend/.env")
    return token


def vk_call(method: str, params: Dict) -> Any:
    url = f"{VK_API_URL}/{method}"
    payload = {
        "access_token": get_vk_token(),
        "v": VK_API_VERSION,
        **params,
    }

    try:
        response = session.get(url, params=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        raise RuntimeError(f"Не удалось выполнить запрос к VK API: {exc}") from exc

    if "error" in data:
        raise VkApiError(data["error"])

    if "response" not in data:
        raise RuntimeError("VK API вернул неожиданный ответ")

    return data["response"]


def get_vk_user_profile(user_id: str) -> Dict[str, Any]:
    users = vk_call(
        "users.get",
        {
            "user_ids": user_id,
            "fields": "photo_200,about,followers_count",
        },
    )
    if not isinstance(users, list) or not users:
        raise RuntimeError("Пользователь не найден")

    user = users[0]
    numeric_id = user["id"]

    friends = vk_call("friends.get", {"user_id": numeric_id})
    groups = vk_call("groups.get", {"user_id": numeric_id})
    wall = vk_call("wall.get", {"owner_id": numeric_id, "count": 1})

    friends_count = friends.get("count", 0) if isinstance(friends, dict) else 0
    groups_count = groups.get("count", 0) if isinstance(groups, dict) else 0
    posts_count = wall.get("count", 0) if isinstance(wall, dict) else 0

    return {
        "vk_id": str(user.get("id")),
        "full_name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
        "friends_count": friends_count,
        "groups_count": groups_count,
        "posts_count": posts_count,
        "followers_count": user.get("followers_count", 0),
        "has_avatar": bool(user.get("photo_200")),
        "bio_filled": bool(user.get("about")),
        "avatar_url": user.get("photo_200", ""),
        "bio_text": user.get("about", ""),
        "data_source": "vk_api",
    }
