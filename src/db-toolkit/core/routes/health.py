"""Health check routes."""

import psutil
from datetime import datetime
from fastapi import APIRouter
from core.database import get_connection_pool

router = APIRouter()
start_time = datetime.utcnow()


@router.get("/health")
async def health_check():
    """Comprehensive health check."""
    pool = get_connection_pool()
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": (datetime.utcnow() - start_time).total_seconds(),
        "connections": {
            "active": len(pool.connections),
            "total": len(pool.connections)
        },
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent
        }
    }