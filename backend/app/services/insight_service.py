from datetime import date

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.AI import openai_service
from app.AI.financial_summary import calculate_financial_summary
from app.AI.prompt_builder import build_budgeting_advice_prompt
from app.models.import_batch import ImportBatch
from app.models.insight_history import InsightHistory
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.s_insights import (
    AIAdviceResponse,
    AIChatResponse,
    FinancialSummaryResponse,
)


class ImportBatchNotFoundError(ValueError):
    pass


class NoFinancialDataError(ValueError):
    pass


def normalize_ai_advice_payload(advice_data: dict) -> dict:
    return {
        **advice_data,
        "tips": advice_data.get("tips", [])[:3],
        "next_steps": advice_data.get("next_steps", [])[:2],
    }


def get_financial_summary(
    db: Session,
    current_user: User,
    source: str | None = None,
    import_batch_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> FinancialSummaryResponse:
    query = db.query(Transaction).filter(Transaction.user_id == current_user.user_id)

    if import_batch_id is not None:
        import_batch = (
            db.query(ImportBatch)
            .filter(
                ImportBatch.import_batch_id == import_batch_id,
                ImportBatch.user_id == current_user.user_id,
            )
            .first()
        )
        if import_batch is None:
            raise ImportBatchNotFoundError("Import batch not found")

        query = query.filter(Transaction.import_batch_id == import_batch_id)

    if source and source != "all":
        query = query.filter(Transaction.source == source)

    if date_from:
        query = query.filter(Transaction.transaction_date >= date_from)

    if date_to:
        query = query.filter(Transaction.transaction_date <= date_to)

    transactions = query.order_by(
        Transaction.transaction_date.desc(),
        Transaction.created_at.desc(),
    ).all()

    return calculate_financial_summary(transactions)


def generate_ai_budgeting_advice(
    db: Session,
    current_user: User,
    source: str | None = None,
    import_batch_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> AIAdviceResponse:
    financial_summary = get_financial_summary(
        db,
        current_user,
        source=source,
        import_batch_id=import_batch_id,
        date_from=date_from,
        date_to=date_to,
    )

    if financial_summary.transaction_count == 0:
        raise NoFinancialDataError(
            "Add transactions or upload a CSV statement before generating AI advice."
        )

    summary_data = financial_summary.model_dump(mode="json")
    prompt = build_budgeting_advice_prompt(summary_data)
    advice_data = openai_service.generate_budgeting_advice(prompt)
    advice = AIAdviceResponse.model_validate(normalize_ai_advice_payload(advice_data))

    history = InsightHistory(
        user_id=current_user.user_id,
        import_batch_id=import_batch_id,
        headline=advice.headline[:255],
        priority_level=advice.priority_level,
        summary_text=advice.overall_assessment,
    )
    db.add(history)
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise

    return advice


def get_insight_history(
    db: Session,
    current_user: User,
    limit: int = 10,
) -> list[InsightHistory]:
    clamped_limit = max(1, min(limit, 50))

    return (
        db.query(InsightHistory)
        .filter(InsightHistory.user_id == current_user.user_id)
        .order_by(InsightHistory.created_at.desc(), InsightHistory.insight_id.desc())
        .limit(clamped_limit)
        .all()
    )


def generate_ai_coach_response(
    db: Session,
    current_user: User,
    message: str,
    source: str | None = None,
    import_batch_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> AIChatResponse:
    financial_summary = get_financial_summary(
        db,
        current_user,
        source=source,
        import_batch_id=import_batch_id,
        date_from=date_from,
        date_to=date_to,
    )

    if financial_summary.transaction_count == 0:
        raise NoFinancialDataError(
            "Add transactions or upload a CSV statement before using the AI coach."
        )

    summary_data = financial_summary.model_dump(mode="json")
    coach_data = openai_service.generate_financial_coach_response(summary_data, message)

    return AIChatResponse.model_validate(
        {
            **coach_data,
            "scope": "budgeting_finance",
            "used_financial_summary": True,
            "suggested_followups": coach_data.get("suggested_followups", [])[:3],
        }
    )
