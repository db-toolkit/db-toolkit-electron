"""Session management operations."""

import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from ..core.config import config
from ..core.session import ConnectionSession, WorkspaceState
from ..core.storage import connection_storage


class SessionManager:
    """Manages multiple database connection sessions."""
    
    def __init__(self):
        """Initialize session manager."""
        self.workspace_file = config.config_dir / "workspace.json"
        self.workspace_state = WorkspaceState()
        self.load_workspace()
    
    def create_session(self, connection_id: str) -> Optional[ConnectionSession]:
        """Create a new connection session."""
        connection = connection_storage.get_connection(connection_id)
        if not connection:
            return None
        
        # Check if session already exists for this connection
        existing_session = self.get_session_by_connection(connection_id)
        if existing_session:
            existing_session.is_active = True
            existing_session.update_activity()
            return existing_session
        
        # Create new session
        session = ConnectionSession(
            connection_id=connection_id,
            connection=connection
        )
        
        self.workspace_state.add_session(session)
        self.save_workspace()
        return session
    
    def close_session(self, session_id: str) -> bool:
        """Close a connection session."""
        session = self.workspace_state.active_sessions.get(session_id)
        if not session:
            return False
        
        # Check for pending changes
        if session.pending_changes > 0:
            # In a real implementation, this would prompt the user
            # For now, just mark as inactive
            session.is_active = False
        else:
            self.workspace_state.remove_session(session_id)
        
        self.save_workspace()
        return True
    
    def switch_session(self, session_id: str) -> bool:
        """Switch to a different session."""
        success = self.workspace_state.switch_session(session_id)
        if success:
            self.save_workspace()
        return success
    
    def get_session(self, session_id: str) -> Optional[ConnectionSession]:
        """Get session by ID."""
        return self.workspace_state.active_sessions.get(session_id)
    
    def get_session_by_connection(self, connection_id: str) -> Optional[ConnectionSession]:
        """Get session by connection ID."""
        for session in self.workspace_state.active_sessions.values():
            if session.connection_id == connection_id and session.is_active:
                return session
        return None
    
    def get_active_sessions(self) -> List[ConnectionSession]:
        """Get all active sessions."""
        return [s for s in self.workspace_state.active_sessions.values() if s.is_active]
    
    def get_current_session(self) -> Optional[ConnectionSession]:
        """Get currently active session."""
        return self.workspace_state.get_current_session()
    
    def update_session_state(self, session_id: str, **kwargs) -> bool:
        """Update session state."""
        session = self.get_session(session_id)
        if not session:
            return False
        
        for key, value in kwargs.items():
            if hasattr(session, key):
                setattr(session, key, value)
        
        session.update_activity()
        self.save_workspace()
        return True
    
    def handle_connection_conflict(self, connection_id: str) -> str:
        """Handle conflicts when multiple sessions try to use same connection."""
        existing_session = self.get_session_by_connection(connection_id)
        if existing_session:
            # Return existing session ID to reuse
            return existing_session.session_id
        
        # Create new session
        new_session = self.create_session(connection_id)
        return new_session.session_id if new_session else ""
    
    def cleanup_inactive_sessions(self, max_age_hours: int = 24) -> int:
        """Clean up old inactive sessions."""
        from datetime import datetime, timedelta
        
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        sessions_to_remove = []
        
        for session_id, session in self.workspace_state.active_sessions.items():
            if not session.is_active and session.last_activity < cutoff_time:
                sessions_to_remove.append(session_id)
        
        for session_id in sessions_to_remove:
            self.workspace_state.remove_session(session_id)
        
        if sessions_to_remove:
            self.save_workspace()
        
        return len(sessions_to_remove)
    
    def save_workspace(self) -> None:
        """Save workspace state to file."""
        try:
            with open(self.workspace_file, 'w') as f:
                json.dump(self.workspace_state.to_dict(), f, indent=2)
        except Exception as e:
            print(f"Error saving workspace: {e}")
    
    def load_workspace(self) -> None:
        """Load workspace state from file."""
        if not self.workspace_file.exists():
            return
        
        try:
            with open(self.workspace_file, 'r') as f:
                data = json.load(f)
            
            # Restore sessions
            for session_id, session_data in data.get('active_sessions', {}).items():
                connection = connection_storage.get_connection(session_data['connection_id'])
                if connection:
                    session = ConnectionSession.from_dict(session_data, connection)
                    self.workspace_state.active_sessions[session_id] = session
            
            # Restore workspace state
            self.workspace_state.current_session_id = data.get('current_session_id')
            self.workspace_state.window_geometry = data.get('window_geometry')
            self.workspace_state.panel_sizes = data.get('panel_sizes', {})
            
        except Exception as e:
            print(f"Error loading workspace: {e}")
    
    def set_window_geometry(self, geometry: Dict[str, int]) -> None:
        """Save window geometry."""
        self.workspace_state.window_geometry = geometry
        self.save_workspace()
    
    def set_panel_sizes(self, sizes: Dict[str, int]) -> None:
        """Save panel sizes."""
        self.workspace_state.panel_sizes = sizes
        self.save_workspace()


# Global session manager
session_manager = SessionManager()