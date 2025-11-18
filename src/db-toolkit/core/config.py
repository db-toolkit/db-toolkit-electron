"""Application configuration."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings."""
    
    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Gemini Settings
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    GEMINI_TEMPERATURE: float = float(os.getenv("GEMINI_TEMPERATURE", "0.3"))
    GEMINI_MAX_TOKENS: int = int(os.getenv("GEMINI_MAX_TOKENS", "2048"))
    
    # Storage
    STORAGE_PATH: Path = Path.home() / ".db-toolkit"
    
    @property
    def has_gemini_key(self) -> bool:
        """Check if Gemini API key is configured."""
        return bool(self.GEMINI_API_KEY)


settings = Settings()
