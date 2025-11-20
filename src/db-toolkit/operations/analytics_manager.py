"""Database analytics and monitoring operations."""

import psutil
from typing import Dict, List, Any
from datetime import datetime
from core.models import DatabaseConnection


class AnalyticsManager:
    """Manage database analytics and monitoring."""

    def __init__(self, connection):
        """Initialize analytics manager."""
        self.connection = connection

    async def get_analytics(self, config: DatabaseConnection) -> Dict[str, Any]:
        """Get comprehensive database analytics."""
        db_type = config.db_type.value if hasattr(config.db_type, 'value') else config.db_type
        
        if db_type == 'postgresql':
            return await self._get_postgresql_analytics()
        elif db_type == 'mysql':
            return await self._get_mysql_analytics()
        elif db_type == 'mongodb':
            return await self._get_mongodb_analytics()
        elif db_type == 'sqlite':
            return await self._get_sqlite_analytics()
        else:
            return {"error": "Unsupported database type"}

    async def _get_postgresql_analytics(self) -> Dict[str, Any]:
        """Get PostgreSQL analytics."""
        try:
            # Current queries
            current_queries_sql = """
                SELECT pid, usename, application_name, client_addr, 
                       state, query, query_start, state_change
                FROM pg_stat_activity
                WHERE state != 'idle' AND query NOT LIKE '%pg_stat_activity%'
                ORDER BY query_start DESC
                LIMIT 50
            """
            current_queries = await self.connection.fetch(current_queries_sql)

            # Idle connections
            idle_sql = """
                SELECT COUNT(*) as count
                FROM pg_stat_activity
                WHERE state = 'idle'
            """
            idle_result = await self.connection.fetchrow(idle_sql)
            idle_connections = idle_result['count'] if idle_result else 0

            # Long-running queries (> 30 seconds)
            long_running_sql = """
                SELECT pid, usename, application_name, 
                       EXTRACT(EPOCH FROM (NOW() - query_start)) as duration,
                       query, query_start
                FROM pg_stat_activity
                WHERE state = 'active' 
                  AND query_start < NOW() - INTERVAL '30 seconds'
                  AND query NOT LIKE '%pg_stat_activity%'
                ORDER BY query_start
                LIMIT 20
            """
            long_running = await self.connection.fetch(long_running_sql)

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
            blocked_queries = await self.connection.fetch(blocked_sql)

            # Database size
            size_sql = "SELECT pg_database_size(current_database()) as size"
            size_result = await self.connection.fetchrow(size_sql)
            db_size = size_result['size'] if size_result else 0

            # Active connections
            active_sql = """
                SELECT COUNT(*) as count
                FROM pg_stat_activity
                WHERE state = 'active'
            """
            active_result = await self.connection.fetchrow(active_sql)
            active_connections = active_result['count'] if active_result else 0

            # System stats
            system_stats = self._get_system_stats()

            return {
                "success": True,
                "current_queries": [dict(row) for row in current_queries],
                "idle_connections": idle_connections,
                "long_running_queries": [dict(row) for row in long_running],
                "blocked_queries": [dict(row) for row in blocked_queries],
                "database_size": db_size,
                "active_connections": active_connections,
                "system_stats": system_stats,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _get_mysql_analytics(self) -> Dict[str, Any]:
        """Get MySQL analytics."""
        try:
            # Current queries
            current_queries_sql = """
                SELECT ID as pid, USER as usename, HOST as client_addr,
                       DB as database_name, COMMAND as state, 
                       TIME as duration, INFO as query
                FROM information_schema.PROCESSLIST
                WHERE COMMAND != 'Sleep' AND INFO IS NOT NULL
                ORDER BY TIME DESC
                LIMIT 50
            """
            current_queries = await self.connection.fetch(current_queries_sql)

            # Idle connections
            idle_sql = """
                SELECT COUNT(*) as count
                FROM information_schema.PROCESSLIST
                WHERE COMMAND = 'Sleep'
            """
            idle_result = await self.connection.fetchrow(idle_sql)
            idle_connections = idle_result['count'] if idle_result else 0

            # Long-running queries (> 30 seconds)
            long_running_sql = """
                SELECT ID as pid, USER as usename, 
                       TIME as duration, INFO as query
                FROM information_schema.PROCESSLIST
                WHERE COMMAND != 'Sleep' AND TIME > 30
                ORDER BY TIME DESC
                LIMIT 20
            """
            long_running = await self.connection.fetch(long_running_sql)

            # Blocked queries (using innodb locks)
            blocked_sql = """
                SELECT r.trx_id AS blocked_trx,
                       r.trx_mysql_thread_id AS blocked_pid,
                       b.trx_id AS blocking_trx,
                       b.trx_mysql_thread_id AS blocking_pid,
                       r.trx_query AS blocked_query
                FROM information_schema.INNODB_LOCK_WAITS w
                JOIN information_schema.INNODB_TRX b ON b.trx_id = w.blocking_trx_id
                JOIN information_schema.INNODB_TRX r ON r.trx_id = w.requesting_trx_id
                LIMIT 20
            """
            try:
                blocked_queries = await self.connection.fetch(blocked_sql)
            except:
                blocked_queries = []

            # Database size
            size_sql = """
                SELECT SUM(data_length + index_length) as size
                FROM information_schema.TABLES
                WHERE table_schema = DATABASE()
            """
            size_result = await self.connection.fetchrow(size_sql)
            db_size = size_result['size'] if size_result and size_result['size'] else 0

            # Active connections
            active_sql = """
                SELECT COUNT(*) as count
                FROM information_schema.PROCESSLIST
                WHERE COMMAND != 'Sleep'
            """
            active_result = await self.connection.fetchrow(active_sql)
            active_connections = active_result['count'] if active_result else 0

            # System stats
            system_stats = self._get_system_stats()

            return {
                "success": True,
                "current_queries": [dict(row) for row in current_queries],
                "idle_connections": idle_connections,
                "long_running_queries": [dict(row) for row in long_running],
                "blocked_queries": [dict(row) for row in blocked_queries],
                "database_size": db_size,
                "active_connections": active_connections,
                "system_stats": system_stats,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _get_mongodb_analytics(self) -> Dict[str, Any]:
        """Get MongoDB analytics."""
        try:
            # Current operations
            current_ops = await self.connection.admin.command('currentOp')
            current_queries = [
                {
                    "pid": op.get('opid', ''),
                    "usename": op.get('client', ''),
                    "state": op.get('op', ''),
                    "query": str(op.get('command', {})),
                    "duration": op.get('secs_running', 0)
                }
                for op in current_ops.get('inprog', [])
                if op.get('op') not in ['none', 'getmore']
            ][:50]

            # Long-running queries (> 30 seconds)
            long_running = [
                op for op in current_queries
                if op.get('duration', 0) > 30
            ][:20]

            # Server status
            server_status = await self.connection.admin.command('serverStatus')
            
            # Database stats
            db_stats = await self.connection.command('dbStats')
            db_size = db_stats.get('dataSize', 0)
            
            # Active connections
            active_connections = server_status.get('connections', {}).get('current', 0)
            
            # Idle connections (available - current)
            total_available = server_status.get('connections', {}).get('available', 0)
            idle_connections = max(0, total_available - active_connections)

            # System stats
            system_stats = self._get_system_stats()

            return {
                "success": True,
                "current_queries": current_queries,
                "idle_connections": idle_connections,
                "long_running_queries": long_running,
                "blocked_queries": [],  # MongoDB doesn't have traditional locks
                "database_size": db_size,
                "active_connections": active_connections,
                "system_stats": system_stats,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _get_sqlite_analytics(self) -> Dict[str, Any]:
        """Get SQLite analytics."""
        try:
            # SQLite is single-connection, limited analytics
            import os
            
            # Database size
            db_path = self.connection._connection  # SQLite file path
            db_size = os.path.getsize(db_path) if os.path.exists(db_path) else 0

            # System stats
            system_stats = self._get_system_stats()

            return {
                "success": True,
                "current_queries": [],
                "idle_connections": 0,
                "long_running_queries": [],
                "blocked_queries": [],
                "database_size": db_size,
                "active_connections": 1,
                "system_stats": system_stats,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _get_system_stats(self) -> Dict[str, Any]:
        """Get system-level statistics."""
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')

            return {
                "cpu_usage": cpu_percent,
                "memory_usage": memory.percent,
                "memory_total": memory.total,
                "memory_used": memory.used,
                "disk_usage": disk.percent,
                "disk_total": disk.total,
                "disk_used": disk.used
            }
        except Exception as e:
            return {
                "cpu_usage": 0,
                "memory_usage": 0,
                "memory_total": 0,
                "memory_used": 0,
                "disk_usage": 0,
                "disk_total": 0,
                "disk_used": 0,
                "error": str(e)
            }

    async def kill_query(self, pid: int, config: DatabaseConnection) -> Dict[str, Any]:
        """Kill a running query by PID."""
        db_type = config.db_type.value if hasattr(config.db_type, 'value') else config.db_type
        
        try:
            if db_type == 'postgresql':
                await self.connection.execute(f"SELECT pg_terminate_backend({pid})")
            elif db_type == 'mysql':
                await self.connection.execute(f"KILL {pid}")
            elif db_type == 'mongodb':
                await self.connection.admin.command('killOp', op=pid)
            else:
                return {"success": False, "error": "Unsupported database type"}
            
            return {"success": True, "message": f"Query {pid} terminated"}
        except Exception as e:
            return {"success": False, "error": str(e)}
