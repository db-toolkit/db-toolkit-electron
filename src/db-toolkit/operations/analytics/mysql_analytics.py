"""MySQL-specific analytics operations."""

from utils.logger import logger
from typing import Dict, Any
from datetime import datetime


async def get_mysql_analytics(connection) -> Dict[str, Any]:
    """Get MySQL analytics with enhanced support."""
    try:
        # Current queries with type classification
        current_queries_sql = """
            SELECT ID as pid, USER as usename, HOST as client_addr,
                   DB as database_name, COMMAND as state, 
                   TIME as duration, INFO as query,
                   CASE 
                     WHEN INFO LIKE 'SELECT%' THEN 'SELECT'
                     WHEN INFO LIKE 'INSERT%' THEN 'INSERT'
                     WHEN INFO LIKE 'UPDATE%' THEN 'UPDATE'
                     WHEN INFO LIKE 'DELETE%' THEN 'DELETE'
                     ELSE 'OTHER'
                   END as query_type
            FROM information_schema.PROCESSLIST
            WHERE COMMAND != 'Sleep' AND INFO IS NOT NULL
            ORDER BY TIME DESC
            LIMIT 50
        """
        current_queries = await connection.fetch(current_queries_sql)
        
        # Group queries by type
        query_stats = {'SELECT': 0, 'INSERT': 0, 'UPDATE': 0, 'DELETE': 0, 'OTHER': 0}
        for q in current_queries:
            query_type = q.get('query_type', 'OTHER')
            query_stats[query_type] += 1

        # Idle connections
        idle_sql = "SELECT COUNT(*) as count FROM information_schema.PROCESSLIST WHERE COMMAND = 'Sleep'"
        idle_result = await connection.fetchrow(idle_sql)
        idle_connections = idle_result['count'] if idle_result else 0

        # Long-running queries
        long_running_sql = """
            SELECT ID as pid, USER as usename, 
                   TIME as duration, INFO as query
            FROM information_schema.PROCESSLIST
            WHERE COMMAND != 'Sleep' AND TIME > 30
            ORDER BY TIME DESC
            LIMIT 20
        """
        long_running = await connection.fetch(long_running_sql)

        # Enhanced blocked queries using performance_schema
        blocked_queries = []
        try:
            blocked_sql = """
                SELECT 
                    r.trx_id AS blocked_trx,
                    r.trx_mysql_thread_id AS blocked_pid,
                    r.trx_query AS blocked_query,
                    b.trx_id AS blocking_trx,
                    b.trx_mysql_thread_id AS blocking_pid,
                    b.trx_query AS blocking_query,
                    CONCAT(ru.USER, '@', ru.HOST) AS blocked_user,
                    CONCAT(bu.USER, '@', bu.HOST) AS blocking_user
                FROM information_schema.INNODB_LOCK_WAITS w
                JOIN information_schema.INNODB_TRX b ON b.trx_id = w.blocking_trx_id
                JOIN information_schema.INNODB_TRX r ON r.trx_id = w.requesting_trx_id
                LEFT JOIN information_schema.PROCESSLIST ru ON ru.ID = r.trx_mysql_thread_id
                LEFT JOIN information_schema.PROCESSLIST bu ON bu.ID = b.trx_mysql_thread_id
                LIMIT 20
            """
            blocked_queries = await connection.fetch(blocked_sql)
        except Exception:
            # Fallback for older MySQL versions
            pass

        # Database size
        size_sql = """
            SELECT SUM(data_length + index_length) as size
            FROM information_schema.TABLES
            WHERE table_schema = DATABASE()
        """
        size_result = await connection.fetchrow(size_sql)
        db_size = size_result['size'] if size_result and size_result['size'] else 0

        # Active connections
        active_sql = "SELECT COUNT(*) as count FROM information_schema.PROCESSLIST WHERE COMMAND != 'Sleep'"
        active_result = await connection.fetchrow(active_sql)
        active_connections = active_result['count'] if active_result else 0

        return {
            "success": True,
            "current_queries": [dict(row) for row in current_queries],
            "idle_connections": idle_connections,
            "long_running_queries": [dict(row) for row in long_running],
            "blocked_queries": [dict(row) for row in blocked_queries],
            "database_size": db_size,
            "active_connections": active_connections,
            "query_stats": query_stats,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Analytics error in mysql_analytics.py: {str(e)}")
        return {"success": False, "error": str(e)}
