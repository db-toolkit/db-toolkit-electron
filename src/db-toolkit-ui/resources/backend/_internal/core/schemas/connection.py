"""Connection schemas."""

from pydantic import BaseModel
from core.models import DatabaseType


class ConnectionRequest(BaseModel):
    """Connection creation request."""
    name: str
    db_type: DatabaseType
    host: str = None
    port: int = None
    username: str = None
    password: str = None
    database: str = None
    file_path: str = None