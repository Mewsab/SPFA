from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.s_transaction import (
    TRANSACTION_CATEGORY_OPTIONS,
    TransactionCategory,
    TransactionCategoryListResponse,
    TRANSACTION_TYPE_OPTIONS,
    TransactionCreate,
    TransactionResponse,
    TransactionSummary,
    TransactionType,
    TransactionTypeListResponse,
    TransactionUpdate,
)
from app.services.transaction_service import (
    create_transaction,
    delete_transaction,
    get_transaction_by_id,
    get_transaction_summary,
    get_transactions,
    update_transaction,
)


router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post(
    "/",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction_endpoint(
    transaction_data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_transaction(db, current_user, transaction_data)


@router.get("/", response_model=list[TransactionResponse])
def list_transactions(
    transaction_type: TransactionType | None = None,
    category: TransactionCategory | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_transactions(
        db,
        current_user,
        transaction_type=transaction_type,
        category=category,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/summary", response_model=TransactionSummary)
def get_transaction_summary_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_transaction_summary(db, current_user)


@router.get("/types", response_model=TransactionTypeListResponse)
def get_transaction_types(
    current_user: User = Depends(get_current_user),
):
    return {"transaction_types": TRANSACTION_TYPE_OPTIONS}


@router.get("/categories", response_model=TransactionCategoryListResponse)
def get_transaction_categories(
    current_user: User = Depends(get_current_user),
):
    return {"categories": TRANSACTION_CATEGORY_OPTIONS}


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = get_transaction_by_id(db, current_user, transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    return transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction_endpoint(
    transaction_id: int,
    transaction_data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = update_transaction(db, current_user, transaction_id, transaction_data)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    return transaction


@router.delete("/{transaction_id}")
def delete_transaction_endpoint(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = delete_transaction(db, current_user, transaction_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    return {"message": "Transaction deleted successfully"}
