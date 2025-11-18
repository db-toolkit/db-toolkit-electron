"""Session management controller for UI integration."""

from PySide6.QtCore import QObject, Signal, Slot, Property
from PySide6.QtQml import QmlElement
from typing import List, Dict, Any, Optional
from ...operations.session_manager import session_manager
from ...utils.constants import QML_IMPORT_NAME, QML_IMPORT_MAJOR_VERSION


@QmlElement
class SessionController(QObject):
    """Controller for managing multiple database sessions."""
    
    sessionsChanged = Signal()
    currentSessionChanged = Signal()
    sessionStateChanged = Signal(str, arguments=['sessionId'])
    
    def __init__(self):
        """Initialize session controller."""
        super().__init__()
        self._sessions = []
        self._current_session_id = ""
        self.refresh_sessions()
    
    @Property(list, notify=sessionsChanged)
    def sessions(self) -> List[Dict[str, Any]]:
        """Get list of active sessions for QML."""
        return self._sessions
    
    @Property(str, notify=currentSessionChanged)
    def currentSessionId(self) -> str:
        """Get current session ID."""
        return self._current_session_id
    
    @Slot(str, result=str)
    def create_session(self, connection_id: str) -> str:
        """Create new session for connection."""
        session = session_manager.create_session(connection_id)
        if session:
            self.refresh_sessions()
            return session.session_id
        return ""
    
    @Slot(str, result=bool)
    def close_session(self, session_id: str) -> bool:
        """Close a session."""
        success = session_manager.close_session(session_id)
        if success:
            self.refresh_sessions()
        return success
    
    @Slot(str, result=bool)
    def switch_session(self, session_id: str) -> bool:
        """Switch to different session."""
        success = session_manager.switch_session(session_id)
        if success:
            self._current_session_id = session_id
            self.currentSessionChanged.emit()
            self.sessionStateChanged.emit(session_id)
        return success
    
    @Slot(str, str, str)
    def update_session_context(self, session_id: str, schema: str, table: str) -> None:
        """Update session context (current schema/table)."""
        session_manager.update_session_state(
            session_id,
            current_schema=schema if schema else None,
            current_table=table if table else None
        )
        self.sessionStateChanged.emit(session_id)
    
    @Slot(str, int)
    def update_pending_changes(self, session_id: str, count: int) -> None:
        """Update pending changes count for session."""
        session_manager.update_session_state(session_id, pending_changes=count)
        self.sessionStateChanged.emit(session_id)
    
    @Slot(str, result=dict)
    def get_session_info(self, session_id: str) -> Dict[str, Any]:
        """Get session information."""
        session = session_manager.get_session(session_id)
        if session:
            return {
                'session_id': session.session_id,
                'connection_id': session.connection_id,
                'connection_name': session.connection.name,
                'db_type': session.connection.db_type.value,
                'current_schema': session.current_schema or "",
                'current_table': session.current_table or "",
                'pending_changes': session.pending_changes,
                'last_activity': session.last_activity.isoformat(),
                'is_active': session.is_active
            }
        return {}
    
    @Slot(str, result=bool)
    def has_pending_changes(self, session_id: str) -> bool:
        """Check if session has pending changes."""
        session = session_manager.get_session(session_id)
        return session.pending_changes > 0 if session else False
    
    @Slot(str, result=str)
    def handle_connection_conflict(self, connection_id: str) -> str:
        """Handle connection conflicts."""
        session_id = session_manager.handle_connection_conflict(connection_id)
        if session_id:
            self.refresh_sessions()
        return session_id
    
    @Slot()
    def cleanup_sessions(self) -> None:
        """Clean up old inactive sessions."""
        cleaned = session_manager.cleanup_inactive_sessions()
        if cleaned > 0:
            self.refresh_sessions()
    
    @Slot(dict)
    def save_window_geometry(self, geometry: Dict[str, int]) -> None:
        """Save window geometry."""
        session_manager.set_window_geometry(geometry)
    
    @Slot(dict)
    def save_panel_sizes(self, sizes: Dict[str, int]) -> None:
        """Save panel sizes."""
        session_manager.set_panel_sizes(sizes)
    
    @Slot(result=dict)
    def get_workspace_state(self) -> Dict[str, Any]:
        """Get current workspace state."""
        workspace = session_manager.workspace_state
        return {
            'window_geometry': workspace.window_geometry or {},
            'panel_sizes': workspace.panel_sizes,
            'session_count': len(workspace.active_sessions)
        }
    
    def refresh_sessions(self) -> None:
        """Refresh sessions list."""
        active_sessions = session_manager.get_active_sessions()
        self._sessions = []
        
        for session in active_sessions:
            self._sessions.append({
                'session_id': session.session_id,
                'connection_id': session.connection_id,
                'connection_name': session.connection.name,
                'db_type': session.connection.db_type.value,
                'current_schema': session.current_schema or "",
                'current_table': session.current_table or "",
                'pending_changes': session.pending_changes,
                'last_activity': session.last_activity.isoformat(),
                'is_active': session.is_active
            })
        
        # Update current session
        current_session = session_manager.get_current_session()
        new_current_id = current_session.session_id if current_session else ""
        
        if self._current_session_id != new_current_id:
            self._current_session_id = new_current_id
            self.currentSessionChanged.emit()
        
        self.sessionsChanged.emit()