"""AI schema analysis API routes."""

from fastapi import APIRouter, HTTPException
from operations.ai.schema_analyzer import schema_analyzer
from operations.connection_manager import connection_manager
from core.schemas.ai.schema_schemas import (
    SchemaAnalysisRequest, SchemaAnalysisResponse,
    IndexSuggestionRequest, IndexSuggestionResponse,
    RelationshipAnalysisRequest, RelationshipAnalysisResponse,
    CommonQueriesRequest, CommonQueriesResponse
)

router = APIRouter(prefix="/ai/schema")


@router.post("/analyze", response_model=SchemaAnalysisResponse)
async def analyze_table(request: SchemaAnalysisRequest):
    """Analyze a database table and provide AI insights."""
    try:
        # Verify connection exists
        connection_info = await connection_manager.get_connection(request.connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        # Get database type from connection
        db_type = connection_info.db_type.value if hasattr(connection_info.db_type, 'value') else str(connection_info.db_type)
        
        result = await schema_analyzer.analyze_table(
            table_name=request.table_name,
            columns=request.columns,
            db_type=db_type
        )
        
        return SchemaAnalysisResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze table: {str(e)}")


@router.post("/indexes", response_model=IndexSuggestionResponse)
async def suggest_indexes(request: IndexSuggestionRequest):
    """Suggest database indexes for better performance."""
    try:
        # Verify connection exists
        connection_info = await connection_manager.get_connection(request.connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        # Get database type from connection
        db_type = connection_info.db_type.value if hasattr(connection_info.db_type, 'value') else str(connection_info.db_type)
        
        result = await schema_analyzer.suggest_indexes(
            table_name=request.table_name,
            columns=request.columns,
            query_patterns=request.query_patterns,
            db_type=db_type
        )
        
        return IndexSuggestionResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to suggest indexes: {str(e)}")


@router.post("/relationships", response_model=RelationshipAnalysisResponse)
async def analyze_relationships(request: RelationshipAnalysisRequest):
    """Analyze potential relationships between database tables."""
    try:
        # Verify connection exists
        connection_info = await connection_manager.get_connection(request.connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        # Get database type from connection
        db_type = connection_info.db_type.value if hasattr(connection_info.db_type, 'value') else str(connection_info.db_type)
        
        result = await schema_analyzer.analyze_relationships(
            tables=request.tables,
            db_type=db_type
        )
        
        return RelationshipAnalysisResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze relationships: {str(e)}")


@router.post("/queries", response_model=CommonQueriesResponse)
async def generate_common_queries(request: CommonQueriesRequest):
    """Generate common SQL queries for a table."""
    try:
        # Verify connection exists
        connection_info = await connection_manager.get_connection(request.connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        # Get database type from connection
        db_type = connection_info.db_type.value if hasattr(connection_info.db_type, 'value') else str(connection_info.db_type)
        
        result = await schema_analyzer.generate_common_queries(
            table_name=request.table_name,
            columns=request.columns,
            db_type=db_type
        )
        
        return CommonQueriesResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate queries: {str(e)}")