"""Settings storage management."""

import json
from pathlib import Path
from typing import Optional
from core.models import AppSettings


class SettingsStorage:
    """Manages application settings storage."""
    
    def __init__(self, storage_path: Optional[Path] = None):
        """Initialize settings storage."""
        self.storage_path = storage_path or Path.home() / ".db-toolkit" / "settings.json"
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
    
    async def get_settings(self) -> AppSettings:
        """Get application settings."""
        if not self.storage_path.exists():
            return AppSettings()
        
        with open(self.storage_path, 'r') as f:
            data = json.load(f)
        
        return AppSettings(**data)
    
    async def update_settings(self, **kwargs) -> AppSettings:
        """Update application settings."""
        current = await self.get_settings()
        updated_data = current.model_dump()
        updated_data.update(kwargs)
        
        settings = AppSettings(**updated_data)
        await self._save_settings(settings)
        
        return settings
    
    async def reset_settings(self) -> AppSettings:
        """Reset settings to defaults."""
        settings = AppSettings()
        await self._save_settings(settings)
        return settings
    
    async def _save_settings(self, settings: AppSettings):
        """Save settings to storage."""
        with open(self.storage_path, 'w') as f:
            json.dump(settings.model_dump(), f, indent=2)
