"""Session management schemas."""

from typing import Dict, List, Optional

from pydantic import BaseModel


class ConnectionState(BaseModel):
    """State of an active connection."""

    connection_id: str
    is_connected: bool
    db_type: str
    name: str
    host: Optional[str] = None
    database: Optional[str] = None


class SessionState(BaseModel):
    """Current session state."""

    active_connections: List[ConnectionState]
    total_connections: int


class SessionSettings(BaseModel):
    """Session settings to persist."""

    active_connection_ids: List[str]
    last_active_connection: Optional[str] = None
    settings: Dict[str, str] = {}
