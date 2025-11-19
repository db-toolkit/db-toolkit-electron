"""WebSocket handler for streaming migrator output."""
from fastapi import WebSocket
from operations.migrator_executor import MigratorExecutor


async def websocket_migrator(websocket: WebSocket):
    """Handle WebSocket connection for migrator command streaming."""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            command = data.get("command")
            
            if not command:
                await websocket.send_json({"type": "error", "data": "No command provided"})
                continue
            
            await MigratorExecutor.execute_command_stream(command, websocket)
    except Exception:
        pass
