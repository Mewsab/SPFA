from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.s_budget import (
    BudgetCreate,
    BudgetOverviewResponse,
    BudgetPeriodTypeListResponse,
    BudgetResponse,
    BudgetUpdate,
)
from app.schemas.s_transaction import TransactionCategoryListResponse
from app.services.budget_service import (
    BudgetOverlapError,
    create_budget,
    delete_budget,
    get_budget_by_id,
    get_budget_overview,
    get_budgets,
    update_budget,
)
from app.utils.options import (
    BUDGET_PERIOD_TYPE_OPTIONS,
    BudgetPeriodType,
    TRANSACTION_CATEGORY_OPTIONS,
    TransactionCategory,
)


router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.post(
    "/",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_budget_endpoint(
    budget_data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return create_budget(db, current_user, budget_data)
    except BudgetOverlapError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get("/", response_model=list[BudgetResponse])
def list_budgets(
    category: TransactionCategory | None = None,
    period_type: BudgetPeriodType | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_budgets(
        db,
        current_user,
        category=category,
        period_type=period_type,
    )


@router.get("/overview", response_model=BudgetOverviewResponse)
def get_budget_overview_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_budget_overview(db, current_user)


@router.get("/categories", response_model=TransactionCategoryListResponse)
def get_budget_categories(
    current_user: User = Depends(get_current_user),
):
    return {"categories": TRANSACTION_CATEGORY_OPTIONS}


@router.get("/period-types", response_model=BudgetPeriodTypeListResponse)
def get_budget_period_types(
    current_user: User = Depends(get_current_user),
):
    return {"period_types": BUDGET_PERIOD_TYPE_OPTIONS}


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = get_budget_by_id(db, current_user, budget_id)
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )

    return budget


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget_endpoint(
    budget_id: int,
    budget_data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        budget = update_budget(db, current_user, budget_id, budget_data)
    except BudgetOverlapError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )

    return budget


@router.delete("/{budget_id}")
def delete_budget_endpoint(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = delete_budget(db, current_user, budget_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )

    return {"message": "Budget deleted successfully"}
