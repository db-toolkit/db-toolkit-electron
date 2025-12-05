"""Schema exploration routes."""

from fastapi import APIRouter, HTTPException
from core.storage import ConnectionStorage
from operations.schema_explorer import SchemaExplorer

router = APIRouter()
storage = ConnectionStorage()
explorer = SchemaExplorer()


@router.get("/connections/{connection_id}/schema")
async def get_schema_tree(connection_id: str, use_cache: bool = True):
    """Get complete schema tree for connection."""
    connection = await storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    result = await explorer.get_schema_tree(connection, use_cache)
    return result


@router.get("/connections/{connection_id}/schema/{schema_name}/tables/{table_name}")
async def get_table_info(connection_id: str, schema_name: str, table_name: str):
    """Get detailed table information with sample data."""
    connection = await storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    result = await explorer.get_table_info(connection, schema_name, table_name)
    return result


@router.post("/connections/{connection_id}/schema/refresh")
async def refresh_schema(connection_id: str):
    """Refresh cached schema for connection."""
    connection = await storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    await explorer.refresh_schema(connection_id)
    
    # Also clear query cache for this connection
    from utils.cache import query_cache
    query_cache.invalidate_connection(connection_id)
    
    return {"success": True, "message": "Schema and query cache refreshed"}


@router.get("/cache/schemas")
async def get_cached_schemas():
    """Get list of cached schema keys."""
    keys = explorer.get_cached_schemas()
    return {"cached_schemas": keys}


