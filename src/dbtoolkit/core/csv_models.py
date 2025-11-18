"""CSV import/export models and utilities."""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Callable
from enum import Enum
from pathlib import Path


class ImportStatus(Enum):
    """CSV import status."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ExportStatus(Enum):
    """CSV export status."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class ColumnMapping:
    """Maps CSV column to database column."""
    csv_column: str
    db_column: str
    data_type: str
    is_required: bool
    default_value: Optional[Any] = None


@dataclass
class ImportConfig:
    """CSV import configuration."""
    file_path: Path
    table_name: str
    schema_name: Optional[str]
    column_mappings: List[ColumnMapping]
    has_header: bool = True
    delimiter: str = ","
    quote_char: str = '"'
    encoding: str = "utf-8"
    skip_rows: int = 0
    batch_size: int = 1000
    on_duplicate: str = "skip"  # skip, update, error


@dataclass
class ExportConfig:
    """CSV export configuration."""
    file_path: Path
    query: Optional[str] = None
    table_name: Optional[str] = None
    schema_name: Optional[str] = None
    include_header: bool = True
    delimiter: str = ","
    quote_char: str = '"'
    encoding: str = "utf-8"
    limit: Optional[int] = None


@dataclass
class ImportProgress:
    """Import operation progress."""
    total_rows: int
    processed_rows: int
    successful_rows: int
    failed_rows: int
    current_batch: int
    status: ImportStatus
    error_message: Optional[str] = None
    
    @property
    def progress_percent(self) -> float:
        """Calculate progress percentage."""
        if self.total_rows == 0:
            return 0.0
        return (self.processed_rows / self.total_rows) * 100


@dataclass
class ExportProgress:
    """Export operation progress."""
    total_rows: int
    exported_rows: int
    current_batch: int
    status: ExportStatus
    error_message: Optional[str] = None
    
    @property
    def progress_percent(self) -> float:
        """Calculate progress percentage."""
        if self.total_rows == 0:
            return 0.0
        return (self.exported_rows / self.total_rows) * 100


@dataclass
class ValidationError:
    """Data validation error during import."""
    row_number: int
    column: str
    value: Any
    error_message: str


@dataclass
class ImportResult:
    """Final import operation result."""
    status: ImportStatus
    total_rows: int
    successful_rows: int
    failed_rows: int
    validation_errors: List[ValidationError]
    execution_time: float
    error_message: Optional[str] = None


@dataclass
class ExportResult:
    """Final export operation result."""
    status: ExportStatus
    exported_rows: int
    file_size: int
    execution_time: float
    error_message: Optional[str] = None