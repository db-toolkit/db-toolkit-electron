"""Data editing routes."""

from fastapi import APIRouter, HTTPException
from core.storage import ConnectionStorage
from core.schemas import UpdateRowRequest, InsertRowRequest, DeleteRowRequest
from operations.data_editor import DataEditor
from utils.logger import logger

router = APIRouter()
storage = ConnectionStorage()
editor = DataEditor()


@router.put("/connections/{connection_id}/data/row")
async def update_row(connection_id: str, request: UpdateRowRequest):
    """Update a table row."""
    from operations.operation_lock import operation_lock
    
    logger.info(f"Update row request - table: {request.table}, schema: {request.schema_name}, pk: {request.primary_key}, changes: {request.changes}")

    connection = await storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    if operation_lock.is_locked(connection_id):
        raise HTTPException(
            status_code=409, detail="Connection is busy with another operation"
        )

    lock = operation_lock.get_lock(connection_id)
    async with lock:
        result = await editor.update_row(
            connection=connection,
            table=request.table,
            schema_name=request.schema_name,
            primary_key=request.primary_key,
            changes=request.changes,
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])

        return result


@router.post("/connections/{connection_id}/data/row")
async def insert_row(connection_id: str, request: InsertRowRequest):
    """Insert a new table row."""
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
        result = await editor.insert_row(
            connection=connection,
            table=request.table,
            schema_name=request.schema_name,
            data=request.data,
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])

        return result


@router.delete("/connections/{connection_id}/data/row")
async def delete_row(connection_id: str, request: DeleteRowRequest):
    """Delete a table row."""
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
        result = await editor.delete_row(
            connection=connection,
            table=request.table,
            schema_name=request.schema_name,
            primary_key=request.primary_key,
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])

        return result