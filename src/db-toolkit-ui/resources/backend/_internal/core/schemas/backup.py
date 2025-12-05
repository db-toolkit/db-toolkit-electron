"""Backup request/response schemas."""

from typing import Optional
from pydantic import BaseModel, Field
from core.models import BackupType


class BackupCreateRequest(BaseModel):
    """Backup creation request."""
    connection_id: str
    name: str
    backup_type: BackupType
    tables: Optional[list[str]] = None
    compress: bool = Field(default=True, description="Compress backup file")


class BackupRestoreRequest(BaseModel):
    """Backup restoration request."""
    backup_id: str
    target_connection_id: Optional[str] = None
    tables: Optional[list[str]] = None
