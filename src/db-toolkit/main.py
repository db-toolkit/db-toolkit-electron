"""FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.routes.connections import router as connections_router
from core.routes.health import router as health_router
from core.routes.schema import router as schema_router
from core.routes.query import router as query_router
from core.routes.data import router as data_router
from core.routes.csv import router as csv_router
from core.routes.session import router as session_router
from core.routes.settings import router as settings_router

app = FastAPI(
    title="DB Toolkit API",
    description="Database management toolkit API",
    version="0.1.0",
    swagger_ui_parameters={"defaultModelsExpandDepth": -1},
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