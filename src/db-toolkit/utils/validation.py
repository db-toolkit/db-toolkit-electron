"""Connection validation utilities."""

from typing import Dict, Any
from core.models import DatabaseConnection, DatabaseType


async def validate_connection(connection: DatabaseConnection) -> Dict[str, Any]:
    """Validate database connection."""
    try:
        if connection.db_type == DatabaseType.POSTGRESQL:
            return await _validate_postgresql(connection)
        elif connection.db_type == DatabaseType.MYSQL:
            return await _validate_mysql(connection)
        elif connection.db_type == DatabaseType.SQLITE:
            return await _validate_sqlite(connection)
        elif connection.db_type == DatabaseType.MONGODB:
            return await _validate_mongodb(connection)
        else:
            return {"success": False, "message": "Unsupported database type"}
    except Exception as e:
        return {"success": False, "message": str(e)}


async def _validate_postgresql(connection: DatabaseConnection) -> Dict[str, Any]:
    """Validate PostgreSQL connection."""
    try:
        import asyncpg
        conn = await asyncpg.connect(
            host=connection.host,
            port=connection.port or 5432,
            user=connection.username,
            password=connection.password,
            database=connection.database
        )
        await conn.close()
        return {"success": True, "message": "Connection successful"}
    except Exception as e:
        return {"success": False, "message": f"PostgreSQL error: {str(e)}"}


async def _validate_mysql(connection: DatabaseConnection) -> Dict[str, Any]:
    """Validate MySQL connection."""
    try:
        import aiomysql
        conn = await aiomysql.connect(
            host=connection.host,
            port=connection.port or 3306,
            user=connection.username,
            password=connection.password,
            db=connection.database
        )
        conn.close()
        return {"success": True, "message": "Connection successful"}
    except Exception as e:
        return {"success": False, "message": f"MySQL error: {str(e)}"}


async def _validate_sqlite(connection: DatabaseConnection) -> Dict[str, Any]:
    """Validate SQLite connection."""
    try:
        import aiosqlite
        async with aiosqlite.connect(connection.file_path) as conn:
            await conn.execute("SELECT 1")
        return {"success": True, "message": "Connection successful"}
    except Exception as e:
        return {"success": False, "message": f"SQLite error: {str(e)}"}


async def _validate_mongodb(connection: DatabaseConnection) -> Dict[str, Any]:
    """Validate MongoDB connection."""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(
            host=connection.host,
            port=connection.port or 27017,
            username=connection.username,
            password=connection.password
        )
        await client.admin.command('ping')
        client.close()
        return {"success": True, "message": "Connection successful"}
    except Exception as e:
        return {"success": False, "message": f"MongoDB error: {str(e)}"}