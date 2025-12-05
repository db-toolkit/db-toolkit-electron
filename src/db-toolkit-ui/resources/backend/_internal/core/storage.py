"""Connection storage management."""

import json
import uuid
from pathlib import Path
from typing import List, Optional
from .models import DatabaseConnection, DatabaseType


class ConnectionStorage:
    """Manages database connection storage."""
    
    def __init__(self, storage_path: Optional[Path] = None):
        """Initialize storage."""
        self.storage_path = storage_path or Path.home() / ".db-toolkit" / "connections.json"
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
    
    async def get_all_connections(self) -> List[DatabaseConnection]:
        """Get all stored connections."""
        if not self.storage_path.exists():
            return []
        
        with open(self.storage_path, 'r') as f:
            data = json.load(f)
        
        return [DatabaseConnection(**conn) for conn in data.get('connections', [])]
    
    async def get_connection(self, connection_id: str) -> Optional[DatabaseConnection]:
        """Get connection by ID."""
        connections = await self.get_all_connections()
        for conn in connections:
            if conn.id == connection_id:
                return conn
        return None
    
    async def add_connection(self, name: str, db_type: DatabaseType, **kwargs) -> DatabaseConnection:
        """Add new connection."""
        connection = DatabaseConnection(
            id=str(uuid.uuid4()),
            name=name,
            db_type=db_type,
            **kwargs
        )
        
        connections = await self.get_all_connections()
        connections.append(connection)
        await self._save_connections(connections)
        
        return connection
    
    async def update_connection(self, connection_id: str, **kwargs) -> Optional[DatabaseConnection]:
        """Update connection by ID."""
        connections = await self.get_all_connections()
        
        for i, conn in enumerate(connections):
            if conn.id == connection_id:
                updated_data = conn.model_dump()
                updated_data.update(kwargs)
                updated_data['id'] = connection_id  # Preserve ID
                connections[i] = DatabaseConnection(**updated_data)
                await self._save_connections(connections)
                return connections[i]
        
        return None
    
    async def remove_connection(self, connection_id: str) -> bool:
        """Remove connection by ID."""
        connections = await self.get_all_connections()
        original_count = len(connections)
        connections = [conn for conn in connections if conn.id != connection_id]
        
        if len(connections) < original_count:
            await self._save_connections(connections)
            return True
        return False
    
    async def _save_connections(self, connections: List[DatabaseConnection]):
        """Save connections to storage."""
        data = {
            'connections': [conn.model_dump() for conn in connections]
        }
        
        with open(self.storage_path, 'w') as f:
            json.dump(data, f, indent=2)