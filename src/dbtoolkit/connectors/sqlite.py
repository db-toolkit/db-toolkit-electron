"""SQLite database connector."""

import aiosqlite
from typing import List, Dict, Any, Optional
from .base import DatabaseConnector


class SQLiteConnector(DatabaseConnector):
    """SQLite database connector using aiosqlite."""
    
    async def connect(self) -> bool:
        """Establish SQLite connection."""
        try:
            self._client = await aiosqlite.connect(self.connection.file_path)
            return True
        except Exception as e:
            print(f"SQLite connection failed: {e}")
            return False
    
    async def disconnect(self) -> None:
        """Close SQLite connection."""
        if self._client:
            await self._client.close()
            self._client = None
    
    async def test_connection(self) -> bool:
        """Test SQLite connection."""
        if not self.is_connected:
            return await self.connect()
        
        try:
            cursor = await self._client.execute("SELECT 1")
            await cursor.fetchone()
            await cursor.close()
            return True
        except Exception:
            return False
    
    async def get_schemas(self) -> List[str]:
        """Get list of SQLite schemas (always 'main')."""
        return ['main']
    
    async def get_tables(self, schema: Optional[str] = None) -> List[str]:
        """Get list of tables in SQLite database."""
        cursor = await self._client.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        rows = await cursor.fetchall()
        await cursor.close()
        return [row[0] for row in rows]
    
    async def get_columns(self, table: str, schema: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get column information for table."""
        cursor = await self._client.execute(f"PRAGMA table_info({table})")
        rows = await cursor.fetchall()
        await cursor.close()
        
        columns = []
        for row in rows:
            columns.append({
                'column_name': row[1],
                'data_type': row[2],
                'is_nullable': not row[3],
                'column_default': row[4]
            })
        return columns
    
    async def execute_query(self, query: str) -> List[Dict[str, Any]]:
        """Execute query and return results."""
        self._client.row_factory = aiosqlite.Row
        cursor = await self._client.execute(query)
        rows = await cursor.fetchall()
        await cursor.close()
        return [dict(row) for row in rows]