"""SQLite-specific analytics operations."""

from utils.logger import logger
import os
from typing import Dict, Any
from datetime import datetime


async def get_sqlite_analytics(connection, db_path: str = None) -> Dict[str, Any]:
    """Get SQLite analytics with enhanced support."""
    try:
        # Database size
        db_size = 0
        if db_path and os.path.exists(db_path):
            db_size = os.path.getsize(db_path)
        
        # SQLite-specific stats
        try:
            # Get table count
            table_count_query = "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'"
            table_result = await connection.fetchrow(table_count_query)
            table_count = table_result['count'] if table_result else 0
            
            # Get index count
            index_count_query = "SELECT COUNT(*) as count FROM sqlite_master WHERE type='index'"
            index_result = await connection.fetchrow(index_count_query)
            index_count = index_result['count'] if index_result else 0
            
            # Get page count and page size
            page_count_query = "PRAGMA page_count"
            page_count_result = await connection.fetchrow(page_count_query)
            page_count = page_count_result[0] if page_count_result else 0
            
            page_size_query = "PRAGMA page_size"
            page_size_result = await connection.fetchrow(page_size_query)
            page_size = page_size_result[0] if page_size_result else 0
            
            # Calculate database stats
            calculated_size = page_count * page_size
            
            # Get largest tables
            largest_tables_query = """
                SELECT name, 
                       (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND tbl_name=m.name) as index_count
                FROM sqlite_master m
                WHERE type='table'
                ORDER BY name
                LIMIT 10
            """
            largest_tables = await connection.fetch(largest_tables_query)
            
            sqlite_stats = {
                "table_count": table_count,
                "index_count": index_count,
                "page_count": page_count,
                "page_size": page_size,
                "calculated_size": calculated_size,
                "largest_tables": [dict(row) for row in largest_tables]
            }
        except Exception:
            sqlite_stats = {}

        return {
            "success": True,
            "current_queries": [],
            "idle_connections": 0,
            "long_running_queries": [],
            "blocked_queries": [],
            "database_size": db_size,
            "active_connections": 1,
            "query_stats": {"SELECT": 0, "INSERT": 0, "UPDATE": 0, "DELETE": 0, "OTHER": 0},
            "sqlite_stats": sqlite_stats,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Analytics error in sqlite_analytics.py: {str(e)}")
        return {"success": False, "error": str(e)}
