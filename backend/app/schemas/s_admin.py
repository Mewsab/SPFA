from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class AdminOverviewResponse(BaseModel):
    total_users: int
    total_transactions: int
    total_manual_transactions: int
    total_imported_transactions: int
    total_import_batches: int
    total_successful_import_rows: int
    total_failed_import_rows: int


class AdminUserResponse(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: str
    role: str
    phone_number: str | None = None
    occupation_type: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminUserRoleUpdate(BaseModel):
    role: Literal["user", "admin"]


class AdminImportBatchResponse(BaseModel):
    import_batch_id: int
    user_id: int
    user_email: str | None = None
    file_name: str
    uploaded_at: datetime
    total_rows: int
    successful_rows: int
    failed_rows: int
    status: str

    model_config = ConfigDict(from_attributes=True)
