from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.s_insights import (
    AIAdviceRequest,
    AIAdviceResponse,
    AIChatRequest,
    AIChatResponse,
    FinancialSummaryResponse,
    InsightHistoryResponse,
    TransactionSourceFilter,
)
from app.AI.openai_service import (
    AIServiceNotConfiguredError,
    AIServiceUnavailableError,
)
from app.services.insight_service import (
    ImportBatchNotFoundError,
    NoFinancialDataError,
    generate_ai_coach_response,
    generate_ai_budgeting_advice,
    get_financial_summary,
    get_insight_history,
)


router = APIRouter(prefix="/insights", tags=["AI Budgeting Insights"])


@router.get("/history", response_model=list[InsightHistoryResponse])
def get_insight_history_endpoint(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_insight_history(db, current_user, limit=limit)


@router.get("/financial-summary", response_model=FinancialSummaryResponse)
def get_financial_summary_endpoint(
    source: TransactionSourceFilter | None = None,
    import_batch_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_financial_summary(
            db,
            current_user,
            source=source,
            import_batch_id=import_batch_id,
            date_from=date_from,
            date_to=date_to,
        )
    except ImportBatchNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Import batch not found",
        ) from exc


@router.post("/generate-advice", response_model=AIAdviceResponse)
def generate_ai_budgeting_advice_endpoint(
    request: AIAdviceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return generate_ai_budgeting_advice(
            db,
            current_user,
            source=request.source,
            import_batch_id=request.import_batch_id,
            date_from=request.date_from,
            date_to=request.date_to,
        )
    except ImportBatchNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Import batch not found",
        ) from exc
    except NoFinancialDataError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Add transactions or upload a CSV statement before generating AI advice.",
        ) from exc
    except AIServiceNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured.",
        ) from exc
    except AIServiceUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is temporarily unavailable.",
        ) from exc


@router.post("/chat", response_model=AIChatResponse)
def generate_ai_coach_response_endpoint(
    request: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return generate_ai_coach_response(
            db,
            current_user,
            message=request.message,
            source=request.source,
            import_batch_id=request.import_batch_id,
            date_from=request.date_from,
            date_to=request.date_to,
        )
    except ImportBatchNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Import batch not found",
        ) from exc
    except NoFinancialDataError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Add transactions or upload a CSV statement before using the AI coach.",
        ) from exc
    except AIServiceNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured.",
        ) from exc
    except AIServiceUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI coach is temporarily unavailable.",
        ) from exc
