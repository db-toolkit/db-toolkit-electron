"""Production-ready query execution engine."""

import time
import asyncio
import hashlib
from typing import Dict, Any, Optional
from core.models import DatabaseConnection
from operations.connection_manager import connection_manager
from utils.cache import query_cache, prepared_cache
from utils.logger import logger


class QueryValidationCache:
    """Cache for query validation results to reduce CPU overhead."""
    
    def __init__(self, max_size: int = 1000):
        """Initialize validation cache."""
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.access_times: Dict[str, float] = {}
        self.max_size = max_size
    
    def _generate_key(self, query: str, db_type: str) -> str:
        """Generate cache key for query validation."""
        query_normalized = ' '.join(query.upper().strip().split())
        key_string = f"{db_type}:{query_normalized}"
        return hashlib.md5(key_string.encode()).hexdigest()[:16]
    
    def _evict_lru(self) -> None:
        """Evict least recently used entries."""
        if len(self.cache) >= self.max_size:
            # Remove 20% of oldest entries
            sorted_keys = sorted(self.access_times.items(), key=lambda x: x[1])
            keys_to_remove = [k for k, _ in sorted_keys[:self.max_size // 5]]
            for key in keys_to_remove:
                self.cache.pop(key, None)
                self.access_times.pop(key, None)
    
    def get_validation(self, query: str, db_type: str) -> Optional[Dict[str, Any]]:
        """Get cached validation result."""
        key = self._generate_key(query, db_type)
        
        if key not in self.cache:
            return None
        
        # Update access time
        self.access_times[key] = time.time()
        return self.cache[key]
    
    def set_validation(self, query: str, db_type: str, result: Dict[str, Any]) -> None:
        """Cache validation result."""
        key = self._generate_key(query, db_type)
        
        self._evict_lru()
        
        self.cache[key] = result
        self.access_times[key] = time.time()
    
    def clear(self) -> None:
        """Clear validation cache."""
        self.cache.clear()
        self.access_times.clear()


validation_cache = QueryValidationCache()


class QueryExecutor:
    """Handles safe query execution with timeout and pagination."""
    
    def __init__(self, default_timeout: int = 30, default_limit: int = 1000):
        """Initialize query executor."""
        self.default_timeout = default_timeout
        self.default_limit = default_limit
    
    async def execute_query(
        self,
        connection: DatabaseConnection,
        query: str,
        limit: Optional[int] = None,
        offset: int = 0,
        timeout: Optional[int] = None
    ) -> Dict[str, Any]:
        """Execute query with safety checks and pagination."""
        if not query or not query.strip():
            return {
                "success": False,
                "error": "Query cannot be empty",
                "columns": [],
                "rows": [],
                "total_rows": 0,
                "execution_time": 0.0
            }
        
        query = query.strip()
        limit = limit or self.default_limit
        timeout = timeout or self.default_timeout
        
        # Validate query safety with caching
        validation_result = self._validate_query_cached(query, connection.db_type.value)
        if not validation_result["safe"]:
            return {
                "success": False,
                "error": validation_result["error"],
                "columns": [],
                "rows": [],
                "total_rows": 0,
                "execution_time": 0.0
            }
        
        # Check query cache first (only for SELECT queries)
        if query.strip().upper().startswith('SELECT'):
            cached_result = query_cache.get_query_result(connection.id, query)
            if cached_result:
                return cached_result
        
        start_time = time.time()
        
        try:
            # Get existing connector from connection manager
            connector = await connection_manager.get_connector(connection.id)
            if not connector:
                # Try to establish connection if not exists
                success = await connection_manager.connect(connection, timeout)
                if not success:
                    raise Exception("Failed to establish database connection")
                connector = await connection_manager.get_connector(connection.id)
                if not connector:
                    raise Exception("Connection manager failed to provide connector")
            
            # Add pagination for SQL queries
            paginated_query = self._add_pagination(query, connection.db_type.value, limit, offset)
            
            # Get prepared statement (placeholder for future optimization)
            prepared_query = prepared_cache.get_prepared_query(
                connection.id, paginated_query, connection.db_type.value
            )
            
            # Execute with timeout
            result = await asyncio.wait_for(
                connector.execute_query(prepared_query),
                timeout=timeout
            )
            
            execution_time = time.time() - start_time
            
            if result.get("success"):
                formatted_result = {
                    "success": True,
                    "columns": result.get("columns", []),
                    "rows": result.get("data", []),
                    "total_rows": result.get("row_count", 0),
                    "execution_time": round(execution_time, 3),
                    "has_more": result.get("row_count", 0) >= limit
                }
                
                # Cache successful SELECT queries
                if query.strip().upper().startswith('SELECT'):
                    query_cache.set_query_result(connection.id, query, formatted_result)
                
                # Record query activity for adaptive scheduling
                from operations.background_tasks import record_query_activity
                record_query_activity()
                
                return formatted_result
            else:
                return {
                    "success": False,
                    "error": result.get("error", "Unknown error"),
                    "columns": [],
                    "rows": [],
                    "total_rows": 0,
                    "execution_time": round(execution_time, 3)
                }
                
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Query execution failed on '{connection.name}': {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "columns": [],
                "rows": [],
                "total_rows": 0,
                "execution_time": round(execution_time, 3)
            }
    
    def _validate_query(self, query: str, db_type: str) -> Dict[str, Any]:
        """Validate query for safety."""
        query_upper = query.upper().strip()
        
        # Block dangerous operations
        dangerous_keywords = [
            "DROP DATABASE",
            "DROP SCHEMA",
            "TRUNCATE",
            "DELETE FROM" if "WHERE" not in query_upper else None,
            "UPDATE" if "WHERE" not in query_upper else None,
        ]
        
        for keyword in dangerous_keywords:
            if keyword and keyword in query_upper:
                return {
                    "safe": False,
                    "error": f"Dangerous operation detected: {keyword}. Use with caution."
                }
        
        # MongoDB specific validation
        if db_type == "mongodb":
            if not (query.startswith("{") or query.startswith("db.")):
                return {
                    "safe": False,
                    "error": "MongoDB query must be valid JSON or db.collection syntax"
                }
        
        return {"safe": True}
    
    def _add_pagination(self, query: str, db_type: str, limit: int, offset: int) -> str:
        """Add pagination to query if not present."""
        query_upper = query.upper().strip()
        
        if db_type == "mongodb":
            return query  # MongoDB pagination handled in connector
        
        # Check if LIMIT already exists
        if "LIMIT" in query_upper:
            return query
        
        # Add LIMIT and OFFSET
        if db_type == "sqlite":
            return f"{query} LIMIT {limit} OFFSET {offset}"
        elif db_type in ["postgresql", "mysql"]:
            return f"{query} LIMIT {limit} OFFSET {offset}"
        
        return query
    
    def _validate_query_cached(self, query: str, db_type: str) -> Dict[str, Any]:
        """Validate query with caching to reduce CPU overhead."""
        # Check cache first
        cached_result = validation_cache.get_validation(query, db_type)
        if cached_result:
            return cached_result
        
        # Perform validation
        result = self._validate_query(query, db_type)
        
        # Cache the result
        validation_cache.set_validation(query, db_type, result)
        
        return result