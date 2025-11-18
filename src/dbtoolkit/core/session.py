"""Session management for multi-connection handling."""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid
from .models import DatabaseConnection


@dataclass
class ConnectionSession:
    """Represents an active connection session."""
    
    connection_id: str
    connection: DatabaseConnection
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=datetime.now)
    last_activity: datetime = field(default_factory=datetime.now)
    is_active: bool = True
    
    # Session state
    current_schema: Optional[str] = None
    current_table: Optional[str] = None
    query_history: List[str] = field(default_factory=list)
    pending_changes: int = 0
    
    def update_activity(self) -> None:
        """Update last activity timestamp."""
        self.last_activity = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for persistence."""
        return {
            'connection_id': self.connection_id,
            'session_id': self.session_id,
            'created_at': self.created_at.isoformat(),
            'last_activity': self.last_activity.isoformat(),
            'is_active': self.is_active,
            'current_schema': self.current_schema,
            'current_table': self.current_table,
            'query_history': self.query_history[-50:],  # Keep last 50 queries
            'pending_changes': self.pending_changes
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any], connection: DatabaseConnection) -> 'ConnectionSession':
        """Create from dictionary."""
        return cls(
            connection_id=data['connection_id'],
            connection=connection,
            session_id=data['session_id'],
            created_at=datetime.fromisoformat(data['created_at']),
            last_activity=datetime.fromisoformat(data['last_activity']),
            is_active=data['is_active'],
            current_schema=data.get('current_schema'),
            current_table=data.get('current_table'),
            query_history=data.get('query_history', []),
            pending_changes=data.get('pending_changes', 0)
        )


@dataclass
class WorkspaceState:
    """Represents the current workspace state."""
    
    active_sessions: Dict[str, ConnectionSession] = field(default_factory=dict)
    current_session_id: Optional[str] = None
    window_geometry: Optional[Dict[str, int]] = None
    panel_sizes: Dict[str, int] = field(default_factory=dict)
    
    def get_current_session(self) -> Optional[ConnectionSession]:
        """Get currently active session."""
        if self.current_session_id:
            return self.active_sessions.get(self.current_session_id)
        return None
    
    def add_session(self, session: ConnectionSession) -> None:
        """Add a new session."""
        self.active_sessions[session.session_id] = session
        if not self.current_session_id:
            self.current_session_id = session.session_id
    
    def remove_session(self, session_id: str) -> None:
        """Remove a session."""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
            
        if self.current_session_id == session_id:
            # Switch to another active session
            active_sessions = [s for s in self.active_sessions.values() if s.is_active]
            self.current_session_id = active_sessions[0].session_id if active_sessions else None
    
    def switch_session(self, session_id: str) -> bool:
        """Switch to a different session."""
        if session_id in self.active_sessions:
            self.current_session_id = session_id
            self.active_sessions[session_id].update_activity()
            return True
        return False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for persistence."""
        return {
            'active_sessions': {
                sid: session.to_dict() 
                for sid, session in self.active_sessions.items()
            },
            'current_session_id': self.current_session_id,
            'window_geometry': self.window_geometry,
            'panel_sizes': self.panel_sizes
        }