"""Base database connector interface."""

from abc import ABC, abstractmethod
from typing import Dict, List, Any
from core.models import DatabaseConnection


class BaseConnector(ABC):
    """Base class for database connectors."""
    
    def __init__(self):
        """Initialize connector."""
        self.connection = None
        self.is_connected = False
    
    @abstractmethod
    async def connect(self, config: DatabaseConnection) -> bool:
        """Connect to database."""
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """Disconnect from database."""
        pass
    
    @abstractmethod
    async def test_connection(self, config: DatabaseConnection) -> Dict[str, Any]:
        """Test database connection."""
        pass
    
    @abstractmethod
    async def get_schemas(self) -> List[str]:
        """Get list of schemas."""
        pass
    
    @abstractmethod
    async def get_tables(self, schema: str = None) -> List[str]:
        """Get list of tables."""
        pass
    
    @abstractmethod
    async def get_columns(self, table: str, schema: str = None) -> List[Dict[str, Any]]:
        """Get table columns."""
        pass
    
    @abstractmethod
    async def execute_query(self, query: str) -> Dict[str, Any]:
        """Execute query and return results."""
        pass