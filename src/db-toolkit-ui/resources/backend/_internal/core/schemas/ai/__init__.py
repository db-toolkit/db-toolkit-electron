"""AI schemas package for DBAssist."""

from .query_schemas import (
    GenerateQueryRequest, GenerateQueryResponse,
    OptimizeQueryRequest, OptimizeQueryResponse,
    ExplainQueryRequest, ExplainQueryResponse,
    FixQueryRequest, FixQueryResponse,
    QueryCompletionRequest, QueryCompletionResponse
)
from .schema_schemas import SchemaAnalysisRequest, SchemaAnalysisResponse

__all__ = [
    'GenerateQueryRequest',
    'GenerateQueryResponse',
    'OptimizeQueryRequest', 
    'OptimizeQueryResponse',
    'ExplainQueryRequest',
    'ExplainQueryResponse',
    'FixQueryRequest',
    'FixQueryResponse',
    'QueryCompletionRequest',
    'QueryCompletionResponse',
    'SchemaAnalysisRequest',
    'SchemaAnalysisResponse'
]