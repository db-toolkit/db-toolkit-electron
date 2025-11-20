"""Analytics routes for database monitoring."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from operations.analytics_manager import AnalyticsManager
from operations.connection_manager import ConnectionManager

router = APIRouter(prefix="/analytics", tags=["analytics"])
connection_manager = ConnectionManager()


class KillQueryRequest(BaseModel):
    """Kill query request."""
    pid: int


@router.get("/connections/{connection_id}")
async def get_analytics(connection_id: int):
    """Get database analytics."""
    try:
        connection_info = connection_manager.get_connection(connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        config, connector = connection_info
        analytics_manager = AnalyticsManager(connector.connection)
        result = await analytics_manager.get_analytics(config)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/connections/{connection_id}/kill")
async def kill_query(connection_id: int, request: KillQueryRequest):
    """Kill a running query."""
    try:
        connection_info = connection_manager.get_connection(connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        config, connector = connection_info
        analytics_manager = AnalyticsManager(connector.connection)
        result = await analytics_manager.kill_query(request.pid, config)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
