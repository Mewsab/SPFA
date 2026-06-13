from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.s_transaction import (
    TransactionCreate,
    TransactionSummary,
    TransactionUpdate,
)


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def create_transaction(
    db: Session,
    current_user: User,
    transaction_data: TransactionCreate,
) -> Transaction:
    new_transaction = Transaction(
        user_id=current_user.user_id,
        **transaction_data.model_dump(),
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return new_transaction


def get_transactions(
    db: Session,
    current_user: User,
    transaction_type: str | None = None,
    category: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[Transaction]:
    query = db.query(Transaction).filter(Transaction.user_id == current_user.user_id)

    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)

    if category:
        query = query.filter(Transaction.category == category.strip().lower())

    if date_from:
        query = query.filter(Transaction.transaction_date >= date_from)

    if date_to:
        query = query.filter(Transaction.transaction_date <= date_to)

    return (
        query.order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
        .all()
    )


def get_transaction_by_id(
    db: Session,
    current_user: User,
    transaction_id: int,
) -> Transaction | None:
    return (
        db.query(Transaction)
        .filter(
            Transaction.transaction_id == transaction_id,
            Transaction.user_id == current_user.user_id,
        )
        .first()
    )


def update_transaction(
    db: Session,
    current_user: User,
    transaction_id: int,
    transaction_data: TransactionUpdate,
) -> Transaction | None:
    transaction = get_transaction_by_id(db, current_user, transaction_id)
    if not transaction:
        return None

    updates = transaction_data.model_dump(exclude_unset=True)
    for field_name, value in updates.items():
        setattr(transaction, field_name, value)

    transaction.updated_at = utcnow()
    db.commit()
    db.refresh(transaction)
    return transaction


def delete_transaction(
    db: Session,
    current_user: User,
    transaction_id: int,
) -> bool:
    transaction = get_transaction_by_id(db, current_user, transaction_id)
    if not transaction:
        return False

    db.delete(transaction)
    db.commit()
    return True


def get_transaction_summary(db: Session, current_user: User) -> TransactionSummary:
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.user_id)
        .all()
    )

    total_income = Decimal("0.00")
    total_expense = Decimal("0.00")

    for transaction in transactions:
        amount = (
            transaction.amount
            if isinstance(transaction.amount, Decimal)
            else Decimal(str(transaction.amount))
        )
        if transaction.transaction_type == "income":
            total_income += amount
        elif transaction.transaction_type == "expense":
            total_expense += amount

    return TransactionSummary(
        total_income=total_income,
        total_expense=total_expense,
        balance=total_income - total_expense,
        transaction_count=len(transactions),
    )
