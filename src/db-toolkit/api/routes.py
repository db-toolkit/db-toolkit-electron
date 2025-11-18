"""Main API routes."""

from fastapi import APIRouter
from ..core.routes.connections import router as connections_router

router = APIRouter()

# Include route modules
router.include_router(connections_router, tags=["connections"])


@router.get("/health")
def health_check():
    """Health check."""
    return {"status": "healthy"}