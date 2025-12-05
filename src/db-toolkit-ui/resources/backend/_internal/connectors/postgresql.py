"""PostgreSQL database connector."""

import asyncpg
from typing import Dict, List, Any
from connectors.base import BaseConnector
from core.models import DatabaseConnection


class PostgreSQLConnector(BaseConnector):
    """PostgreSQL database connector."""
    
    async def connect(self, config: DatabaseConnection) -> bool:
        """Connect to PostgreSQL database."""
        try:
            self.connection = await asyncpg.connect(
                host=config.host,
                port=config.port or 5432,
                user=config.username,
                password=config.password,
                database=config.database
            )
            self.is_connected = True
            return True
        except Exception:
            self.is_connected = False
            return False
    
    async def disconnect(self) -> bool:
        """Disconnect from PostgreSQL."""
        try:
            if self.connection:
                await self.connection.close()
            self.is_connected = False
            return True
        except Exception:
            return False
    
    async def test_connection(self, config: DatabaseConnection) -> Dict[str, Any]:
        """Test PostgreSQL connection."""
        try:
            conn = await asyncpg.connect(
                host=config.host,
                port=config.port or 5432,
                user=config.username,
                password=config.password,
                database=config.database
            )
            await conn.close()
            return {"success": True, "message": "Connection successful"}
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    async def get_schemas(self) -> List[str]:
        """Get PostgreSQL schemas."""
        query = """
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY schema_name
        """
        rows = await self.connection.fetch(query)
        return [row['schema_name'] for row in rows]
    
    async def get_tables(self, schema: str = "public") -> List[str]:
        """Get PostgreSQL tables."""
        query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 AND table_type = 'BASE TABLE'
        ORDER BY table_name
        """
        rows = await self.connection.fetch(query, schema)
        return [row['table_name'] for row in rows]
    
    async def get_columns(self, table: str, schema: str = "public") -> List[Dict[str, Any]]:
        """Get PostgreSQL table columns."""
        query = """
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
        """
        rows = await self.connection.fetch(query, schema, table)
        return [dict(row) for row in rows]
    
    async def execute_query(self, query: str) -> Dict[str, Any]:
        """Execute PostgreSQL query."""
        try:
            rows = await self.connection.fetch(query)
            if rows:
                columns = list(rows[0].keys())
                data = [list(row.values()) for row in rows]
                return {
                    "success": True,
                    "columns": columns,
                    "data": data,
                    "row_count": len(rows)
                }
            return {"success": True, "columns": [], "data": [], "row_count": 0}
        except Exception as e:
            return {"success": False, "error": str(e)}