"""Analytics routes for database monitoring."""

from utils.logger import logger
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from operations.analytics_manager import AnalyticsManager
from operations.connection_manager import connection_manager

router = APIRouter()


class KillQueryRequest(BaseModel):
    """Kill query request."""
    pid: int


class QueryPlanRequest(BaseModel):
    """Query plan request."""
    query: str


@router.get("/connections/{connection_id}")
async def get_analytics(connection_id: str):
    """Get database analytics."""
    from operations.operation_lock import operation_lock
    
    try:
        connection_info = await connection_manager.get_connection(connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        connector = await connection_manager.get_connector(connection_id)
        if not connector:
            raise HTTPException(status_code=404, detail="Connection not active")
        
        # Read-only operation - don't block
        async with operation_lock.acquire_lock(connection_id, timeout=2.0, read_only=True):
            analytics_manager = AnalyticsManager(connector.connection)
            result = await analytics_manager.get_analytics(connection_info, connection_id)
        
        return result
    except RuntimeError as e:
        if "operation is in progress" in str(e):
            raise HTTPException(status_code=409, detail="Analytics temporarily unavailable. Please try again.")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Route error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connections/{connection_id}/history")
async def get_historical_data(connection_id: str, hours: int = Query(default=3, ge=1, le=3)):
    """Get historical analytics data."""
    try:
        connection_info = await connection_manager.get_connection(connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        connector = await connection_manager.get_connector(connection_id)
        if not connector:
            raise HTTPException(status_code=404, detail="Connection not active")
            
        analytics_manager = AnalyticsManager(connector.connection)
        history = analytics_manager.get_historical_data(connection_id, hours)
        
        return {"success": True, "history": history}
    except Exception as e:
        logger.error(f"Route error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/connections/{connection_id}/query-plan")
async def get_query_plan(connection_id: str, request: QueryPlanRequest):
    """Get query execution plan."""
    try:
        connection_info = await connection_manager.get_connection(connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        connector = await connection_manager.get_connector(connection_id)
        if not connector:
            raise HTTPException(status_code=404, detail="Connection not active")
            
        analytics_manager = AnalyticsManager(connector.connection)
        result = await analytics_manager.get_query_plan(request.query, connection_info)
        
        return result
    except Exception as e:
        logger.error(f"Route error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connections/{connection_id}/slow-queries")
async def get_slow_queries(connection_id: str, hours: int = Query(default=24, ge=1, le=24)):
    """Get slow query log."""
    try:
        connection_info = await connection_manager.get_connection(connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        connector = await connection_manager.get_connector(connection_id)
        if not connector:
            raise HTTPException(status_code=404, detail="Connection not active")
            
        analytics_manager = AnalyticsManager(connector.connection)
        slow_queries = analytics_manager.get_slow_query_log(connection_id, hours)
        
        return {"success": True, "slow_queries": slow_queries}
    except Exception as e:
        logger.error(f"Route error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connections/{connection_id}/table-stats")
async def get_table_stats(connection_id: str):
    """Get table-level statistics."""
    try:
        connection_info = await connection_manager.get_connection(connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        connector = await connection_manager.get_connector(connection_id)
        if not connector:
            raise HTTPException(status_code=404, detail="Connection not active")
            
        analytics_manager = AnalyticsManager(connector.connection)
        table_stats = await analytics_manager.get_table_statistics(connection_info)
        
        return {"success": True, "table_stats": table_stats}
    except Exception as e:
        logger.error(f"Route error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connections/{connection_id}/pool-stats")
async def get_pool_stats(connection_id: str):
    """Get connection pool statistics."""
    try:
        connection_info = await connection_manager.get_connection(connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        connector = await connection_manager.get_connector(connection_id)
        if not connector:
            raise HTTPException(status_code=404, detail="Connection not active")
            
        analytics_manager = AnalyticsManager(connector.connection)
        pool_stats = analytics_manager.get_connection_pool_stats()
        
        return {"success": True, "pool_stats": pool_stats}
    except Exception as e:
        logger.error(f"Route error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connections/{connection_id}/export-pdf")
async def export_pdf(connection_id: str):
    """Export analytics to PDF."""
    from operations.operation_lock import operation_lock
    
    try:
        connection_info = await connection_manager.get_connection(connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        connector = await connection_manager.get_connector(connection_id, auto_reconnect=False)
        if not connector:
            raise HTTPException(status_code=404, detail="Connection not active")
        
        # Use context manager with read-only flag
        async with operation_lock.acquire_lock(connection_id, timeout=5.0, read_only=True):
            analytics_manager = AnalyticsManager(connector.connection)
            
            pdf_bytes = await analytics_manager.export_to_pdf(
                connection_id,
                connection_info.name,
                connection_info
            )
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=analytics_{connection_info.name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
            }
        )
    except RuntimeError as e:
        if "operation is in progress" in str(e):
            raise HTTPException(status_code=409, detail="Another operation is in progress. Please try again in a few seconds.")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Route error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/connections/{connection_id}/kill")
async def kill_query(connection_id: str, request: KillQueryRequest):
    """Kill a running query."""
    try:
        connection_info = await connection_manager.get_connection(connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        connector = await connection_manager.get_connector(connection_id)
        if not connector:
            raise HTTPException(status_code=404, detail="Connection not active")
            
        analytics_manager = AnalyticsManager(connector.connection)
        result = await analytics_manager.kill_query(request.pid, connection_info)
        
        return result
    except Exception as e:
        logger.error(f"Route error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
