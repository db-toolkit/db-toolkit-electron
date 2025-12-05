"""Database analytics and monitoring operations."""

import asyncio
import psutil
from typing import Dict, List, Any
from datetime import datetime, timedelta
from collections import defaultdict
from core.models import DatabaseConnection
from utils.logger import logger
from operations.analytics import (
    get_postgresql_analytics,
    get_mysql_analytics,
    get_mongodb_analytics,
    get_sqlite_analytics
)
from operations.analytics.slow_query_log import log_slow_query, get_slow_queries
from operations.analytics.table_stats import (
    get_table_stats_postgresql,
    get_table_stats_mysql,
    get_table_stats_mongodb,
    get_table_stats_sqlite
)
from operations.analytics.pdf_export import generate_analytics_pdf

# Store historical metrics (in-memory, last 3 hours)
historical_metrics = defaultdict(list)


class AnalyticsManager:
    """Manage database analytics and monitoring."""

    def __init__(self, connection):
        """Initialize analytics manager."""
        self.connection = connection
        self._lock = asyncio.Lock()

    async def get_analytics(self, config: DatabaseConnection, connection_id: str) -> Dict[str, Any]:
        """Get comprehensive database analytics."""
        async with self._lock:
            logger.info(f"Fetching analytics for connection '{connection_id}'")
            db_type = config.db_type.value if hasattr(config.db_type, 'value') else config.db_type
            
            if db_type == 'postgresql':
                result = await get_postgresql_analytics(self.connection)
            elif db_type == 'mysql':
                result = await get_mysql_analytics(self.connection)
            elif db_type == 'mongodb':
                result = await get_mongodb_analytics(self.connection)
            elif db_type == 'sqlite':
                db_path = getattr(config, 'file_path', None) or getattr(config, 'database', None)
                result = await get_sqlite_analytics(self.connection, db_path)
            else:
                logger.warning(f"Unsupported database type for analytics: {db_type}")
                return {"error": "Unsupported database type"}
        
        # Store historical data
        if result.get('success'):
            self._store_historical_data(connection_id, result)
            
            # Log slow queries
            for query in result.get('long_running_queries', []):
                log_slow_query(
                    connection_id,
                    query.get('query', ''),
                    query.get('duration', 0),
                    query.get('usename')
                )
        
        return result
    
    def _store_historical_data(self, connection_id: str, data: Dict[str, Any]):
        """Store metrics for historical analysis (last 3 hours)."""
        key = f"conn_{connection_id}"
        timestamp = datetime.utcnow()
        
        historical_metrics[key].append({
            'timestamp': timestamp.isoformat(),
            'connections': data['active_connections'],
            'idle_connections': data['idle_connections'],
            'database_size': data['database_size']
        })
        
        # Keep only last 3 hours (3600 data points at 3s intervals)
        cutoff = timestamp - timedelta(hours=3)
        historical_metrics[key] = [
            m for m in historical_metrics[key]
            if datetime.fromisoformat(m['timestamp']) > cutoff
        ]
    
    def get_historical_data(self, connection_id: str, hours: int = 3) -> List[Dict[str, Any]]:
        """Get historical metrics for specified time range."""
        key = f"conn_{connection_id}"
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        
        return [
            m for m in historical_metrics.get(key, [])
            if datetime.fromisoformat(m['timestamp']) > cutoff
        ]
    
    def get_slow_query_log(self, connection_id: str, hours: int = 24) -> List[Dict[str, Any]]:
        """Get slow query log."""
        return get_slow_queries(connection_id, hours)
    
    async def get_table_statistics(self, config: DatabaseConnection) -> List[Dict[str, Any]]:
        """Get table-level statistics."""
        async with self._lock:
            db_type = config.db_type.value if hasattr(config.db_type, 'value') else config.db_type
            
            if db_type == 'postgresql':
                return await get_table_stats_postgresql(self.connection)
            elif db_type == 'mysql':
                return await get_table_stats_mysql(self.connection)
            elif db_type == 'mongodb':
                return await get_table_stats_mongodb(self.connection)
            elif db_type == 'sqlite':
                return await get_table_stats_sqlite(self.connection)
            return []
    
    async def export_to_pdf(self, connection_id: str, connection_name: str, config: DatabaseConnection) -> bytes:
        """Export analytics to PDF."""
        # Get current metrics
        metrics = await self.get_analytics(config, connection_id)
        
        # Debug: Ensure we have valid metrics
        if not metrics.get('success'):
            # If analytics failed, create basic metrics
            metrics = {
                'success': True,
                'active_connections': 1,
                'idle_connections': 0,
                'database_size': 0,
                'query_stats': {'SELECT': 0, 'INSERT': 0, 'UPDATE': 0, 'DELETE': 0, 'OTHER': 0},
                'current_queries': [],
                'long_running_queries': [],
                'blocked_queries': []
            }
        
        # Get historical data
        historical = self.get_historical_data(connection_id, 3)
        
        # Get slow queries
        slow_queries = self.get_slow_query_log(connection_id, 24)
        
        # Get table stats
        table_stats = await self.get_table_statistics(config)
        
        return generate_analytics_pdf(
            connection_name,
            metrics,
            historical,
            slow_queries,
            table_stats
        )



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

    def get_connection_pool_stats(self) -> Dict[str, Any]:
        """Get connection pool statistics."""
        # Basic pool stats from historical metrics
        all_connections = []
        for key, metrics in historical_metrics.items():
            if metrics:
                all_connections.extend([m.get('connections', 0) for m in metrics])
        
        if not all_connections:
            return {
                "avg_connections": 0,
                "max_connections": 0,
                "min_connections": 0,
                "current_connections": 0
            }
        
        return {
            "avg_connections": sum(all_connections) / len(all_connections),
            "max_connections": max(all_connections),
            "min_connections": min(all_connections),
            "current_connections": all_connections[-1] if all_connections else 0
        }
    
    async def get_query_plan(self, query: str, config: DatabaseConnection) -> Dict[str, Any]:
        """Get query execution plan."""
        db_type = config.db_type.value if hasattr(config.db_type, 'value') else config.db_type
        
        try:
            if db_type == 'postgresql':
                result = await self.connection.fetch(f"EXPLAIN (FORMAT JSON, ANALYZE) {query}")
                plan = result[0]['QUERY PLAN'] if result else {}
                return {"success": True, "plan": plan}
            elif db_type == 'mysql':
                result = await self.connection.fetch(f"EXPLAIN FORMAT=JSON {query}")
                plan = result[0]['EXPLAIN'] if result else {}
                return {"success": True, "plan": plan}
            else:
                return {"success": False, "error": "Query plan not supported for this database"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def kill_query(self, pid: int, config: DatabaseConnection) -> Dict[str, Any]:
        """Kill a running query by PID."""
        logger.warning(f"Killing query PID {pid}")
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
            
            logger.info(f"Query {pid} terminated successfully")
            return {"success": True, "message": f"Query {pid} terminated"}
        except Exception as e:
            logger.error(f"Failed to kill query {pid}: {str(e)}")
            return {"success": False, "error": str(e)}
