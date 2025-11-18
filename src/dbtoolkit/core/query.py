"""Query execution models and utilities."""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum


class QueryType(Enum):
    """Types of queries."""
    SELECT = "select"
    INSERT = "insert"
    UPDATE = "update"
    DELETE = "delete"
    DDL = "ddl"
    UNKNOWN = "unknown"


@dataclass
class QueryResult:
    """Query execution result."""
    
    success: bool
    data: List[Dict[str, Any]]
    columns: List[str]
    row_count: int
    execution_time: float
    error_message: Optional[str] = None
    query_type: QueryType = QueryType.UNKNOWN
    
    @classmethod
    def success_result(cls, data: List[Dict[str, Any]], execution_time: float, 
                      query_type: QueryType = QueryType.SELECT) -> 'QueryResult':
        """Create successful query result."""
        columns = list(data[0].keys()) if data else []
        return cls(
            success=True,
            data=data,
            columns=columns,
            row_count=len(data),
            execution_time=execution_time,
            query_type=query_type
        )
    
    @classmethod
    def error_result(cls, error_message: str, execution_time: float = 0.0) -> 'QueryResult':
        """Create error query result."""
        return cls(
            success=False,
            data=[],
            columns=[],
            row_count=0,
            execution_time=execution_time,
            error_message=error_message
        )


@dataclass
class QueryHistoryItem:
    """Query history entry."""
    
    id: str
    connection_id: str
    query: str
    timestamp: datetime
    execution_time: float
    success: bool
    row_count: int
    error_message: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'id': self.id,
            'connection_id': self.connection_id,
            'query': self.query,
            'timestamp': self.timestamp.isoformat(),
            'execution_time': self.execution_time,
            'success': self.success,
            'row_count': self.row_count,
            'error_message': self.error_message
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'QueryHistoryItem':
        """Create from dictionary."""
        return cls(
            id=data['id'],
            connection_id=data['connection_id'],
            query=data['query'],
            timestamp=datetime.fromisoformat(data['timestamp']),
            execution_time=data['execution_time'],
            success=data['success'],
            row_count=data['row_count'],
            error_message=data.get('error_message')
        )


def detect_query_type(query: str) -> QueryType:
    """Detect query type from SQL string."""
    query_lower = query.strip().lower()
    
    if query_lower.startswith('select'):
        return QueryType.SELECT
    elif query_lower.startswith(('insert', 'replace')):
        return QueryType.INSERT
    elif query_lower.startswith('update'):
        return QueryType.UPDATE
    elif query_lower.startswith('delete'):
        return QueryType.DELETE
    elif query_lower.startswith(('create', 'drop', 'alter', 'truncate')):
        return QueryType.DDL
    else:
        return QueryType.UNKNOWN