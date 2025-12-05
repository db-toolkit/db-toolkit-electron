"""SQLite database connector."""

import aiosqlite
from typing import Dict, List, Any
from connectors.base import BaseConnector
from core.models import DatabaseConnection


class SQLiteConnector(BaseConnector):
    """SQLite database connector."""
    
    async def connect(self, config: DatabaseConnection) -> bool:
        """Connect to SQLite database."""
        try:
            self.connection = await aiosqlite.connect(config.file_path)
            self.is_connected = True
            return True
        except Exception:
            self.is_connected = False
            return False
    
    async def disconnect(self) -> bool:
        """Disconnect from SQLite."""
        try:
            if self.connection:
                await self.connection.close()
            self.is_connected = False
            return True
        except Exception:
            return False
    
    async def test_connection(self, config: DatabaseConnection) -> Dict[str, Any]:
        """Test SQLite connection."""
        try:
            async with aiosqlite.connect(config.file_path) as conn:
                await conn.execute("SELECT 1")
            return {"success": True, "message": "Connection successful"}
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    async def get_schemas(self) -> List[str]:
        """Get SQLite schemas."""
        return ["main"]  # SQLite has only main schema
    
    async def get_tables(self, schema: str = None) -> List[str]:
        """Get SQLite tables."""
        cursor = await self.connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        rows = await cursor.fetchall()
        return [row[0] for row in rows]
    
    async def get_columns(self, table: str, schema: str = None) -> List[Dict[str, Any]]:
        """Get SQLite table columns."""
        cursor = await self.connection.execute(f"PRAGMA table_info({table})")
        rows = await cursor.fetchall()
        return [
            {
                "column_name": row[1],
                "data_type": row[2],
                "is_nullable": "YES" if row[3] == 0 else "NO",
                "column_default": row[4]
            }
            for row in rows
        ]
    
    async def execute_query(self, query: str) -> Dict[str, Any]:
        """Execute SQLite query."""
        try:
            cursor = await self.connection.execute(query)
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