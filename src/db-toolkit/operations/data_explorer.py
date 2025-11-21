"""Data explorer operations."""

from typing import Optional, Dict, Any, List
from core.models import DatabaseConnection
from operations.connection_manager import connection_manager
from utils.logger import logger


class DataExplorer:
    """Handles data browsing operations."""

    async def get_table_relationships(
        self,
        connection: DatabaseConnection,
        schema_name: str,
        table_name: str,
    ) -> Dict[str, Any]:
        """Get foreign key relationships for a table."""
        connector = await connection_manager.get_connector(connection.id)
        if not connector:
            return {"success": False, "error": "Not connected"}

        try:
            query = f"""
                SELECT
                    kcu.column_name,
                    ccu.table_schema AS foreign_schema,
                    ccu.table_name AS foreign_table,
                    ccu.column_name AS foreign_column
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_schema = '{schema_name}'
                    AND tc.table_name = '{table_name}'
            """
            result = await connector.execute_query(query)
            return {"success": True, "relationships": result.get("rows", [])}
        except Exception as e:
            logger.error(f"Failed to get table relationships for '{connection.name}.{schema_name}.{table_name}': {str(e)}")
            return {"success": False, "error": str(e)}

    async def browse_data(
        self,
        connection: DatabaseConnection,
        schema_name: str,
        table_name: str,
        limit: int = 100,
        offset: int = 0,
        sort_column: Optional[str] = None,
        sort_order: str = "ASC",
        filters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Browse table data with pagination, sorting, and filtering."""
        connector = await connection_manager.get_connector(connection.id)
        if not connector:
            # Try to establish connection if not exists
            success = await connection_manager.connect(connection)
            if not success:
                return {"success": False, "error": "Failed to establish database connection"}
            connector = await connection_manager.get_connector(connection.id)
            if not connector:
                return {"success": False, "error": "Connection manager failed to provide connector"}

        try:
            # Build query
            query = f'SELECT * FROM "{schema_name}"."{table_name}"'
            
            # Add filters
            if filters:
                conditions = []
                for column, value in filters.items():
                    if value:
                        conditions.append(f'"{column}" ILIKE \'%{value}%\'')
                if conditions:
                    query += " WHERE " + " AND ".join(conditions)
            
            # Add sorting
            if sort_column:
                query += f' ORDER BY "{sort_column}" {sort_order}'
            
            # Add pagination
            query += f" LIMIT {limit} OFFSET {offset}"

            result = await connector.execute_query(query)
            rows = result.get("data", [])
            columns = result.get("columns", [])
            
            # Truncate large text/blob fields
            truncated_rows = []
            for row in rows:
                truncated_row = []
                for val in row:
                    if isinstance(val, (str, bytes)) and len(str(val)) > 100:
                        truncated_row.append(str(val)[:100] + "...")
                    else:
                        truncated_row.append(val)
                truncated_rows.append(truncated_row)
            
            return {
                "success": True,
                "rows": truncated_rows,
                "columns": columns,
                "limit": limit,
                "offset": offset,
            }

        except Exception as e:
            logger.error(f"Failed to browse data for '{connection.name}.{schema_name}.{table_name}': {str(e)}")
            return {"success": False, "error": str(e)}

    async def get_cell_data(
        self,
        connection: DatabaseConnection,
        schema_name: str,
        table_name: str,
        column_name: str,
        row_identifier: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Get full content of a specific cell."""
        connector = await connection_manager.get_connector(connection.id)
        if not connector:
            return {"success": False, "error": "Not connected"}

        try:
            conditions = [f'"{k}" = \'{v}\'' for k, v in row_identifier.items()]
            where_clause = " AND ".join(conditions)
            query = f'SELECT "{column_name}" FROM "{schema_name}"."{table_name}" WHERE {where_clause} LIMIT 1'
            
            result = await connector.execute_query(query)
            if result.get("success") and result.get("data"):
                return {"success": True, "data": result["data"][0][0]}
            return {"success": False, "error": "No data found"}
        except Exception as e:
            logger.error(f"Failed to get cell data for '{connection.name}.{schema_name}.{table_name}.{column_name}': {str(e)}")
            return {"success": False, "error": str(e)}

    async def get_row_count(
        self,
        connection: DatabaseConnection,
        schema_name: str,
        table_name: str,
    ) -> int:
        """Get total row count for a table."""
        connector = await connection_manager.get_connector(connection.id)
        if not connector:
            return 0

        try:
            query = f'SELECT COUNT(*) FROM "{schema_name}"."{table_name}"'
            result = await connector.execute_query(query)
            
            if result.get("success") and result.get("data"):
                return result["data"][0][0]
            return 0

        except Exception as e:
            logger.error(f"Failed to get row count for '{connection.name}.{schema_name}.{table_name}': {str(e)}")
            return 0
