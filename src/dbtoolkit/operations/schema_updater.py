"""Schema and data refresh after editing operations."""

from typing import Optional, List, Dict, Any
from ..core.models import DatabaseConnection
from ..connectors.factory import ConnectorFactory
from ..utils.cache import metadata_cache


class SchemaUpdater:
    """Handles schema and data updates after editing operations."""
    
    def __init__(self, connection: DatabaseConnection):
        """Initialize schema updater."""
        self.connection = connection
        self.connector = ConnectorFactory.create_connector(connection)
    
    async def refresh_table_data(self, table: str, schema: Optional[str] = None, 
                                limit: int = 100) -> List[Dict[str, Any]]:
        """Refresh table data after edits."""
        if not await self.connector.connect():
            return []
        
        try:
            table_name = f"{schema}.{table}" if schema else table
            query = f"SELECT * FROM {table_name} LIMIT {limit}"
            
            result = await self.connector.execute_query(query)
            return result
            
        except Exception:
            return []
        finally:
            await self.connector.disconnect()
    
    async def invalidate_schema_cache(self, table: Optional[str] = None) -> None:
        """Invalidate schema cache after structural changes."""
        cache_key = f"schema_{self.connection.id}"
        
        if table:
            # Invalidate specific table cache if implemented
            table_cache_key = f"{cache_key}_{table}"
            metadata_cache.clear(table_cache_key)
        else:
            # Invalidate entire schema cache
            metadata_cache.clear(cache_key)
    
    async def refresh_table_constraints(self, table: str, schema: Optional[str] = None) -> bool:
        """Refresh table constraints after schema changes."""
        try:
            # Clear constraint cache
            constraint_cache_key = f"constraints_{self.connection.id}_{table}"
            metadata_cache.clear(constraint_cache_key)
            
            # Trigger re-fetch on next access
            return True
            
        except Exception:
            return False