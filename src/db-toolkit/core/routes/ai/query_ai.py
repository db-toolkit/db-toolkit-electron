"""AI query assistance API routes."""

from fastapi import APIRouter, HTTPException
from operations.ai.query_assistant import query_assistant
from operations.connection_manager import connection_manager
from core.schemas.ai.query_schemas import (
    GenerateQueryRequest, GenerateQueryResponse,
    OptimizeQueryRequest, OptimizeQueryResponse,
    ExplainQueryRequest, ExplainQueryResponse,
    FixQueryRequest, FixQueryResponse,
    QueryCompletionRequest, QueryCompletionResponse
)

router = APIRouter(prefix="/ai/query")


@router.post("/generate", response_model=GenerateQueryResponse)
async def generate_query(request: GenerateQueryRequest):
    """Generate SQL query from natural language."""
    try:
        # Verify connection exists
        connection_info = await connection_manager.get_connection(request.connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        # Get database type from connection
        db_type = connection_info.db_type.value if hasattr(connection_info.db_type, 'value') else str(connection_info.db_type)
        
        result = await query_assistant.generate_from_natural_language(
            natural_language=request.natural_language,
            schema_context=request.schema_context or {},
            db_type=db_type
        )
        
        return GenerateQueryResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate query: {str(e)}")


@router.post("/optimize", response_model=OptimizeQueryResponse)
async def optimize_query(request: OptimizeQueryRequest):
    """Optimize SQL query for better performance."""
    try:
        # Verify connection exists
        connection_info = await connection_manager.get_connection(request.connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        # Get database type from connection
        db_type = connection_info.db_type.value if hasattr(connection_info.db_type, 'value') else str(connection_info.db_type)
        
        result = await query_assistant.optimize_query(
            query=request.query,
            execution_plan=request.execution_plan,
            db_type=db_type,
            schema_context=request.schema_context
        )
        
        return OptimizeQueryResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to optimize query: {str(e)}")


@router.post("/explain", response_model=ExplainQueryResponse)
async def explain_query(request: ExplainQueryRequest):
    """Explain what an SQL query does in plain English."""
    try:
        # Verify connection exists
        connection_info = await connection_manager.get_connection(request.connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        # Get database type from connection
        db_type = connection_info.db_type.value if hasattr(connection_info.db_type, 'value') else str(connection_info.db_type)
        
        result = await query_assistant.explain_query(
            query=request.query,
            db_type=db_type,
            schema_context=request.schema_context
        )
        
        return ExplainQueryResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to explain query: {str(e)}")


@router.post("/fix", response_model=FixQueryResponse)
async def fix_query_error(request: FixQueryRequest):
    """Fix SQL query errors with AI assistance."""
    try:
        # Verify connection exists
        connection_info = await connection_manager.get_connection(request.connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        # Get database type from connection
        db_type = connection_info.db_type.value if hasattr(connection_info.db_type, 'value') else str(connection_info.db_type)
        
        result = await query_assistant.fix_query_error(
            query=request.query,
            error_message=request.error_message,
            db_type=db_type,
            schema_context=request.schema_context
        )
        
        return FixQueryResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fix query: {str(e)}")


@router.post("/complete", response_model=QueryCompletionResponse)
async def complete_query(request: QueryCompletionRequest):
    """Provide query auto-completion suggestions."""
    try:
        # Verify connection exists
        connection_info = await connection_manager.get_connection(request.connection_id)
        if not connection_info:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        # Get database type from connection
        db_type = connection_info.db_type.value if hasattr(connection_info.db_type, 'value') else str(connection_info.db_type)
        
        result = await query_assistant.suggest_completion(
            partial_query=request.partial_query,
            cursor_position=request.cursor_position,
            schema_context=request.schema_context or {},
            db_type=db_type
        )
        
        return QueryCompletionResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to provide completions: {str(e)}")