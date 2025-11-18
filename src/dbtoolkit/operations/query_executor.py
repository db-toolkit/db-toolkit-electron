"""Query execution engine."""

import time
import asyncio
from typing import Optional, List, Dict, Any
from ..core.models import DatabaseConnection
from ..core.query import QueryResult, QueryType, detect_query_type
from ..connectors.factory import ConnectorFactory
from ..utils.constants import DEFAULT_QUERY_TIMEOUT, MAX_RESULT_ROWS


class QueryExecutor:
    """Executes queries against database connections."""
    
    def __init__(self, connection: DatabaseConnection):
        """Initialize query executor."""
        self.connection = connection
        self.connector = ConnectorFactory.create_connector(connection)
        self._connected = False
    
    async def connect(self) -> bool:
        """Connect to database."""
        if not self._connected:
            self._connected = await self.connector.connect()
        return self._connected
    
    async def disconnect(self) -> None:
        """Disconnect from database."""
        if self._connected:
            await self.connector.disconnect()
            self._connected = False
    
    async def execute_query(self, query: str, timeout: int = DEFAULT_QUERY_TIMEOUT, 
                           limit: Optional[int] = None) -> QueryResult:
        """Execute query and return results."""
        start_time = time.time()
        
        try:
            # Ensure connection
            if not await self.connect():
                return QueryResult.error_result("Failed to connect to database")
            
            # Detect query type
            query_type = detect_query_type(query)
            
            # Apply result limit for SELECT queries
            if limit is None and detect_query_type(query) == QueryType.SELECT:
                limit = MAX_RESULT_ROWS
            
            # Execute with timeout
            try:
                data = await asyncio.wait_for(
                    self.connector.execute_query(query),
                    timeout=timeout
                )
                
                # Apply limit if specified
                if limit and len(data) > limit:
                    data = data[:limit]
                
                execution_time = time.time() - start_time
                return QueryResult.success_result(data, execution_time, query_type)
                
            except asyncio.TimeoutError:
                execution_time = time.time() - start_time
                return QueryResult.error_result(
                    f"Query timeout after {timeout} seconds",
                    execution_time
                )
        
        except Exception as e:
            execution_time = time.time() - start_time
            return QueryResult.error_result(str(e), execution_time)
    
    async def execute_batch(self, queries: List[str]) -> List[QueryResult]:
        """Execute multiple queries in sequence."""
        results = []
        
        for query in queries:
            result = await self.execute_query(query)
            results.append(result)
            
            # Stop on first error
            if not result.success:
                break
        
        return results
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        asyncio.create_task(self.disconnect())