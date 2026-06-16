from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_admin_user
from app.models.user import User
from app.schemas.s_admin import (
    AdminImportBatchResponse,
    AdminOverviewResponse,
    AdminUserResponse,
    AdminUserRoleUpdate,
    AdminUserStatusUpdate,
)
from app.services.admin_service import (
    get_admin_overview,
    list_import_batches,
    list_users,
    update_user_role,
    update_user_status,
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin_user)],
)


@router.get("/overview", response_model=AdminOverviewResponse)
def get_overview(db: Session = Depends(get_db)):
    return get_admin_overview(db)


@router.get("/users", response_model=list[AdminUserResponse])
def get_users(db: Session = Depends(get_db)):
    return list_users(db)


@router.patch("/users/{user_id}/role", response_model=AdminUserResponse)
def patch_user_role(
    user_id: int,
    role_update: AdminUserRoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    return update_user_role(db, user_id, role_update.role, current_admin)


@router.patch("/users/{user_id}/status", response_model=AdminUserResponse)
def patch_user_status(
    user_id: int,
    status_update: AdminUserStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    return update_user_status(db, user_id, status_update.is_active, current_admin)


@router.get("/import-batches", response_model=list[AdminImportBatchResponse])
def get_import_batches(db: Session = Depends(get_db)):
    return list_import_batches(db)
