"""WebSocket endpoint for real-time analytics."""

import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from operations.analytics_manager import AnalyticsManager
from operations.connection_manager import connection_manager


async def websocket_analytics(websocket: WebSocket):
    """WebSocket endpoint for real-time analytics updates."""
    await websocket.accept()
    connection_id = None
    
    try:
        # Receive connection ID with timeout
        data = await asyncio.wait_for(websocket.receive_json(), timeout=10.0)
        connection_id = data.get('connection_id')
        
        if not connection_id:
            await websocket.send_json({"error": "connection_id required"})
            return
        
        connection_info = await connection_manager.get_connection(connection_id)
        if not connection_info:
            await websocket.send_json({"error": "Connection not found"})
            return
        
        connector = await connection_manager.get_connector(connection_id)
        if not connector:
            await websocket.send_json({"error": "Connection not active"})
            return
            
        analytics_manager = AnalyticsManager(connector.connection)
        
        # Send analytics every 3 seconds with connection check
        while websocket.client_state.name == 'CONNECTED':
            try:
                result = await analytics_manager.get_analytics(connection_info, connection_id)
                await websocket.send_json(result)
                await asyncio.sleep(3)
            except Exception as e:
                await websocket.send_json({"error": str(e)})
                break
            
    except (WebSocketDisconnect, asyncio.TimeoutError):
        pass
    except Exception:
        pass
