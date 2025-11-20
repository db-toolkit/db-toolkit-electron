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
        # Receive connection ID
        data = await websocket.receive_json()
        connection_id = data.get('connection_id')
        
        if not connection_id:
            await websocket.send_json({"error": "connection_id required"})
            await websocket.close()
            return
        
        connection_info = await connection_manager.get_connection(connection_id)
        if not connection_info:
            await websocket.send_json({"error": "Connection not found"})
            await websocket.close()
            return
        
        connector = await connection_manager.get_connector(connection_id)
        if not connector:
            await websocket.send_json({"error": "Connection not active"})
            await websocket.close()
            return
            
        analytics_manager = AnalyticsManager(connector.connection)
        
        # Send analytics every 2 seconds
        while True:
            result = await analytics_manager.get_analytics(connection_info, connection_id)
            await websocket.send_json(result)
            await asyncio.sleep(2)
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except:
            pass
    finally:
        try:
            await websocket.close()
        except:
            pass
