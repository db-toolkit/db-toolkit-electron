"""Data explorer routes for browsing table data."""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from core.storage import ConnectionStorage
from operations.data_explorer import DataExplorer

router = APIRouter()
storage = ConnectionStorage()
explorer = DataExplorer()


class DataBrowseRequest(BaseModel):
    """Data browse request."""
    schema_name: str
    table_name: str
    limit: int = 100
    offset: int = 0
    sort_column: Optional[str] = None
    sort_order: Optional[str] = "ASC"
    filters: Optional[dict] = None


@router.post("/connections/{connection_id}/data/browse")
async def browse_table_data(connection_id: str, request: DataBrowseRequest):
    """Browse table data with pagination, sorting, and filtering."""
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
        result = await explorer.browse_data(
            connection=connection,
            schema_name=request.schema_name,
            table_name=request.table_name,
            limit=request.limit,
            offset=request.offset,
            sort_column=request.sort_column,
            sort_order=request.sort_order,
            filters=request.filters,
        )
        return result


@router.get("/connections/{connection_id}/data/count")
async def get_table_row_count(
    connection_id: str,
    schema_name: str = Query(...),
    table_name: str = Query(...)
):
    """Get total row count for a table."""
    connection = await storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    count = await explorer.get_row_count(connection, schema_name, table_name)
    return {"success": True, "count": count}


@router.get("/connections/{connection_id}/data/relationships")
async def get_table_relationships(
    connection_id: str,
    schema_name: str = Query(...),
    table_name: str = Query(...)
):
    """Get foreign key relationships for a table."""
    connection = await storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    result = await explorer.get_table_relationships(connection, schema_name, table_name)
    return result


class CellDataRequest(BaseModel):
    """Cell data request."""
    schema_name: str
    table_name: str
    column_name: str
    row_identifier: dict


@router.post("/connections/{connection_id}/data/cell")
async def get_cell_data(connection_id: str, request: CellDataRequest):
    """Get full content of a specific cell."""
    connection = await storage.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    result = await explorer.get_cell_data(
        connection,
        request.schema_name,
        request.table_name,
        request.column_name,
        request.row_identifier
    )
    return result
