"""Slow query log management."""

from typing import Dict, List, Any
from datetime import datetime, timedelta
from collections import defaultdict

# In-memory slow query log (last 24 hours)
slow_query_log = defaultdict(list)


def log_slow_query(connection_id: int, query: str, duration: float, user: str = None):
    """Log a slow query."""
    key = f"conn_{connection_id}"
    
    slow_query_log[key].append({
        'timestamp': datetime.utcnow().isoformat(),
        'query': query,
        'duration': duration,
        'user': user or 'unknown'
    })
    
    # Keep only last 24 hours
    cutoff = datetime.utcnow() - timedelta(hours=24)
    slow_query_log[key] = [
        q for q in slow_query_log[key]
        if datetime.fromisoformat(q['timestamp']) > cutoff
    ]


def get_slow_queries(connection_id: int, hours: int = 24) -> List[Dict[str, Any]]:
    """Get slow query log for connection."""
    key = f"conn_{connection_id}"
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    
    return [
        q for q in slow_query_log.get(key, [])
        if datetime.fromisoformat(q['timestamp']) > cutoff
    ]


def clear_slow_queries(connection_id: int):
    """Clear slow query log for connection."""
    key = f"conn_{connection_id}"
    slow_query_log[key] = []
