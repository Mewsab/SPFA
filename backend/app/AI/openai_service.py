from __future__ import annotations

import json

from openai import OpenAI, OpenAIError
from pydantic import BaseModel, ValidationError

from app.AI.prompt_builder import build_financial_coach_prompt
from app.core.config import settings
from app.schemas.s_insights import AIAdviceResponse


class AIServiceNotConfiguredError(RuntimeError):
    pass


class AIServiceUnavailableError(RuntimeError):
    pass


class AICoachOutput(BaseModel):
    response: str
    suggested_followups: list[str]
    disclaimer: str


AI_ADVICE_JSON_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "headline": {"type": "string"},
        "overall_assessment": {"type": "string"},
        "priority_level": {"type": "string", "enum": ["healthy", "watch", "risk"]},
        "tips": {
            "type": "array",
            "maxItems": 3,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "category": {"type": "string"},
                    "impact": {"type": "string", "enum": ["high", "medium", "low"]},
                },
                "required": ["title", "description", "category", "impact"],
            },
        },
        "next_steps": {"type": "array", "maxItems": 2, "items": {"type": "string"}},
        "disclaimer": {"type": "string"},
    },
    "required": [
        "headline",
        "overall_assessment",
        "priority_level",
        "tips",
        "next_steps",
        "disclaimer",
    ],
}


AI_COACH_JSON_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "response": {"type": "string"},
        "suggested_followups": {
            "type": "array",
            "maxItems": 3,
            "items": {"type": "string"},
        },
        "disclaimer": {"type": "string"},
    },
    "required": ["response", "suggested_followups", "disclaimer"],
}


def generate_budgeting_advice(prompt: str) -> dict:
    if not settings.OPENAI_API_KEY:
        raise AIServiceNotConfiguredError("AI service is not configured.")

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        response = client.responses.create(
            model=settings.OPENAI_MODEL,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You are SPFA, a focused budgeting assistant. Return only "
                        "concise educational budgeting guidance based on the provided "
                        "summary. Keep it suitable for a dashboard card."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "budgeting_advice",
                    "strict": True,
                    "schema": AI_ADVICE_JSON_SCHEMA,
                }
            },
        )
    except OpenAIError as exc:
        raise AIServiceUnavailableError("AI service request failed.") from exc

    try:
        advice_data = json.loads(response.output_text)
        advice = AIAdviceResponse.model_validate(advice_data)
    except (json.JSONDecodeError, AttributeError, ValidationError) as exc:
        raise AIServiceUnavailableError("AI service returned an invalid response.") from exc

    return advice.model_dump()


def generate_financial_coach_response(summary: dict, user_message: str) -> dict:
    if not settings.OPENAI_API_KEY:
        raise AIServiceNotConfiguredError("AI service is not configured.")

    prompt = build_financial_coach_prompt(summary, user_message)
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        response = client.responses.create(
            model=settings.OPENAI_MODEL,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You are SPFA's AI financial coach. Stay within budgeting, "
                        "spending, savings, and personal finance analysis. Politely "
                        "redirect unrelated requests."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "financial_coach_response",
                    "strict": True,
                    "schema": AI_COACH_JSON_SCHEMA,
                }
            },
        )
    except OpenAIError as exc:
        raise AIServiceUnavailableError("AI coach request failed.") from exc

    try:
        coach_data = json.loads(response.output_text)
        coach_response = AICoachOutput.model_validate(coach_data)
    except (json.JSONDecodeError, AttributeError, ValidationError) as exc:
        raise AIServiceUnavailableError("AI coach returned an invalid response.") from exc

    return {
        **coach_response.model_dump(),
        "suggested_followups": coach_response.suggested_followups[:3],
    }
