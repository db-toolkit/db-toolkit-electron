"""Health check routes."""

import psutil
from datetime import datetime
from fastapi import APIRouter
from operations.connection_manager import connection_manager

router = APIRouter()
start_time = datetime.utcnow()


@router.get("/health")
async def health_check():
    """Comprehensive health check."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": (datetime.utcnow() - start_time).total_seconds(),
        "connections": {
            "active": len(connection_manager._active_connections)
        },
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent
        }
    }