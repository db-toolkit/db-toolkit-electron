"""WebSocket notifier for backup status updates."""

from typing import Set
from fastapi import WebSocket


class BackupNotifier:
    """Manages WebSocket connections for backup status updates."""

    def __init__(self):
        self.connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        """Add new WebSocket connection."""
        await websocket.accept()
        self.connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection."""
        self.connections.discard(websocket)

    async def notify_backup_update(self, backup_id: str, status: str, data: dict = None):
        """Notify all connected clients about backup status change."""
        message = {
            "type": "backup_update",
            "backup_id": backup_id,
            "status": status,
            "data": data or {}
        }
        
        disconnected = set()
        for connection in self.connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            self.connections.discard(connection)


backup_notifier = BackupNotifier()
