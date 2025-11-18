"""Session management routes."""

from typing import List, Optional

from fastapi import APIRouter

from core.schemas import ConnectionState, SessionSettings, SessionState
from operations.connection_manager import connection_manager
from operations.session_manager import session_manager

router = APIRouter(prefix="/session", tags=["Session"])


@router.get("/state", response_model=SessionState)
async def get_session_state():
    """Get current session state with all active connections."""
    active_ids = connection_manager.get_all_active_connections()
    connections = []

    for conn_id in active_ids:
        conn = connection_manager.get_connection(conn_id)
        if conn:
            connections.append(
                ConnectionState(
                    connection_id=conn.id,
                    is_connected=connection_manager.is_connected(conn.id),
                    db_type=conn.db_type.value,
                    name=conn.name,
                    host=conn.host,
                    database=conn.database,
                )
            )

    return SessionState(
        active_connections=connections, total_connections=len(connections)
    )


@router.post("/save")
async def save_session(last_active: Optional[str] = None):
    """Save current session state."""
    active_ids = connection_manager.get_all_active_connections()
    success = session_manager.save_session(active_ids, last_active)

    return {"success": success, "saved_connections": len(active_ids)}


@router.post("/restore")
async def restore_session():
    """Restore previous session state."""
    connections = session_manager.get_restorable_connections()
    restored = 0

    for conn in connections:
        success = await connection_manager.connect(conn)
        if success:
            restored += 1

    return {"success": restored > 0, "restored_connections": restored}


@router.delete("/clear")
async def clear_session():
    """Clear saved session state."""
    success = session_manager.clear_session()
    return {"success": success}


@router.get("/settings", response_model=SessionSettings)
async def get_session_settings():
    """Get saved session settings."""
    session_data = session_manager.load_session()

    return SessionSettings(
        active_connection_ids=session_data.get("active_connection_ids", []),
        last_active_connection=session_data.get("last_active_connection"),
        settings=session_data.get("settings", {}),
    )
