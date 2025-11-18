"""Data explorer operations."""

from typing import Optional, Dict, Any
from core.models import DatabaseConnection
from operations.connection_manager import connection_manager


class DataExplorer:
    """Handles data browsing operations."""

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
            return {"success": False, "error": "Not connected to database"}

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
            
            return {
                "success": True,
                "rows": result.get("rows", []),
                "columns": result.get("columns", []),
                "limit": limit,
                "offset": offset,
            }

        except Exception as e:
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
            
            if result.get("success") and result.get("rows"):
                return result["rows"][0][0]
            return 0

        except Exception:
            return 0
