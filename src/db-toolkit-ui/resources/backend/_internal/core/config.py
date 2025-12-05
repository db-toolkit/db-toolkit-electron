"""Application configuration."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings."""
    
    # Cloudflare Workers AI (Primary AI Provider)
    cloudflare_account_id: str = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
    cloudflare_api_token: str = os.getenv("CLOUDFLARE_API_TOKEN", "")
    cloudflare_model: str = os.getenv("CLOUDFLARE_MODEL", "@cf/meta/llama-3.1-70b-instruct")
    
    # AI Configuration
    ai_temperature: float = float(os.getenv("AI_TEMPERATURE", "0.7"))
    ai_max_tokens: int = int(os.getenv("AI_MAX_TOKENS", "2048"))
    
    # Email Configuration
    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    issue_email: str = os.getenv("ISSUE_EMAIL", "")
    
    # Storage
    STORAGE_PATH: Path = Path.home() / ".db-toolkit"
    
    @property
    def has_cloudflare_credentials(self) -> bool:
        """Check if Cloudflare credentials are configured."""
        return bool(self.cloudflare_account_id and self.cloudflare_api_token)
    
    @property
    def has_email_credentials(self) -> bool:
        """Check if email credentials are configured."""
        return bool(self.resend_api_key and self.issue_email)


settings = Settings()
