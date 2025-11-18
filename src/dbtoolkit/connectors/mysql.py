"""MySQL database connector."""

import aiomysql
from typing import List, Dict, Any, Optional
from .base import DatabaseConnector


class MySQLConnector(DatabaseConnector):
    """MySQL database connector using aiomysql."""
    
    async def connect(self) -> bool:
        """Establish MySQL connection."""
        try:
            self._client = await aiomysql.connect(
                host=self.connection.host,
                port=self.connection.port,
                user=self.connection.username,
                password=self.connection.password,
                db=self.connection.database,
                connect_timeout=self.connection.connection_timeout
            )
            return True
        except Exception as e:
            print(f"MySQL connection failed: {e}")
            return False
    
    async def disconnect(self) -> None:
        """Close MySQL connection."""
        if self._client:
            self._client.close()
            self._client = None
    
    async def test_connection(self) -> bool:
        """Test MySQL connection."""
        if not self.is_connected:
            return await self.connect()
        
        try:
            cursor = await self._client.cursor()
            await cursor.execute("SELECT 1")
            await cursor.fetchone()
            await cursor.close()
            return True
        except Exception:
            return False
    
    async def get_schemas(self) -> List[str]:
        """Get list of MySQL databases."""
        cursor = await self._client.cursor()
        await cursor.execute("SHOW DATABASES")
        rows = await cursor.fetchall()
        await cursor.close()
        return [row[0] for row in rows if row[0] not in ('information_schema', 'performance_schema', 'mysql', 'sys')]
    
    async def get_tables(self, schema: Optional[str] = None) -> List[str]:
        """Get list of tables in database."""
        cursor = await self._client.cursor()
        if schema:
            await cursor.execute(f"USE {schema}")
        await cursor.execute("SHOW TABLES")
        rows = await cursor.fetchall()
        await cursor.close()
        return [row[0] for row in rows]
    
    async def get_columns(self, table: str, schema: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get column information for table."""
        cursor = await self._client.cursor()
        if schema:
            await cursor.execute(f"USE {schema}")
        await cursor.execute(f"DESCRIBE {table}")
        rows = await cursor.fetchall()
        await cursor.close()
        
        columns = []
        for row in rows:
            columns.append({
                'column_name': row[0],
                'data_type': row[1],
                'is_nullable': row[2] == 'YES',
                'column_default': row[4]
            })
        return columns
    
    async def execute_query(self, query: str) -> List[Dict[str, Any]]:
        """Execute query and return results."""
        cursor = await self._client.cursor(aiomysql.DictCursor)
        await cursor.execute(query)
        rows = await cursor.fetchall()
        await cursor.close()
        return list(rows)