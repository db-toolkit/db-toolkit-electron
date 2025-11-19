"""FastAPI application."""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from operations.background_tasks import cleanup_old_history_task, backup_scheduler_task


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    # Start background tasks
    cleanup_task = asyncio.create_task(cleanup_old_history_task())
    scheduler_task = asyncio.create_task(backup_scheduler_task())
    yield
    # Cleanup
    cleanup_task.cancel()
    scheduler_task.cancel()
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
from ws.websocket import websocket_backups

app = FastAPI(
    title="DB Toolkit API",
    description="Database management toolkit API",
    version="1.0.0",
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

# WebSocket routes
app.websocket("/ws/backups")(websocket_backups)