"""Pydantic schemas for AI schema analysis operations."""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field


class SchemaAnalysisRequest(BaseModel):
    """Request for schema analysis."""
    connection_id: str = Field(..., description="Database connection ID")
    table_name: str = Field(..., description="Table name to analyze")
    columns: List[Dict[str, Any]] = Field(..., description="Table columns information")
    db_type: str = Field(default="postgresql", description="Database type")


class IndexSuggestionRequest(BaseModel):
    """Request for index suggestions."""
    connection_id: str = Field(..., description="Database connection ID")
    table_name: str = Field(..., description="Table name")
    columns: List[Dict[str, Any]] = Field(..., description="Table columns")
    query_patterns: Optional[List[str]] = Field(default=None, description="Common query patterns")
    db_type: str = Field(default="postgresql", description="Database type")


class RelationshipAnalysisRequest(BaseModel):
    """Request for relationship analysis."""
    connection_id: str = Field(..., description="Database connection ID")
    tables: Dict[str, List[Dict[str, Any]]] = Field(..., description="All tables with columns")
    db_type: str = Field(default="postgresql", description="Database type")


class CommonQueriesRequest(BaseModel):
    """Request for common queries generation."""
    connection_id: str = Field(..., description="Database connection ID")
    table_name: str = Field(..., description="Table name")
    columns: List[Dict[str, Any]] = Field(..., description="Table columns")
    db_type: str = Field(default="postgresql", description="Database type")


# Response Models
class SchemaAnalysisResponse(BaseModel):
    """Response for schema analysis."""
    success: bool = Field(..., description="Whether operation was successful")
    error: Optional[str] = Field(default=None, description="Error message if failed")
    table_name: Optional[str] = Field(default=None, description="Analyzed table name")
    summary: Optional[str] = Field(default=None, description="AI-generated table summary")
    purpose: Optional[str] = Field(default=None, description="Table purpose")
    suggestions: List[str] = Field(default=[], description="General suggestions")
    common_queries: List[Dict[str, str]] = Field(default=[], description="Common query suggestions")
    index_recommendations: List[Dict[str, Any]] = Field(default=[], description="Index recommendations")
    relationship_suggestions: List[Dict[str, Any]] = Field(default=[], description="Relationship suggestions")


class IndexSuggestion(BaseModel):
    """Single index suggestion."""
    type: str = Field(..., description="Index type (btree, hash, etc.)")
    columns: List[str] = Field(..., description="Columns to index")
    reason: str = Field(..., description="Reason for suggestion")
    estimated_benefit: Optional[str] = Field(default=None, description="Estimated performance benefit")


class IndexSuggestionResponse(BaseModel):
    """Response for index suggestions."""
    success: bool = Field(..., description="Whether operation was successful")
    error: Optional[str] = Field(default=None, description="Error message if failed")
    table_name: Optional[str] = Field(default=None, description="Table name")
    index_suggestions: List[IndexSuggestion] = Field(default=[], description="Index suggestions")
    performance_impact: Optional[str] = Field(default=None, description="Overall performance impact")


class Relationship(BaseModel):
    """Database relationship suggestion."""
    from_table: str = Field(..., description="Source table")
    from_column: str = Field(..., description="Source column")
    to_table: str = Field(..., description="Target table")
    to_column: str = Field(..., description="Target column")
    relationship_type: str = Field(..., description="Type of relationship")
    confidence: str = Field(..., description="AI confidence level")


class RelationshipAnalysisResponse(BaseModel):
    """Response for relationship analysis."""
    success: bool = Field(..., description="Whether operation was successful")
    error: Optional[str] = Field(default=None, description="Error message if failed")
    relationships: List[Relationship] = Field(default=[], description="Suggested relationships")
    total_suggestions: int = Field(default=0, description="Total number of suggestions")


class CommonQuery(BaseModel):
    """Common query suggestion."""
    name: str = Field(..., description="Query name/title")
    query: str = Field(..., description="SQL query")
    description: str = Field(..., description="Query description")
    category: Optional[str] = Field(default=None, description="Query category")


class CommonQueriesResponse(BaseModel):
    """Response for common queries."""
    success: bool = Field(..., description="Whether operation was successful")
    error: Optional[str] = Field(default=None, description="Error message if failed")
    table_name: Optional[str] = Field(default=None, description="Table name")
    queries: List[CommonQuery] = Field(default=[], description="Common query suggestions")
    total_generated: int = Field(default=0, description="Total queries generated")