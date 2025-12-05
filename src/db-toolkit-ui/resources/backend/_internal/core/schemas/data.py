"""Data editing schemas."""

from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class UpdateRowRequest(BaseModel):
    """Update row request."""

    table: str
    schema_name: Optional[str] = Field(default="public", alias="schema")
    primary_key: Dict[str, Any]
    changes: Dict[str, Any]


class InsertRowRequest(BaseModel):
    """Insert row request."""

    table: str
    schema_name: Optional[str] = Field(default="public", alias="schema")
    data: Dict[str, Any]


class DeleteRowRequest(BaseModel):
    """Delete row request."""

    table: str
    schema_name: Optional[str] = Field(default="public", alias="schema")
    primary_key: Dict[str, Any]