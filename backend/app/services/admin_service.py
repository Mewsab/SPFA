from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.import_batch import ImportBatch
from app.models.transaction import Transaction
from app.models.user import User
from app.utils.roles import ALLOWED_ROLES, ROLE_USER


def get_admin_overview(db: Session) -> dict[str, int]:
    successful_rows, failed_rows = (
        db.query(
            func.coalesce(func.sum(ImportBatch.successful_rows), 0),
            func.coalesce(func.sum(ImportBatch.failed_rows), 0),
        )
        .one()
    )

    return {
        "total_users": db.query(func.count(User.user_id)).scalar() or 0,
        "total_transactions": db.query(func.count(Transaction.transaction_id)).scalar() or 0,
        "total_manual_transactions": (
            db.query(func.count(Transaction.transaction_id))
            .filter(Transaction.source == "manual")
            .scalar()
            or 0
        ),
        "total_imported_transactions": (
            db.query(func.count(Transaction.transaction_id))
            .filter(Transaction.source == "csv_import")
            .scalar()
            or 0
        ),
        "total_import_batches": db.query(func.count(ImportBatch.import_batch_id)).scalar() or 0,
        "total_successful_import_rows": successful_rows,
        "total_failed_import_rows": failed_rows,
    }


def list_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.user_id).all()


def update_user_role(
    db: Session,
    user_id: int,
    new_role: str,
    current_admin: User,
) -> User:
    if new_role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Role must be user or admin.",
        )

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.user_id == current_admin.user_id and new_role == ROLE_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot remove their own admin role.",
        )

    user.role = new_role
    db.commit()
    db.refresh(user)
    return user


def update_user_status(
    db: Session,
    user_id: int,
    is_active: bool,
    current_admin: User,
) -> User:
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.user_id == current_admin.user_id and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot deactivate their own account.",
        )

    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


def list_import_batches(db: Session) -> list[dict]:
    rows = (
        db.query(ImportBatch, User.email)
        .join(User, ImportBatch.user_id == User.user_id)
        .order_by(ImportBatch.uploaded_at.desc(), ImportBatch.import_batch_id.desc())
        .all()
    )

    return [
        {
            "import_batch_id": import_batch.import_batch_id,
            "user_id": import_batch.user_id,
            "user_email": user_email,
            "file_name": import_batch.file_name,
            "uploaded_at": import_batch.uploaded_at,
            "total_rows": import_batch.total_rows,
            "successful_rows": import_batch.successful_rows,
            "failed_rows": import_batch.failed_rows,
            "status": import_batch.status,
        }
        for import_batch, user_email in rows
    ]
