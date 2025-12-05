"""Query execution routes."""

from fastapi import APIRouter, HTTPException
from core.storage import ConnectionStorage
from core.schemas import QueryRequest, QueryResponse
from operations.query_executor import QueryExecutor
from operations.query_history import QueryHistory
from utils.logger import logger

router = APIRouter()
storage = ConnectionStorage()
executor = QueryExecutor()
history = QueryHistory()


@router.post("/connections/{connection_id}/query", response_model=QueryResponse)
async def execute_query(connection_id: str, request: QueryRequest):
    """Execute query on connection."""
    from operations.operation_lock import operation_lock

    connection = await storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    if operation_lock.is_locked(connection_id):
        raise HTTPException(
            status_code=409, detail="Connection is busy with another operation"
        )

    lock = operation_lock.get_lock(connection_id)
    async with lock:
        logger.info(f"Executing query on '{connection.name}': {request.query[:100]}...")
        result = await executor.execute_query(
            connection=connection,
            query=request.query,
            limit=request.limit,
            offset=request.offset,
            timeout=request.timeout,
        )
        
        if result["success"]:
            logger.info(f"Query executed successfully ({result['total_rows']} rows, {result['execution_time']:.2f}s)")
        else:
            logger.error(f"Query failed: {result.get('error', 'Unknown error')}")
    
        # Save to history
        history.add_query(
            connection_id=connection_id,
            query=request.query,
            success=result["success"],
            execution_time=result["execution_time"],
            row_count=result["total_rows"],
            error=result.get("error"),
        )

        return QueryResponse(**result)


@router.get("/connections/{connection_id}/query/history")
async def get_query_history(connection_id: str, limit: int = 50):
    """Get query history for connection."""
    connection = await storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    queries = history.get_history(connection_id, limit)
    return {"success": True, "history": queries, "count": len(queries)}


@router.delete("/connections/{connection_id}/query/history")
async def clear_query_history(connection_id: str):
    """Clear query history for connection."""
    connection = await storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    success = history.clear_history(connection_id)
    return {"success": success, "message": "History cleared" if success else "No history found"}


@router.get("/connections/{connection_id}/query/history/search")
async def search_query_history(connection_id: str, q: str):
    """Search query history."""
    connection = await storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    results = history.search_history(connection_id, q)
    return {"success": True, "results": results, "count": len(results)}


@router.post("/query/history/cleanup")
async def cleanup_query_history(retention_days: int = 30):
    """Cleanup old query history based on retention days."""
    logger.info(f"Cleaning up query history older than {retention_days} days")
    removed = history.cleanup_old_history(retention_days)
    logger.info(f"Removed {removed} old queries from history")
    return {"success": True, "removed_count": removed, "message": f"Removed {removed} old queries"}


