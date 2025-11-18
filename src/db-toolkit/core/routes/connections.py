"""Connection management routes."""

from typing import List
from fastapi import APIRouter, HTTPException

from ..storage import ConnectionStorage
from ..models import DatabaseConnection
from ..schemas import ConnectionRequest

router = APIRouter()
storage = ConnectionStorage()


@router.get("/connections", response_model=List[DatabaseConnection])
def get_connections():
    """Get all connections."""
    return storage.get_all_connections()


@router.post("/connections", response_model=DatabaseConnection)
def create_connection(request: ConnectionRequest):
    """Create new connection."""
    try:
        return storage.add_connection(**request.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/connections/{connection_id}")
def delete_connection(connection_id: str):
    """Delete connection."""
    if storage.remove_connection(connection_id):
        return {"success": True}
    raise HTTPException(status_code=404, detail="Connection not found")


@router.post("/connections/{connection_id}/test")
async def test_connection(connection_id: str):
    """Test database connection."""
    from ...utils.validation import validate_connection
    
    connection = storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    result = await validate_connection(connection)
    return result


@router.post("/connections/{connection_id}/connect")
async def connect_to_database(connection_id: str):
    """Connect to database."""
    from ...operations.connection_manager import ConnectionManager
    
    connection = storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    manager = ConnectionManager()
    success = await manager.connect(connection)
    
    if success:
        return {"success": True, "message": "Connected successfully"}
    else:
        return {"success": False, "message": "Connection failed"}


@router.post("/connections/{connection_id}/disconnect")
async def disconnect_from_database(connection_id: str):
    """Disconnect from database."""
    from ...operations.connection_manager import ConnectionManager
    
    manager = ConnectionManager()
    success = await manager.disconnect(connection_id)
    
    return {"success": success, "message": "Disconnected" if success else "Not connected"}


@router.get("/connections/{connection_id}/schema")
async def get_connection_schema(connection_id: str):
    """Get database schema for connection."""
    from ...connectors.factory import ConnectorFactory
    
    connection = storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    try:
        connector = ConnectorFactory.create_connector(connection.db_type)
        await connector.connect(connection)
        
        schemas = await connector.get_schemas()
        schema_data = {}
        
        for schema in schemas:
            tables = await connector.get_tables(schema)
            schema_data[schema] = {}
            
            for table in tables:
                columns = await connector.get_columns(table, schema)
                schema_data[schema][table] = columns
        
        await connector.disconnect()
        return {"success": True, "schema": schema_data}
        
    except Exception as e:
        return {"success": False, "error": str(e)}