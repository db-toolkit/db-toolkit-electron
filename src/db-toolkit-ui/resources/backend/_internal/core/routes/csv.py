"""CSV import/export routes."""

from utils.logger import logger
from fastapi import APIRouter, HTTPException

from core.schemas import (
    ExportCSVRequest,
    ExportCSVResponse,
    ImportCSVRequest,
    ImportCSVResponse,
    ValidateCSVRequest,
    ValidateCSVResponse,
)
from operations.connection_manager import connection_manager
from operations.csv_handler import CSVHandler

router = APIRouter(prefix="/csv", tags=["CSV"])


@router.post("/export", response_model=ExportCSVResponse)
async def export_csv(request: ExportCSVRequest):
    """Export table or query results to CSV."""
    connector = await connection_manager.get_connector(request.connection_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connection not found")

    try:
        csv_content = await CSVHandler.export_to_csv(
            connector=connector,
            table=request.table,
            schema=request.schema_name,
            query=request.query,
            delimiter=request.delimiter,
            include_headers=request.include_headers,
        )

        row_count = len(csv_content.split("\n")) - 2 if csv_content else 0

        return ExportCSVResponse(csv_content=csv_content, row_count=row_count)

    except Exception as e:
        logger.error(f"Route error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate", response_model=ValidateCSVResponse)
async def validate_csv(request: ValidateCSVRequest):
    """Validate CSV data before import."""
    try:
        rows, errors = CSVHandler.validate_csv_data(
            csv_content=request.csv_content, column_mapping=request.column_mapping
        )

        return ValidateCSVResponse(
            valid=len(errors) == 0, row_count=len(rows), errors=errors
        )

    except Exception as e:
        logger.error(f"Route error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import", response_model=ImportCSVResponse)
async def import_csv(request: ImportCSVRequest):
    """Import CSV data into database table."""
    connector = await connection_manager.get_connector(request.connection_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connection not found")

    try:
        rows, errors = CSVHandler.validate_csv_data(
            csv_content=request.csv_content, column_mapping=request.column_mapping
        )

        if errors:
            return ImportCSVResponse(
                success=False,
                imported=0,
                failed=len(rows),
                errors=errors,
                total_errors=len(errors),
            )

        result = await CSVHandler.import_from_csv(
            connector=connector,
            table=request.table,
            rows=rows,
            schema=request.schema_name,
            batch_size=request.batch_size,
        )

        return ImportCSVResponse(**result)

    except Exception as e:
        logger.error(f"Route error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
