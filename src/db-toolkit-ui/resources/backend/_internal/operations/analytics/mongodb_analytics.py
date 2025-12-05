"""MongoDB-specific analytics operations."""

from utils.logger import logger
from typing import Dict, Any
from datetime import datetime


async def get_mongodb_analytics(connection) -> Dict[str, Any]:
    """Get MongoDB analytics with enhanced support."""
    try:
        # Current operations with enhanced details
        current_ops = await connection.admin.command('currentOp', {'$all': True})
        
        current_queries = []
        query_stats = {'find': 0, 'insert': 0, 'update': 0, 'delete': 0, 'other': 0}
        
        for op in current_ops.get('inprog', []):
            op_type = op.get('op', 'none')
            if op_type in ['none', 'getmore']:
                continue
                
            # Classify operation type
            if op_type == 'query' or op_type == 'find':
                query_type = 'find'
            elif op_type == 'insert':
                query_type = 'insert'
            elif op_type == 'update':
                query_type = 'update'
            elif op_type == 'remove' or op_type == 'delete':
                query_type = 'delete'
            else:
                query_type = 'other'
            
            query_stats[query_type] += 1
            
            current_queries.append({
                "pid": op.get('opid', ''),
                "usename": op.get('client', ''),
                "state": op_type,
                "query": str(op.get('command', {})),
                "duration": op.get('secs_running', 0),
                "query_type": query_type.upper()
            })
        
        current_queries = current_queries[:50]

        # Long-running queries
        long_running = [
            op for op in current_queries
            if op.get('duration', 0) > 30
        ][:20]

        # Server status for connection info
        server_status = await connection.admin.command('serverStatus')
        
        # Database stats
        db_stats = await connection.command('dbStats')
        db_size = db_stats.get('dataSize', 0) + db_stats.get('indexSize', 0)
        
        # Active connections
        active_connections = server_status.get('connections', {}).get('current', 0)
        
        # Idle connections
        total_available = server_status.get('connections', {}).get('available', 0)
        idle_connections = max(0, total_available - active_connections)
        
        # MongoDB doesn't have traditional locks, but we can check for waiting operations
        blocked_queries = []
        for op in current_ops.get('inprog', []):
            if op.get('waitingForLock', False):
                blocked_queries.append({
                    "blocked_pid": op.get('opid', ''),
                    "blocked_user": op.get('client', ''),
                    "blocked_query": str(op.get('command', {})),
                    "blocking_pid": "N/A",
                    "blocking_user": "N/A",
                    "blocking_query": "Lock wait"
                })
        
        blocked_queries = blocked_queries[:20]

        return {
            "success": True,
            "current_queries": current_queries,
            "idle_connections": idle_connections,
            "long_running_queries": long_running,
            "blocked_queries": blocked_queries,
            "database_size": db_size,
            "active_connections": active_connections,
            "query_stats": {k.upper(): v for k, v in query_stats.items()},
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Analytics error in mongodb_analytics.py: {str(e)}")
        return {"success": False, "error": str(e)}
