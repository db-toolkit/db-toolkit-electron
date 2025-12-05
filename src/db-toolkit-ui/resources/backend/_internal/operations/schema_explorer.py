"""Schema exploration operations."""

from typing import Dict, List, Any
from core.models import DatabaseConnection
from utils.cache import schema_cache
from operations.connection_manager import connection_manager
from utils.logger import logger


class SchemaExplorer:
    """Handles database schema exploration and metadata fetching."""
    
    def __init__(self):
        """Initialize schema explorer."""
        # Use global schema cache instance
        pass
    
    async def get_schema_tree(self, connection: DatabaseConnection, use_cache: bool = True) -> Dict[str, Any]:
        """Get complete schema tree for connection."""
        cache_key = f"{connection.id}_schema"
        
        logger.info(f"Getting schema tree for connection '{connection.name}' (use_cache={use_cache})")
        
        if use_cache:
            cached = schema_cache.get(cache_key)
            if cached:
                logger.info(f"Returning cached schema for '{connection.name}'")
                return cached
        
        try:
            connector = await connection_manager.get_connector(connection.id)
            if not connector:
                # Try to establish connection if not exists
                success = await connection_manager.connect(connection)
                if not success:
                    raise Exception("Failed to establish database connection")
                connector = await connection_manager.get_connector(connection.id)
                if not connector:
                    raise Exception("Connection manager failed to provide connector")
            
            schema_tree = {
                "connection_id": connection.id,
                "db_type": connection.db_type.value,
                "schemas": {}
            }
            
            schemas = await connector.get_schemas()
            logger.info(f"Found {len(schemas)} schemas: {schemas}")
            
            for schema_name in schemas:
                tables = await connector.get_tables(schema_name)
                logger.info(f"Schema '{schema_name}' has {len(tables)} tables: {tables}")
                schema_tree["schemas"][schema_name] = {
                    "tables": {},
                    "table_count": len(tables)
                }
                
                for table_name in tables:
                    columns = await connector.get_columns(table_name, schema_name)
                    schema_tree["schemas"][schema_name]["tables"][table_name] = {
                        "columns": columns,
                        "column_count": len(columns)
                    }
            
            # Don't disconnect - let connection manager handle connection lifecycle
            
            # Cache the result with longer TTL for schema data
            schema_cache.set(cache_key, schema_tree, ttl=900)  # 15 minutes
            
            return schema_tree
            
        except Exception as e:
            logger.error(f"Failed to get schema tree for '{connection.name}': {str(e)}", exc_info=True)
            return {"error": str(e), "success": False}
    
    async def get_table_info(self, connection: DatabaseConnection, schema: str, table: str) -> Dict[str, Any]:
        """Get detailed table information."""
        # Check cache first
        cache_key = f"{connection.id}_table_{schema}_{table}"
        cached = schema_cache.get(cache_key)
        if cached:
            return cached
        
        try:
            connector = await connection_manager.get_connector(connection.id)
            if not connector:
                # Try to establish connection if not exists
                success = await connection_manager.connect(connection)
                if not success:
                    raise Exception("Failed to establish database connection")
                connector = await connection_manager.get_connector(connection.id)
                if not connector:
                    raise Exception("Connection manager failed to provide connector")
            
            columns = await connector.get_columns(table, schema)
            
            # Get sample data (first 5 rows)
            sample_query = self._build_sample_query(connection.db_type, schema, table)
            sample_result = await connector.execute_query(sample_query)
            
            # Don't disconnect - let connection manager handle connection lifecycle
            
            table_info = {
                "success": True,
                "table": table,
                "schema": schema,
                "columns": columns,
                "sample_data": sample_result.get("data", [])[:5] if sample_result.get("success") else []
            }
            
            # Cache table info
            schema_cache.set(cache_key, table_info, ttl=600)  # 10 minutes
            return table_info
            
        except Exception as e:
            logger.error(f"Failed to get table info for '{connection.name}.{schema}.{table}': {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _build_sample_query(self, db_type: str, schema: str, table: str) -> str:
        """Build sample data query for different database types."""
        if db_type == "mongodb":
            return "{}"  # Empty filter for MongoDB
        elif db_type == "sqlite":
            return f"SELECT * FROM {table} LIMIT 5"
        else:
            return f"SELECT * FROM {schema}.{table} LIMIT 5"
    
    async def refresh_schema(self, connection_id: str):
        """Refresh cached schema for connection."""
        # Clear all cache entries for this connection
        keys_to_remove = []
        for key in schema_cache.get_keys():
            if key.startswith(f"{connection_id}_"):
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            schema_cache.delete(key)
    
    def get_cached_schemas(self) -> List[str]:
        """Get list of cached schema keys."""
        return schema_cache.get_keys()
    
    async def get_schemas_cached(self, connection: DatabaseConnection) -> List[str]:
        """Get schemas with caching."""
        cache_key = f"{connection.id}_schemas_list"
        cached = schema_cache.get(cache_key)
        if cached:
            return cached
        
        try:
            connector = await connection_manager.get_connector(connection.id)
            if not connector:
                success = await connection_manager.connect(connection)
                if not success:
                    return []
                connector = await connection_manager.get_connector(connection.id)
                if not connector:
                    return []
            
            schemas = await connector.get_schemas()
            schema_cache.set(cache_key, schemas, ttl=900)  # 15 minutes
            return schemas
        except Exception as e:
            logger.error(f"Failed to get schemas for '{connection.name}': {str(e)}")
            return []
    
    async def get_tables_cached(self, connection: DatabaseConnection, schema: str) -> List[str]:
        """Get tables with caching."""
        cache_key = f"{connection.id}_tables_{schema}"
        cached = schema_cache.get(cache_key)
        if cached:
            return cached
        
        try:
            connector = await connection_manager.get_connector(connection.id)
            if not connector:
                success = await connection_manager.connect(connection)
                if not success:
                    return []
                connector = await connection_manager.get_connector(connection.id)
                if not connector:
                    return []
            
            tables = await connector.get_tables(schema)
            schema_cache.set(cache_key, tables, ttl=600)  # 10 minutes
            return tables
        except Exception as e:
            logger.error(f"Failed to get tables for '{connection.name}.{schema}': {str(e)}")
            return []
    
    async def get_columns_cached(self, connection: DatabaseConnection, table: str, schema: str) -> List[Dict[str, Any]]:
        """Get columns with caching."""
        cache_key = f"{connection.id}_columns_{schema}_{table}"
        cached = schema_cache.get(cache_key)
        if cached:
            return cached
        
        try:
            connector = await connection_manager.get_connector(connection.id)
            if not connector:
                success = await connection_manager.connect(connection)
                if not success:
                    return []
                connector = await connection_manager.get_connector(connection.id)
                if not connector:
                    return []
            
            columns = await connector.get_columns(table, schema)
            schema_cache.set(cache_key, columns, ttl=600)  # 10 minutes
            return columns
        except Exception as e:
            logger.error(f"Failed to get columns for '{connection.name}.{schema}.{table}': {str(e)}")
            return []