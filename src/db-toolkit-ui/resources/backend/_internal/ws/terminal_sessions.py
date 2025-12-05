"""Terminal session persistence."""
import json
from pathlib import Path

SESSION_FILE = Path.home() / '.db-toolkit' / 'terminal_sessions.json'

def save_session(session_id: str, cwd: str, history: list):
    """Save terminal session state."""
    SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    sessions = load_sessions()
    sessions[session_id] = {
        'cwd': cwd,
        'history': history[-100:]  # Keep last 100 commands
    }
    
    with open(SESSION_FILE, 'w') as f:
        json.dump(sessions, f, indent=2)

def load_sessions():
    """Load all terminal sessions."""
    if not SESSION_FILE.exists():
        return {}
    
    try:
        with open(SESSION_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return {}

def get_session(session_id: str):
    """Get specific session data."""
    sessions = load_sessions()
    return sessions.get(session_id)

def delete_session(session_id: str):
    """Delete a session."""
    sessions = load_sessions()
    if session_id in sessions:
        del sessions[session_id]
        with open(SESSION_FILE, 'w') as f:
            json.dump(sessions, f, indent=2)
