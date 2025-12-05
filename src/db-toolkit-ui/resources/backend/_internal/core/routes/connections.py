"""Connection management routes."""

from typing import List
from fastapi import APIRouter, HTTPException

from core.storage import ConnectionStorage
from core.models import DatabaseConnection
from core.schemas import ConnectionRequest
from utils.logger import logger

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
        logger.info(f"Creating connection '{request.name}' ({request.db_type})")
        return await storage.add_connection(**request.model_dump())
    except Exception as e:
        logger.error(f"Failed to create connection '{request.name}': {str(e)}")
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
    logger.info(f"Deleting connection '{connection_id}'")
    if await storage.remove_connection(connection_id):
        return {"success": True}
    raise HTTPException(status_code=404, detail="Connection not found")


@router.post("/connections/test")
async def test_connection(request: ConnectionRequest):
    """Test database connection config without saving."""
    from utils.validation import validate_connection
    from core.models import DatabaseType
    
    # Create temporary connection object for testing
    temp_connection = DatabaseConnection(
        id="temp",
        name=request.name,
        db_type=DatabaseType(request.db_type),
        host=request.host,
        port=request.port,
        database=request.database,
        username=request.username,
        password=request.password
    )
    
    result = await validate_connection(temp_connection)
    return result


@router.post("/connections/{connection_id}/connect")
async def connect_to_database(connection_id: str):
    """Connect to database."""
    from operations.connection_manager import connection_manager
    
    connection = await storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    logger.info(f"Connecting to database '{connection.name}'")
    success = await connection_manager.connect(connection)
    
    if success:
        logger.info(f"Successfully connected to '{connection.name}'")
        return {"success": True, "message": "Connected successfully"}
    else:
        logger.error(f"Failed to connect to '{connection.name}'")
        raise HTTPException(status_code=400, detail="Failed to connect. Please check your credentials and database server.")


@router.post("/connections/{connection_id}/disconnect")
async def disconnect_from_database(connection_id: str):
    """Disconnect from database."""
    from operations.connection_manager import connection_manager
    
    success = await connection_manager.disconnect(connection_id)
    
    return {"success": success, "message": "Disconnected" if success else "Not connected"}


