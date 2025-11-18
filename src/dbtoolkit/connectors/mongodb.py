"""MongoDB database connector."""

from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict, Any, Optional
from .base import DatabaseConnector


class MongoDBConnector(DatabaseConnector):
    """MongoDB database connector using motor."""
    
    async def connect(self) -> bool:
        """Establish MongoDB connection."""
        try:
            connection_string = f"mongodb://{self.connection.username}:{self.connection.password}@{self.connection.host}:{self.connection.port}"
            self._client = AsyncIOMotorClient(connection_string)
            # Test connection
            await self._client.admin.command('ping')
            return True
        except Exception as e:
            print(f"MongoDB connection failed: {e}")
            return False
    
    async def disconnect(self) -> None:
        """Close MongoDB connection."""
        if self._client:
            self._client.close()
            self._client = None
    
    async def test_connection(self) -> bool:
        """Test MongoDB connection."""
        if not self.is_connected:
            return await self.connect()
        
        try:
            await self._client.admin.command('ping')
            return True
        except Exception:
            return False
    
    async def get_schemas(self) -> List[str]:
        """Get list of MongoDB databases."""
        db_list = await self._client.list_database_names()
        return [db for db in db_list if db not in ('admin', 'local', 'config')]
    
    async def get_tables(self, schema: Optional[str] = None) -> List[str]:
        """Get list of collections in database."""
        if not schema:
            schema = self.connection.database
        
        db = self._client[schema]
        collections = await db.list_collection_names()
        return collections
    
    async def get_columns(self, table: str, schema: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get field information for collection (sample first document)."""
        if not schema:
            schema = self.connection.database
        
        db = self._client[schema]
        collection = db[table]
        
        # Sample first document to get field structure
        sample_doc = await collection.find_one()
        if not sample_doc:
            return []
        
        columns = []
        for field_name, field_value in sample_doc.items():
            columns.append({
                'column_name': field_name,
                'data_type': type(field_value).__name__,
                'is_nullable': True,
                'column_default': None
            })
        
        return columns
    
    async def execute_query(self, query: str) -> List[Dict[str, Any]]:
        """Execute MongoDB query."""
        query = query.strip()
        
        # Handle basic MongoDB operations
        if query.startswith('db.'):
            # Parse collection and operation
            parts = query.split('.')
            if len(parts) >= 3:
                collection_name = parts[1]
                operation = parts[2].split('(')[0]
                
                db = self._client[self.connection.database or 'test']
                collection = db[collection_name]
                
                if operation == 'find':
                    cursor = collection.find().limit(100)  # Limit results
                    documents = await cursor.to_list(length=100)
                    return [dict(doc) for doc in documents]
                elif operation == 'count_documents' or operation == 'countDocuments':
                    count = await collection.count_documents({})
                    return [{'count': count}]
        
        elif query.startswith('show collections'):
            db = self._client[self.connection.database or 'test']
            collections = await db.list_collection_names()
            return [{'collection': name} for name in collections]
        
        elif query.startswith('show dbs'):
            dbs = await self._client.list_database_names()
            return [{'database': name} for name in dbs]
        
        # Default: return empty result
        return []