"""Connection management routes."""

from typing import List
from fastapi import APIRouter, HTTPException

from core.storage import ConnectionStorage
from core.models import DatabaseConnection
from core.schemas import ConnectionRequest

router = APIRouter()
storage = ConnectionStorage()


@router.get("/connections", response_model=List[DatabaseConnection])
async def get_connections():
    """Get all connections."""
    return await storage.get_all_connections()


@router.post("/connections", response_model=DatabaseConnection)
async def create_connection(request: ConnectionRequest):
    """Create new connection."""
    try:
        return await storage.add_connection(**request.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/connections/{connection_id}", response_model=DatabaseConnection)
async def update_connection(connection_id: str, request: ConnectionRequest):
    """Update connection."""
    connection = await storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    try:
        updated = await storage.update_connection(connection_id, **request.model_dump())
        return updated
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/connections/{connection_id}")
async def delete_connection(connection_id: str):
    """Delete connection."""
    if await storage.remove_connection(connection_id):
        return {"success": True}
    raise HTTPException(status_code=404, detail="Connection not found")


@router.post("/connections/{connection_id}/test")
async def test_connection(connection_id: str):
    """Test database connection."""
    from utils.validation import validate_connection
    
    connection = await storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    result = await validate_connection(connection)
    return result


@router.post("/connections/{connection_id}/connect")
async def connect_to_database(connection_id: str):
    """Connect to database."""
    from operations.connection_manager import connection_manager
    
    connection = await storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    success = await connection_manager.connect(connection)
    
    if success:
        return {"success": True, "message": "Connected successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to connect. Please check your credentials and database server.")


@router.post("/connections/{connection_id}/disconnect")
async def disconnect_from_database(connection_id: str):
    """Disconnect from database."""
    from operations.connection_manager import connection_manager
    
    success = await connection_manager.disconnect(connection_id)
    
    return {"success": success, "message": "Disconnected" if success else "Not connected"}


