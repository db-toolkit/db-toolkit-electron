"""MongoDB database connector."""

from motor.motor_asyncio import AsyncIOMotorClient
from typing import Dict, List, Any
from connectors.base import BaseConnector
from core.models import DatabaseConnection


class MongoDBConnector(BaseConnector):
    """MongoDB database connector."""
    
    async def connect(self, config: DatabaseConnection) -> bool:
        """Connect to MongoDB database."""
        try:
            self.connection = AsyncIOMotorClient(
                host=config.host,
                port=config.port or 27017,
                username=config.username,
                password=config.password
            )
            # Test connection
            await self.connection.admin.command('ping')
            self.is_connected = True
            return True
        except Exception:
            self.is_connected = False
            return False
    
    async def disconnect(self) -> bool:
        """Disconnect from MongoDB."""
        try:
            if self.connection:
                self.connection.close()
            self.is_connected = False
            return True
        except Exception:
            return False
    
    async def test_connection(self, config: DatabaseConnection) -> Dict[str, Any]:
        """Test MongoDB connection."""
        try:
            client = AsyncIOMotorClient(
                host=config.host,
                port=config.port or 27017,
                username=config.username,
                password=config.password
            )
            await client.admin.command('ping')
            client.close()
            return {"success": True, "message": "Connection successful"}
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    async def get_schemas(self) -> List[str]:
        """Get MongoDB databases."""
        db_list = await self.connection.list_database_names()
        return [db for db in db_list if db not in ('admin', 'local', 'config')]
    
    async def get_tables(self, schema: str = None) -> List[str]:
        """Get MongoDB collections."""
        if not schema:
            return []
        db = self.connection[schema]
        return await db.list_collection_names()
    
    async def get_columns(self, table: str, schema: str = None) -> List[Dict[str, Any]]:
        """Get MongoDB collection fields."""
        if not schema:
            return []
        
        db = self.connection[schema]
        collection = db[table]
        
        # Sample document to infer schema
        sample = await collection.find_one()
        if not sample:
            return []
        
        columns = []
        for key, value in sample.items():
            columns.append({
                "column_name": key,
                "data_type": type(value).__name__,
                "is_nullable": "YES",
                "column_default": None
            })
        
        return columns
    
    async def execute_query(self, query: str) -> Dict[str, Any]:
        """Execute MongoDB query."""
        try:
            import json
            
            # Parse query as JSON for filter
            if query.strip().startswith('{'):
                filter_doc = json.loads(query)
            else:
                filter_doc = {}
            
            # Use default database and collection for now
            # In production, this would be configurable
            db = self.connection.get_default_database()
            if not db:
                return {"success": False, "error": "No database specified"}
            
            # Get first collection for demo
            collections = await db.list_collection_names()
            if not collections:
                return {"success": False, "error": "No collections found"}
            
            collection = db[collections[0]]
            cursor = collection.find(filter_doc).limit(100)
            documents = await cursor.to_list(length=100)
            
            if documents:
                # Get all unique keys from documents
                all_keys = set()
                for doc in documents:
                    all_keys.update(doc.keys())
                
                columns = list(all_keys)
                data = [[str(doc.get(col, "")) for col in columns] for doc in documents]
                
                return {
                    "success": True,
                    "columns": columns,
                    "data": data,
                    "row_count": len(documents)
                }
            
            return {"success": True, "columns": [], "data": [], "row_count": 0}
            
        except Exception as e:
            return {"success": False, "error": str(e)}