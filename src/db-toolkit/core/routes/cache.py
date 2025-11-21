"""Cache management routes."""

from fastapi import APIRouter
from utils.cache import schema_cache, query_cache, prepared_cache
from operations.background_tasks import get_scheduler_stats

router = APIRouter()


@router.get("/cache/stats")
async def get_cache_stats():
    """Get cache statistics."""
    return {
        "success": True,
        "schema_cache": {
            "entries": len(schema_cache.get_keys()),
            "keys": schema_cache.get_keys()
        },
        "query_cache": query_cache.get_stats(),
        "prepared_cache": {
            "connections": len(prepared_cache.statements),
            "total_statements": sum(len(stmts) for stmts in prepared_cache.statements.values())
        }
    }


@router.post("/cache/clear")
async def clear_all_caches():
    """Clear all caches."""
    schema_cache.clear()
    query_cache.clear()
    
    # Clear prepared statements
    prepared_cache.statements.clear()
    
    return {"success": True, "message": "All caches cleared"}


@router.post("/cache/cleanup")
async def cleanup_expired_cache():
    """Clean up expired cache entries."""
    schema_expired = schema_cache.cleanup_expired()
    
    return {
        "success": True,
        "message": f"Cleaned up {schema_expired} expired schema entries",
        "schema_expired": schema_expired
    }


@router.post("/cache/connections/{connection_id}/clear")
async def clear_connection_cache(connection_id: str):
    """Clear cache for specific connection."""
    # Clear schema cache
    keys_removed = 0
    for key in schema_cache.get_keys():
        if key.startswith(f"{connection_id}_"):
            schema_cache.delete(key)
            keys_removed += 1
    
    # Clear query cache
    query_keys_removed = query_cache.invalidate_connection(connection_id)
    
    # Clear prepared statements
    prepared_cache.clear_connection(connection_id)
    
    return {
        "success": True,
        "message": f"Cleared cache for connection {connection_id}",
        "schema_keys_removed": keys_removed,
        "query_keys_removed": query_keys_removed
    }


@router.get("/scheduler/stats")
async def get_background_task_stats():
    """Get background task scheduler statistics."""
    return {
        "success": True,
        "scheduler": get_scheduler_stats()
    }