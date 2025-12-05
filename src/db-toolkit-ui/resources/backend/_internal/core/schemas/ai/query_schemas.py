"""Pydantic schemas for AI query operations."""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    """Base request for query operations."""
    connection_id: str = Field(..., description="Database connection ID")
    db_type: str = Field(default="postgresql", description="Database type")
    schema_context: Optional[Dict[str, Any]] = Field(default=None, description="Schema context for AI")


class GenerateQueryRequest(QueryRequest):
    """Request to generate SQL from natural language."""
    natural_language: str = Field(..., description="Natural language query description")


class OptimizeQueryRequest(QueryRequest):
    """Request to optimize an SQL query."""
    query: str = Field(..., description="SQL query to optimize")
    execution_plan: Optional[Dict[str, Any]] = Field(default=None, description="Query execution plan")


class ExplainQueryRequest(QueryRequest):
    """Request to explain an SQL query."""
    query: str = Field(..., description="SQL query to explain")


class FixQueryRequest(QueryRequest):
    """Request to fix an SQL query error."""
    query: str = Field(..., description="SQL query with error")
    error_message: str = Field(..., description="Error message from database")


class QueryCompletionRequest(QueryRequest):
    """Request for query auto-completion."""
    partial_query: str = Field(..., description="Partial SQL query")
    cursor_position: int = Field(..., description="Cursor position in query")


# Response Models
class QueryResponse(BaseModel):
    """Base response for query operations."""
    success: bool = Field(..., description="Whether operation was successful")
    error: Optional[str] = Field(default=None, description="Error message if failed")


class GenerateQueryResponse(QueryResponse):
    """Response for query generation."""
    sql: Optional[str] = Field(default=None, description="Generated SQL query")
    explanation: Optional[str] = Field(default=None, description="Explanation of the query")
    confidence: Optional[str] = Field(default=None, description="AI confidence level")


class OptimizeQueryResponse(QueryResponse):
    """Response for query optimization."""
    suggestions: List[str] = Field(default=[], description="Optimization suggestions")
    optimized_query: Optional[str] = Field(default=None, description="Optimized SQL query")
    performance_assessment: Optional[str] = Field(default=None, description="Performance assessment")
    improvements: List[str] = Field(default=[], description="List of improvements made")


class ExplainQueryResponse(QueryResponse):
    """Response for query explanation."""
    explanation: Optional[str] = Field(default=None, description="Plain English explanation")
    complexity: Optional[str] = Field(default=None, description="Query complexity level")


class FixQueryResponse(QueryResponse):
    """Response for query error fixing."""
    explanation: Optional[str] = Field(default=None, description="Error explanation")
    fixed_query: Optional[str] = Field(default=None, description="Fixed SQL query")
    error_type: Optional[str] = Field(default=None, description="Type of error")


class CompletionSuggestion(BaseModel):
    """Single completion suggestion."""
    text: str = Field(..., description="Suggestion text")
    type: str = Field(..., description="Suggestion type (keyword, table, column, etc.)")
    description: Optional[str] = Field(default=None, description="Description of suggestion")


class QueryCompletionResponse(QueryResponse):
    """Response for query completion."""
    suggestions: List[CompletionSuggestion] = Field(default=[], description="Completion suggestions")
    context: Optional[str] = Field(default=None, description="Context information")