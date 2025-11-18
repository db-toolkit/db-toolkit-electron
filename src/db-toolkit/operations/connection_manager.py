"""Connection management operations."""

from typing import Dict, List, Optional

from connectors.base import BaseConnector
from connectors.factory import ConnectorFactory
from core.models import DatabaseConnection


class ConnectionManager:
    """Manages active database connections."""

    def __init__(self):
        """Initialize connection manager."""
        self._active_connections: Dict[str, BaseConnector] = {}
        self._connection_metadata: Dict[str, DatabaseConnection] = {}

    async def connect(self, connection: DatabaseConnection) -> bool:
        """Establish database connection."""
        try:
            connector = ConnectorFactory.create_connector(connection.db_type)
            success = await connector.connect(connection)

            if success:
                self._active_connections[connection.id] = connector
                self._connection_metadata[connection.id] = connection
                return True
            return False

        except Exception:
            return False

    async def disconnect(self, connection_id: str) -> bool:
        """Disconnect from database."""
        connector = self._active_connections.get(connection_id)
        if connector:
            success = await connector.disconnect()
            if success:
                del self._active_connections[connection_id]
                if connection_id in self._connection_metadata:
                    del self._connection_metadata[connection_id]
            return success
        return False

    def get_connector(self, connection_id: str) -> Optional[BaseConnector]:
        """Get active connector by connection ID."""
        return self._active_connections.get(connection_id)

    def get_connection(self, connection_id: str) -> Optional[DatabaseConnection]:
        """Get connection metadata by ID."""
        return self._connection_metadata.get(connection_id)

    def is_connected(self, connection_id: str) -> bool:
        """Check if connection is active."""
        connector = self._active_connections.get(connection_id)
        return connector is not None and connector.is_connected

    def get_all_active_connections(self) -> List[str]:
        """Get list of all active connection IDs."""
        return list(self._active_connections.keys())

    def get_connection_count(self) -> int:
        """Get count of active connections."""
        return len(self._active_connections)

    async def disconnect_all(self):
        """Disconnect all active connections."""
        for connection_id in list(self._active_connections.keys()):
            await self.disconnect(connection_id)


connection_manager = ConnectionManager()