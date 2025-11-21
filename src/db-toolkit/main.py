"""FastAPI application."""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from operations.background_tasks import cleanup_old_history_task, backup_scheduler_task
from utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    logger.info("Starting DB Toolkit API")
    # Start background tasks
    cleanup_task = asyncio.create_task(cleanup_old_history_task())
    scheduler_task = asyncio.create_task(backup_scheduler_task())
    logger.info("Background tasks started")
    yield
    # Cleanup
    logger.info("Shutting down DB Toolkit API")
    cleanup_task.cancel()
    scheduler_task.cancel()
    logger.info("Background tasks stopped")
    
# Import routes
from core.routes.connections import router as connections_router
from core.routes.health import router as health_router
from core.routes.schema import router as schema_router
from core.routes.query import router as query_router
from core.routes.data import router as data_router
from core.routes.csv import router as csv_router
from core.routes.session import router as session_router
from core.routes.settings import router as settings_router
from core.routes.data_explorer import router as data_explorer_router
from core.routes.backup import router as backup_router
from core.routes.migrator import router as migrator_router
from core.routes.analytics import router as analytics_router
from core.routes.cache import router as cache_router
from core.routes.ai.query_ai import router as query_ai_router
from core.routes.ai.schema_ai import router as schema_ai_router
from ws.websocket import websocket_backups
from ws.terminal import websocket_terminal
from ws.migrator import websocket_migrator
from ws.analytics import websocket_analytics

app = FastAPI(
    title="DB Toolkit API",
    description="Database management toolkit API",
    version="0.5.1",
    swagger_ui_parameters={"defaultModelsExpandDepth": -1},
    lifespan=lifespan,
)

# CORS middleware for Electron frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(health_router, prefix="/api/v1", tags=["Health"])
app.include_router(connections_router, prefix="/api/v1", tags=["Connections"])
app.include_router(schema_router, prefix="/api/v1", tags=["Schema"])
app.include_router(query_router, prefix="/api/v1", tags=["Query"])
app.include_router(data_router, prefix="/api/v1", tags=["Data"])
app.include_router(csv_router, prefix="/api/v1", tags=["CSV"])
app.include_router(session_router, prefix="/api/v1", tags=["Session"])
app.include_router(settings_router, prefix="/api/v1", tags=["Settings"])
app.include_router(data_explorer_router, prefix="/api/v1", tags=["Data Explorer"])
app.include_router(backup_router, prefix="/api/v1", tags=["Backups"])
app.include_router(migrator_router, prefix="/api/v1", tags=["Migrator"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(cache_router, prefix="/api/v1", tags=["Cache"])
app.include_router(query_ai_router, prefix="/api/v1/ai/query", tags=["AI Query"])
app.include_router(schema_ai_router, prefix="/api/v1/ai/schema", tags=["AI Schema"])

# WebSocket routes
app.websocket("/ws/backups")(websocket_backups)
app.websocket("/ws/terminal")(websocket_terminal)
app.websocket("/ws/migrator")(websocket_migrator)
app.websocket("/ws/analytics")(websocket_analytics)