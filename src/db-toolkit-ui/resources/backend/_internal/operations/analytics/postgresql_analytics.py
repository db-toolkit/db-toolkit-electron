"""PostgreSQL-specific analytics operations."""

from utils.logger import logger
from typing import Dict, Any
from datetime import datetime


async def get_postgresql_analytics(connector) -> Dict[str, Any]:
    """Get PostgreSQL analytics with full support."""
    try:
        # Execute all queries sequentially to avoid "another operation is in progress" error
        current_queries_sql = """
                SELECT pid, usename, application_name, 
                       CAST(client_addr AS TEXT) as client_addr, 
                       state, query, 
                       query_start::TEXT as query_start, 
                       state_change::TEXT as state_change,
                       CAST(EXTRACT(EPOCH FROM (NOW() - query_start)) AS FLOAT) as duration,
                       CASE 
                         WHEN query ILIKE 'SELECT%' THEN 'SELECT'
                         WHEN query ILIKE 'INSERT%' THEN 'INSERT'
                         WHEN query ILIKE 'UPDATE%' THEN 'UPDATE'
                         WHEN query ILIKE 'DELETE%' THEN 'DELETE'
                         ELSE 'OTHER'
                       END as query_type
                FROM pg_stat_activity
                WHERE state NOT IN ('idle', '') AND query NOT LIKE '%pg_stat_activity%'
                    ORDER BY query_start DESC
                    LIMIT 50
            """
        current_queries = await connector.fetch(current_queries_sql)
        
        # Group queries by type
        query_stats = {'SELECT': 0, 'INSERT': 0, 'UPDATE': 0, 'DELETE': 0, 'OTHER': 0}
        for q in current_queries:
            query_stats[q['query_type']] += 1

        # Idle connections
        idle_sql = "SELECT COUNT(*) as count FROM pg_stat_activity WHERE state = 'idle'"
        idle_result = await connector.fetchrow(idle_sql)
        idle_connections = idle_result['count'] if idle_result else 0

        # Long-running queries
        long_running_sql = """
            SELECT pid, usename, application_name, 
                   CAST(EXTRACT(EPOCH FROM (NOW() - query_start)) AS FLOAT) as duration,
                   query, query_start::TEXT as query_start
            FROM pg_stat_activity
            WHERE state = 'active' 
              AND query_start < NOW() - INTERVAL '30 seconds'
              AND query NOT LIKE '%pg_stat_activity%'
                ORDER BY query_start
                LIMIT 20
            """
        long_running = await connector.fetch(long_running_sql)

        # Blocked queries
        blocked_sql = """
            SELECT blocked_locks.pid AS blocked_pid,
                   blocked_activity.usename AS blocked_user,
                   blocking_locks.pid AS blocking_pid,
                   blocking_activity.usename AS blocking_user,
                   blocked_activity.query AS blocked_query,
                   blocking_activity.query AS blocking_query
            FROM pg_catalog.pg_locks blocked_locks
            JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
            JOIN pg_catalog.pg_locks blocking_locks 
                ON blocking_locks.locktype = blocked_locks.locktype
                AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
                AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
                AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
                AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
                AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
                AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
                AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
                AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
                AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
                AND blocking_locks.pid != blocked_locks.pid
            JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
                WHERE NOT blocked_locks.granted
                LIMIT 20
            """
        blocked_queries = await connector.fetch(blocked_sql)

        # Database size
        size_sql = "SELECT pg_database_size(current_database()) as size"
        size_result = await connector.fetchrow(size_sql)
        db_size = size_result['size'] if size_result else 0

        # Active connections
        active_sql = "SELECT COUNT(*) as count FROM pg_stat_activity WHERE state = 'active'"
        active_result = await connector.fetchrow(active_sql)
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
        logger.error(f"Analytics error in postgresql_analytics.py: {str(e)}")
        return {"success": False, "error": str(e)}

