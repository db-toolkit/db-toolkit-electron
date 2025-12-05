"""CSV import/export schemas."""

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class ExportCSVRequest(BaseModel):
    """Request to export data to CSV."""

    connection_id: str
    table: str
    schema_name: Optional[str] = Field(default=None, alias="schema")
    query: Optional[str] = None
    delimiter: str = Field(default=",")
    include_headers: bool = Field(default=True)


class ExportCSVResponse(BaseModel):
    """Response containing CSV data."""

    csv_content: str
    row_count: int


class ValidateCSVRequest(BaseModel):
    """Request to validate CSV data."""

    csv_content: str
    column_mapping: Dict[str, str] = Field(
        description="Map CSV columns to database columns"
    )


class ValidateCSVResponse(BaseModel):
    """Response with validation results."""

    valid: bool
    row_count: int
    errors: List[str]


class ImportCSVRequest(BaseModel):
    """Request to import CSV data."""

    connection_id: str
    table: str
    schema_name: Optional[str] = Field(default=None, alias="schema")
    csv_content: str
    column_mapping: Dict[str, str]
    batch_size: int = Field(default=100, ge=1, le=1000)


class ImportCSVResponse(BaseModel):
    """Response with import results."""

    success: bool
    imported: int
    failed: int
    errors: List[str]
    total_errors: int
