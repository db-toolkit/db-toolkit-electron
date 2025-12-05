"""AI routes package for DBAssist."""

from .query_ai import router as query_ai_router
from .schema_ai import router as schema_ai_router

__all__ = [
    'query_ai_router',
    'schema_ai_router'
]