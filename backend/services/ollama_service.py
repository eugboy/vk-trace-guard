import json
import logging
import os
from typing import Any, Dict, List

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODEL = "llama-3.3-70b-versatile"


class OllamaError(RuntimeError):
    pass


def _api_base_url() -> str:
    return (
        os.getenv("GROQ_BASE_URL")
        or os.getenv("OLLAMA_BASE_URL")
        or GROQ_BASE_URL
    ).rstrip("/")


def _api_key() -> str:
    key = os.getenv("GROQ_API_KEY") or os.getenv("OLLAMA_API_KEY", "").strip()
    if not key:
        raise OllamaError("GROQ_API_KEY не задан. Добавьте ключ в backend/.env")
    return key


_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=_api_key(),
            base_url=_api_base_url(),
        )
    return _client


def _build_user_prompt(
    vk_id: str,
    profile: Dict[str, Any],
    features: Dict[str, float],
    label: str,
    probability: float,
    risk_level: str,
    reasons: List[str],
) -> str:
    bio = (profile.get("bio_text") or "").strip() or "не указано"
    reasons_text = ", ".join(reasons) if reasons else "нет"

    return f"""
Ты — ведущий OSINT-аналитик. Оцени VK-аккаунт на признаки фейка или бота.

ID пользователя: {vk_id}

Доступные данные (только это, ничего не додумывай):
- Подписчики: {features.get("followers_count", 0)}
- Друзья: {features.get("friends_count", 0)}
- Посты: {features.get("posts_count", 0)}
- Группы: {features.get("groups_count", 0)}
- Есть аватар: {"да" if profile.get("has_avatar") else "нет"}
- Заполнено био: {"да" if profile.get("bio_filled") else "нет"}
- Соотношение подписчики/друзья: {features.get("followers_friends_ratio", 0):.2f}
- Текст био: {bio}

Результат ML-модели:
- Метка: {label}
- Вероятность фейка: {probability * 100:.1f}%
- Уровень риска: {risk_level}
- Факторы риска: {reasons_text}

Запрещено упоминать: возраст аккаунта, дату регистрации, «существует N дней» и любые факты, которых нет в списке выше.

Отвечай СТРОГО в формате валидного JSON. Не используй markdown.
{{
  "verdict": "Краткий вердикт (1-2 предложения)",
  "suspicious_signals": ["Подозрительный признак 1", "Подозрительный признак 2"],
  "additional_checks": ["Что проверить дополнительно 1", "Что проверить 2"],
  "confidence": "high | medium | low",
  "summary": "Итоговое досье только по доступным данным"
}}
"""


def _format_analysis(data: Dict[str, Any]) -> str:
    lines: List[str] = []

    verdict = data.get("verdict")
    if verdict:
        lines.append(f"Вердикт: {verdict}")

    signals = data.get("suspicious_signals") or []
    if isinstance(signals, list) and signals:
        lines.append("\nПодозрительные признаки:")
        for item in signals:
            lines.append(f"• {item}")

    checks = data.get("additional_checks") or []
    if isinstance(checks, list) and checks:
        lines.append("\nЧто проверить дополнительно:")
        for item in checks:
            lines.append(f"• {item}")

    confidence = data.get("confidence")
    if confidence:
        lines.append(f"\nУверенность анализа: {confidence}")

    summary = data.get("summary")
    if summary:
        lines.append(f"\nРезюме: {summary}")

    return "\n".join(lines).strip() or "Нейросеть вернула пустой анализ"


async def get_ai_analysis(
    vk_id: str,
    profile: Dict[str, Any],
    features: Dict[str, float],
    label: str,
    probability: float,
    risk_level: str,
    reasons: List[str],
) -> str:
    logger.info("Отправка данных в Groq AI (VK ID: %s)...", vk_id)

    try:
        response = await _get_client().chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional OSINT expert for VK accounts. "
                        "Return strictly JSON in Russian."
                    ),
                },
                {
                    "role": "user",
                    "content": _build_user_prompt(
                        vk_id, profile, features, label, probability, risk_level, reasons
                    ),
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
    except OllamaError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise OllamaError(
            f"Не удалось получить ответ от нейросети ({_api_base_url()}): {exc}"
        ) from exc

    content = (response.choices[0].message.content or "").strip()
    if not content:
        raise OllamaError("Нейросеть вернула пустой ответ")

    try:
        return _format_analysis(json.loads(content))
    except json.JSONDecodeError:
        logger.warning("Нейросеть вернула не-JSON, возвращаем сырой текст")
        return content


async def analyze_profile(
    vk_id: str,
    profile: Dict[str, Any],
    features: Dict[str, float],
    label: str,
    probability: float,
    risk_level: str,
    reasons: List[str],
) -> str:
    return await get_ai_analysis(
        vk_id, profile, features, label, probability, risk_level, reasons
    )
