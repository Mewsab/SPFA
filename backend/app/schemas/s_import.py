from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ImportRowError(BaseModel):
    row_number: int
    reason: str
    raw_data: dict[str, Any] | None = None


class ImportBatchResponse(BaseModel):
    import_batch_id: int
    file_name: str
    total_rows: int
    successful_rows: int
    failed_rows: int
    status: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CSVImportResponse(BaseModel):
    import_batch: ImportBatchResponse
    imported_transactions_count: int
    failed_rows_count: int
    errors: list[ImportRowError]
    message: str


class CSVTemplateResponse(BaseModel):
    columns: list[str]
    example_row: dict[str, str]
