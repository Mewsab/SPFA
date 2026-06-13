from __future__ import annotations

import json
from decimal import Decimal


def _to_plain_value(value):
    if isinstance(value, Decimal):
        return str(value)

    if isinstance(value, list):
        return [_to_plain_value(item) for item in value]

    if isinstance(value, dict):
        return {key: _to_plain_value(item) for key, item in value.items()}

    return value


def _compact_category_amount(item: dict) -> dict:
    return {
        "category": item.get("category"),
        "label": item.get("label"),
        "amount": item.get("amount"),
        "percentage": item.get("percentage"),
    }


def _compact_budget_suggestion(item: dict) -> dict:
    return {
        "category": item.get("category"),
        "label": item.get("label"),
        "current_spending": item.get("current_spending"),
        "suggested_budget": item.get("suggested_budget"),
        "potential_savings": item.get("potential_savings"),
        "risk_level": item.get("risk_level"),
        "reason": item.get("reason"),
    }


def _compact_financial_summary(financial_summary: dict) -> dict:
    top_category = financial_summary.get("top_spending_category")
    return {
        "total_income": financial_summary.get("total_income"),
        "total_expense": financial_summary.get("total_expense"),
        "balance": financial_summary.get("balance"),
        "transaction_count": financial_summary.get("transaction_count"),
        "income_transaction_count": financial_summary.get("income_transaction_count"),
        "expense_transaction_count": financial_summary.get("expense_transaction_count"),
        "savings_rate_percentage": financial_summary.get("savings_rate_percentage"),
        "expense_ratio_percentage": financial_summary.get("expense_ratio_percentage"),
        "financial_health_status": financial_summary.get("financial_health_status"),
        "financial_health_message": financial_summary.get("financial_health_message"),
        "top_spending_category": (
            _compact_category_amount(top_category) if top_category else None
        ),
        "spending_by_category": [
            _compact_category_amount(item)
            for item in financial_summary.get("spending_by_category", [])
        ],
        "budget_suggestions": [
            _compact_budget_suggestion(item)
            for item in financial_summary.get("budget_suggestions", [])
        ],
        "source_breakdown": financial_summary.get("source_breakdown"),
    }


def build_budgeting_advice_prompt(financial_summary: dict) -> str:
    compact_summary = _compact_financial_summary(financial_summary)
    summary_json = json.dumps(_to_plain_value(compact_summary), separators=(",", ":"))

    return (
        "You are SPFA, an AI budgeting assistant. Use only the following compact "
        "financial summary to generate practical, student-friendly budgeting advice. "
        "Keep advice concise and suitable for a dashboard card. Use one short "
        "headline, one overall assessment with no more than 2 sentences, no more "
        "than 3 tips, and no more than 2 next steps. Each tip description must be "
        "1 sentence. Avoid repeating the same idea, focus on the highest-impact "
        "categories only, and do not include long explanations. "
        "Discuss only budgeting, spending, savings, and personal finance analysis. "
        "Do not invent bank data, raw transactions, CSV rows, passwords, tokens, tax, "
        "legal, investment, or professional financial advice. Keep uncertainty clear "
        "when the summary is limited.\n\n"
        f"Financial summary JSON:\n{summary_json}"
    )


def build_financial_coach_prompt(financial_summary: dict, user_message: str) -> str:
    compact_summary = _compact_financial_summary(financial_summary)
    summary_json = json.dumps(_to_plain_value(compact_summary), separators=(",", ":"))

    return (
        "You are SPFA's AI financial coach. Answer the user's question using only "
        "the compact financial summary below. You may answer questions about "
        "budgeting, spending, saving, and personal finance analysis. If the user "
        "asks about coding, politics, entertainment, medical advice, legal advice, "
        "tax advice, investment picks, or any unrelated topic, politely redirect "
        "them to budgeting and finance questions. Do not invent missing bank data, "
        "merchant details, raw transactions, CSV rows, passwords, tokens, or auth "
        "data. Keep the response concise: use 3 to 6 short bullet points or 1 to "
        "3 short paragraphs. Do not provide investment, tax, legal, or professional "
        "financial advice. Include the disclaimer wording in the structured response.\n\n"
        f"Financial summary JSON:\n{summary_json}\n\n"
        f"User question:\n{user_message}"
    )
