"""WebSocket routes."""

from fastapi import WebSocket, WebSocketDisconnect
from ws.backup_notifier import backup_notifier


async def websocket_backups(websocket: WebSocket):
    """WebSocket endpoint for backup status updates."""
    await backup_notifier.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        backup_notifier.disconnect(websocket)
