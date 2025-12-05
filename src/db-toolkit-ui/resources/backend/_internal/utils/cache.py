"""Caching utilities for database metadata and query results."""

import time
import hashlib
from typing import Dict, Any, Optional, List


class SchemaCache:
    """In-memory cache for database schema metadata."""
    
    def __init__(self, default_ttl: int = 300):
        """Initialize cache with default TTL (5 minutes)."""
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set cache value with TTL."""
        expiry = time.time() + (ttl or self.default_ttl)
        self.cache[key] = {
            "value": value,
            "expiry": expiry
        }
    
    def get(self, key: str) -> Optional[Any]:
        """Get cache value if not expired."""
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        if time.time() > entry["expiry"]:
            del self.cache[key]
            return None
        
        return entry["value"]
    
    def delete(self, key: str) -> bool:
        """Delete cache entry."""
        if key in self.cache:
            del self.cache[key]
            return True
        return False
    
    def clear(self) -> None:
        """Clear all cache entries."""
        self.cache.clear()
    
    def get_keys(self) -> List[str]:
        """Get all cache keys."""
        return list(self.cache.keys())
    
    def cleanup_expired(self) -> int:
        """Remove expired entries and return count."""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self.cache.items()
            if current_time > entry["expiry"]
        ]
        
        for key in expired_keys:
            del self.cache[key]
        
        return len(expired_keys)


class QueryCache:
    """In-memory cache for query results and prepared statements."""
    
    def __init__(self, default_ttl: int = 600, max_size: int = 1000):
        """Initialize query cache with TTL (10 minutes) and size limit."""
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.access_times: Dict[str, float] = {}
        self.default_ttl = default_ttl
        self.max_size = max_size
    
    def _generate_key(self, connection_id: str, query: str, params: Optional[Dict] = None) -> str:
        """Generate cache key from connection, query and parameters."""
        query_normalized = ' '.join(query.strip().split())
        params_str = str(sorted(params.items())) if params else ''
        key_string = f"{connection_id}:{query_normalized}:{params_str}"
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def _evict_lru(self) -> None:
        """Evict least recently used entries when cache is full."""
        if len(self.cache) >= self.max_size:
            # Remove 20% of oldest entries
            sorted_keys = sorted(self.access_times.items(), key=lambda x: x[1])
            keys_to_remove = [k for k, _ in sorted_keys[:self.max_size // 5]]
            for key in keys_to_remove:
                self.cache.pop(key, None)
                self.access_times.pop(key, None)
    
    def set_query_result(
        self, 
        connection_id: str, 
        query: str, 
        result: Dict[str, Any], 
        ttl: Optional[int] = None,
        params: Optional[Dict] = None
    ) -> None:
        """Cache query result."""
        # Only cache successful SELECT queries
        if not result.get('success') or not query.strip().upper().startswith('SELECT'):
            return
        
        # Don't cache large result sets (>1000 rows)
        if len(result.get('rows', [])) > 1000:
            return
        
        key = self._generate_key(connection_id, query, params)
        expiry = time.time() + (ttl or self.default_ttl)
        
        self._evict_lru()
        
        self.cache[key] = {
            'result': result,
            'expiry': expiry,
            'query': query[:100]  # Store truncated query for debugging
        }
        self.access_times[key] = time.time()
    
    def get_query_result(
        self, 
        connection_id: str, 
        query: str, 
        params: Optional[Dict] = None
    ) -> Optional[Dict[str, Any]]:
        """Get cached query result."""
        key = self._generate_key(connection_id, query, params)
        
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        if time.time() > entry['expiry']:
            del self.cache[key]
            self.access_times.pop(key, None)
            return None
        
        # Update access time
        self.access_times[key] = time.time()
        return entry['result']
    
    def invalidate_connection(self, connection_id: str) -> int:
        """Invalidate all cached queries for a connection."""
        keys_to_remove = []
        for key in self.cache.keys():
            if key.startswith(f"{connection_id}:"):
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            self.cache.pop(key, None)
            self.access_times.pop(key, None)
        
        return len(keys_to_remove)
    
    def clear(self) -> None:
        """Clear all cached queries."""
        self.cache.clear()
        self.access_times.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            'total_entries': len(self.cache),
            'max_size': self.max_size,
            'hit_ratio': getattr(self, '_hits', 0) / max(getattr(self, '_requests', 1), 1),
            'memory_usage_mb': sum(len(str(entry)) for entry in self.cache.values()) / 1024 / 1024
        }


class PreparedStatementCache:
    """Cache for prepared statements by database type."""
    
    def __init__(self):
        """Initialize prepared statement cache."""
        self.statements: Dict[str, Dict[str, str]] = {}
    
    def get_prepared_query(self, connection_id: str, query: str, db_type: str) -> str:
        """Get or create prepared statement for query."""
        if connection_id not in self.statements:
            self.statements[connection_id] = {}
        
        query_hash = hashlib.md5(query.encode()).hexdigest()[:8]
        
        if query_hash not in self.statements[connection_id]:
            # Convert to prepared statement based on database type
            prepared_query = self._convert_to_prepared(query, db_type)
            self.statements[connection_id][query_hash] = prepared_query
        
        return self.statements[connection_id][query_hash]
    
    def _convert_to_prepared(self, query: str, db_type: str) -> str:
        """Convert query to prepared statement format."""
        # For now, return original query - prepared statements need connector-specific implementation
        # This is a placeholder for future prepared statement optimization
        return query
    
    def clear_connection(self, connection_id: str) -> None:
        """Clear prepared statements for connection."""
        self.statements.pop(connection_id, None)


# Global cache instances
schema_cache = SchemaCache()
query_cache = QueryCache()
prepared_cache = PreparedStatementCache()