"""Settings management routes."""

from utils.logger import logger
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.settings_storage import SettingsStorage
from core.models import AppSettings

router = APIRouter()
storage = SettingsStorage()


class SettingsUpdateRequest(BaseModel):
    """Settings update request."""
    theme: str | None = None
    editor_font_size: int | None = None
    default_query_limit: int | None = None
    default_query_timeout: int | None = None
    auto_format_on_paste: bool | None = None
    query_history_retention_days: int | None = None
    editor_tab_size: int | None = None
    editor_word_wrap: bool | None = None
    editor_auto_complete: bool | None = None
    editor_snippets_enabled: bool | None = None
    default_db_type: str | None = None
    connection_timeout: int | None = None
    auto_reconnect: bool | None = None


@router.get("/settings", response_model=AppSettings)
async def get_settings():
    """Get application settings."""
    return await storage.get_settings()


@router.put("/settings", response_model=AppSettings)
async def update_settings(request: SettingsUpdateRequest):
    """Update application settings."""
    try:
        # Filter out None values
        updates = {k: v for k, v in request.model_dump().items() if v is not None}
        return await storage.update_settings(**updates)
    except Exception as e:
        logger.error(f"Route error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/settings/reset", response_model=AppSettings)
async def reset_settings():
    """Reset settings to defaults."""
    return await storage.reset_settings()
