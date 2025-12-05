"""Connector factory for creating database connectors."""

from typing import Dict, Type
from connectors.base import BaseConnector
from connectors.postgresql import PostgreSQLConnector
from connectors.mysql import MySQLConnector
from connectors.sqlite import SQLiteConnector
from connectors.mongodb import MongoDBConnector
from core.models import DatabaseType


class ConnectorFactory:
    """Factory for creating database connectors."""
    
    _connectors: Dict[DatabaseType, Type[BaseConnector]] = {
        DatabaseType.POSTGRESQL: PostgreSQLConnector,
        DatabaseType.MYSQL: MySQLConnector,
        DatabaseType.SQLITE: SQLiteConnector,
        DatabaseType.MONGODB: MongoDBConnector,
    }
    
    @classmethod
    def create_connector(cls, db_type: DatabaseType) -> BaseConnector:
        """Create connector instance for database type."""
        connector_class = cls._connectors.get(db_type)
        if not connector_class:
            raise ValueError(f"Unsupported database type: {db_type}")
        return connector_class()
    
    @classmethod
    def get_supported_types(cls) -> list[DatabaseType]:
        """Get list of supported database types."""
        return list(cls._connectors.keys())