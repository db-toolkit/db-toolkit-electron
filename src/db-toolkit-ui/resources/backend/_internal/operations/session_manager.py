"""Session state management."""

import json
from pathlib import Path
from typing import Dict, Optional

from core.models import DatabaseConnection
from core.storage import ConnectionStorage
from utils.logger import logger


class SessionManager:
    """Manages session state and settings."""

    def __init__(self):
        """Initialize session manager."""
        self.session_file = Path.home() / ".db-toolkit" / "session.json"
        self.session_file.parent.mkdir(parents=True, exist_ok=True)
        self.storage = ConnectionStorage()

    async def save_session(
        self, active_connection_ids: list[str], last_active: Optional[str] = None
    ) -> bool:
        """Save current session state."""
        try:
            session_data = {
                "active_connection_ids": active_connection_ids,
                "last_active_connection": last_active,
                "settings": {},
            }

            with open(self.session_file, "w") as f:
                json.dump(session_data, f, indent=2)

            return True
        except Exception as e:
            logger.error(f"Failed to save session: {str(e)}")
            return False

    async def load_session(self) -> Dict:
        """Load saved session state."""
        try:
            if self.session_file.exists():
                with open(self.session_file, "r") as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load session: {str(e)}")

        return {"active_connection_ids": [], "last_active_connection": None, "settings": {}}

    async def clear_session(self) -> bool:
        """Clear session state."""
        try:
            if self.session_file.exists():
                self.session_file.unlink()
            return True
        except Exception as e:
            logger.error(f"Failed to clear session: {str(e)}")
            return False

    async def get_restorable_connections(self) -> list[DatabaseConnection]:
        """Get connections that can be restored from session."""
        session = await self.load_session()
        connections = []

        for conn_id in session.get("active_connection_ids", []):
            conn = await self.storage.get_connection(conn_id)
            if conn:
                connections.append(conn)

        return connections


session_manager = SessionManager()
