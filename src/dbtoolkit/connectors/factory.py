"""Database connector factory."""

from typing import Type
from ..core.models import DatabaseConnection, DatabaseType
from .base import DatabaseConnector
from .postgresql import PostgreSQLConnector
from .mysql import MySQLConnector
from .sqlite import SQLiteConnector
from .mongodb import MongoDBConnector


class ConnectorFactory:
    """Factory for creating database connectors."""
    
    _connectors = {
        DatabaseType.POSTGRESQL: PostgreSQLConnector,
        DatabaseType.MYSQL: MySQLConnector,
        DatabaseType.SQLITE: SQLiteConnector,
        DatabaseType.MONGODB: MongoDBConnector,
    }
    
    @classmethod
    def create_connector(cls, connection: DatabaseConnection) -> DatabaseConnector:
        """Create appropriate connector for database type."""
        connector_class = cls._connectors.get(connection.db_type)
        
        if not connector_class:
            raise ValueError(f"Unsupported database type: {connection.db_type}")
        
        return connector_class(connection)
    
    @classmethod
    def get_supported_types(cls) -> list[DatabaseType]:
        """Get list of supported database types."""
        return list(cls._connectors.keys())