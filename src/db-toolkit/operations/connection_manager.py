"""Connection management operations."""

import asyncio
from typing import Dict, List, Optional

from connectors.base import BaseConnector
from connectors.factory import ConnectorFactory
from core.models import DatabaseConnection
from core.settings_storage import SettingsStorage
from operations.operation_lock import operation_lock
from utils.logger import logger


class ConnectionManager:
    """Manages active database connections."""

    def __init__(self):
        """Initialize connection manager."""
        self._active_connections: Dict[str, BaseConnector] = {}
        self._connection_metadata: Dict[str, DatabaseConnection] = {}
        self._settings_storage = SettingsStorage()

    async def connect(self, connection: DatabaseConnection, timeout: Optional[int] = None) -> bool:
        """Establish database connection with timeout."""
        logger.info(f"Connecting to '{connection.name}' ({connection.db_type.value})")
        try:
            # Get timeout from settings if not provided
            if timeout is None:
                settings = await self._settings_storage.get_settings()
                timeout = settings.connection_timeout
            
            connector = ConnectorFactory.create_connector(connection.db_type)
            
            # Connect with timeout
            success = await asyncio.wait_for(
                connector.connect(connection),
                timeout=timeout
            )

            if success:
                self._active_connections[connection.id] = connector
                self._connection_metadata[connection.id] = connection
                logger.info(f"Successfully connected to '{connection.name}'")
                return True
            logger.error(f"Failed to connect to '{connection.name}'")
            return False

        except asyncio.TimeoutError:
            logger.error(f"Connection timeout for '{connection.name}' ({timeout}s)")
            return False
        except Exception as e:
            logger.error(f"Connection error for '{connection.name}': {str(e)}")
            return False

    async def disconnect(self, connection_id: str) -> bool:
        """Disconnect from database."""
        logger.info(f"Disconnecting from connection '{connection_id}'")
        connector = self._active_connections.get(connection_id)
        if connector:
            success = await connector.disconnect()
            if success:
                del self._active_connections[connection_id]
                if connection_id in self._connection_metadata:
                    del self._connection_metadata[connection_id]
                operation_lock.cleanup(connection_id)
                
                # Clear caches for this connection
                from utils.cache import schema_cache, query_cache, prepared_cache
                
                # Clear schema cache
                keys_to_remove = []
                for key in schema_cache.get_keys():
                    if key.startswith(f"{connection_id}_"):
                        keys_to_remove.append(key)
                for key in keys_to_remove:
                    schema_cache.delete(key)
                
                # Clear query cache
                query_cache.invalidate_connection(connection_id)
                
                # Clear prepared statements
                prepared_cache.clear_connection(connection_id)
                
            return success
        return False

    async def get_connector(self, connection_id: str, auto_reconnect: bool = True) -> Optional[BaseConnector]:
        """Get active connector by connection ID with auto-reconnect."""
        connector = self._active_connections.get(connection_id)
        
        # Check if auto-reconnect is enabled and connection is lost
        if connector and not connector.is_connected and auto_reconnect:
            settings = await self._settings_storage.get_settings()
            if settings.auto_reconnect:
                connection = self._connection_metadata.get(connection_id)
                if connection:
                    # Try to reconnect
                    success = await self.connect(connection)
                    if success:
                        return self._active_connections.get(connection_id)
        
        return connector

    async def get_connection(self, connection_id: str) -> Optional[DatabaseConnection]:
        """Get connection metadata by ID."""
        return self._connection_metadata.get(connection_id)

    async def is_connected(self, connection_id: str) -> bool:
        """Check if connection is active."""
        connector = self._active_connections.get(connection_id)
        return connector is not None and connector.is_connected

    async def get_all_active_connections(self) -> List[str]:
        """Get list of all active connection IDs."""
        return list(self._active_connections.keys())

    async def get_connection_count(self) -> int:
        """Get count of active connections."""
        return len(self._active_connections)

    async def disconnect_all(self):
        """Disconnect all active connections."""
        for connection_id in list(self._active_connections.keys()):
            await self.disconnect(connection_id)

    async def get_connection_status(self, connection_id: str) -> Dict:
        """Get detailed connection status."""

        connector = self._active_connections.get(connection_id)
        metadata = self._connection_metadata.get(connection_id)

        if not connector or not metadata:
            return {"connected": False, "locked": False}

        return {
            "connected": connector.is_connected,
            "locked": operation_lock.is_locked(connection_id),
            "db_type": metadata.db_type.value,
            "name": metadata.name,
        }

connection_manager = ConnectionManager()