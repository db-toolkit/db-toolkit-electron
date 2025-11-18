"""Data models."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class DatabaseType(str, Enum):
    """Supported database types."""
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    SQLITE = "sqlite"
    MONGODB = "mongodb"


class DatabaseConnection(BaseModel):
    """Database connection model."""
    id: str
    name: str
    db_type: DatabaseType
    host: Optional[str] = None
    port: Optional[int] = None
    database: str
    username: Optional[str] = None
    password: Optional[str] = None


class AppSettings(BaseModel):
    """Application settings model."""
    # Appearance
    theme: str = Field(default="auto", description="Theme: light, dark, or auto")
    editor_font_size: int = Field(default=14, ge=10, le=24, description="Editor font size")
    
    # Query Defaults
    default_query_limit: int = Field(default=1000, ge=10, le=10000, description="Default row limit")
    default_query_timeout: int = Field(default=30, ge=5, le=300, description="Default timeout in seconds")
    auto_format_on_paste: bool = Field(default=False, description="Auto-format SQL on paste")
    query_history_retention_days: int = Field(default=30, ge=1, le=365, description="Query history retention")
    
    # Editor Preferences
    editor_tab_size: int = Field(default=2, ge=2, le=8, description="Tab size")
    editor_word_wrap: bool = Field(default=True, description="Enable word wrap")
    editor_auto_complete: bool = Field(default=True, description="Enable auto-complete")
    editor_snippets_enabled: bool = Field(default=True, description="Enable snippets")
    
    # Connection Defaults
    default_db_type: str = Field(default="postgresql", description="Default database type")
    connection_timeout: int = Field(default=10, ge=5, le=60, description="Connection timeout in seconds")
    auto_reconnect: bool = Field(default=True, description="Auto-reconnect on failure")
