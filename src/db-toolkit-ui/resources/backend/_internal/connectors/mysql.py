"""MySQL database connector."""

import aiomysql
from typing import Dict, List, Any
from connectors.base import BaseConnector
from core.models import DatabaseConnection


class MySQLConnector(BaseConnector):
    """MySQL database connector."""
    
    async def connect(self, config: DatabaseConnection) -> bool:
        """Connect to MySQL database."""
        try:
            self.connection = await aiomysql.connect(
                host=config.host,
                port=config.port or 3306,
                user=config.username,
                password=config.password,
                db=config.database
            )
            self.is_connected = True
            return True
        except Exception:
            self.is_connected = False
            return False
    
    async def disconnect(self) -> bool:
        """Disconnect from MySQL."""
        try:
            if self.connection:
                self.connection.close()
            self.is_connected = False
            return True
        except Exception:
            return False
    
    async def test_connection(self, config: DatabaseConnection) -> Dict[str, Any]:
        """Test MySQL connection."""
        try:
            conn = await aiomysql.connect(
                host=config.host,
                port=config.port or 3306,
                user=config.username,
                password=config.password,
                db=config.database
            )
            conn.close()
            return {"success": True, "message": "Connection successful"}
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    async def get_schemas(self) -> List[str]:
        """Get MySQL schemas."""
        async with self.connection.cursor() as cursor:
            await cursor.execute("SHOW DATABASES")
            rows = await cursor.fetchall()
        return [row[0] for row in rows if row[0] not in ('information_schema', 'performance_schema', 'mysql', 'sys')]
    
    async def get_tables(self, schema: str = None) -> List[str]:
        """Get MySQL tables."""
        async with self.connection.cursor() as cursor:
            if schema:
                await cursor.execute(f"USE {schema}")
            await cursor.execute("SHOW TABLES")
            rows = await cursor.fetchall()
        return [row[0] for row in rows]
    
    async def get_columns(self, table: str, schema: str = None) -> List[Dict[str, Any]]:
        """Get MySQL table columns."""
        async with self.connection.cursor() as cursor:
            if schema:
                await cursor.execute(f"USE {schema}")
            await cursor.execute(f"DESCRIBE {table}")
            rows = await cursor.fetchall()
        return [
            {
                "column_name": row[0],
                "data_type": row[1],
                "is_nullable": "YES" if row[2] == "YES" else "NO",
                "column_default": row[4]
            }
            for row in rows
        ]
    
    async def execute_query(self, query: str) -> Dict[str, Any]:
        """Execute MySQL query."""
        try:
            async with self.connection.cursor() as cursor:
                await cursor.execute(query)
                rows = await cursor.fetchall()
                columns = [desc[0] for desc in cursor.description] if cursor.description else []
            return {
                "success": True,
                "columns": columns,
                "data": [list(row) for row in rows],
                "row_count": len(rows)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}