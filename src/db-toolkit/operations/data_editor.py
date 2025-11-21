"""Production-ready data editing operations."""

from typing import Dict, Any, Optional, List
from connectors.factory import ConnectorFactory
from core.models import DatabaseConnection
from utils.logger import logger


class DataEditor:
    """Handles safe data editing with validation and constraints."""
    
    async def update_row(
        self,
        connection: DatabaseConnection,
        table: str,
        schema_name: str,
        primary_key: Dict[str, Any],
        changes: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a single row with validation."""
        if not primary_key:
            return {"success": False, "error": "Primary key required for update"}
        
        if not changes:
            return {"success": False, "error": "No changes provided"}
        
        try:
            connector = ConnectorFactory.create_connector(connection.db_type)
            await connector.connect(connection)
            
            # Build UPDATE query
            if connection.db_type.value == "mongodb":
                result = await self._update_mongodb(connector, table, primary_key, changes)
            else:
                result = await self._update_sql(connector, table, schema_name, primary_key, changes)
            
            await connector.disconnect()
            return result
            
        except Exception as e:
            logger.error(f"Update row failed on '{connection.name}.{table}': {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def insert_row(
        self,
        connection: DatabaseConnection,
        table: str,
        schema_name: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Insert a new row."""
        if not data:
            return {"success": False, "error": "No data provided"}
        
        try:
            connector = ConnectorFactory.create_connector(connection.db_type)
            await connector.connect(connection)
            
            if connection.db_type.value == "mongodb":
                result = await self._insert_mongodb(connector, table, data)
            else:
                result = await self._insert_sql(connector, table, schema_name, data)
            
            await connector.disconnect()
            return result
            
        except Exception as e:
            logger.error(f"Insert row failed on '{connection.name}.{table}': {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def delete_row(
        self,
        connection: DatabaseConnection,
        table: str,
        schema_name: str,
        primary_key: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Delete a row."""
        if not primary_key:
            return {"success": False, "error": "Primary key required for delete"}
        
        try:
            connector = ConnectorFactory.create_connector(connection.db_type)
            await connector.connect(connection)
            
            if connection.db_type.value == "mongodb":
                result = await self._delete_mongodb(connector, table, primary_key)
            else:
                result = await self._delete_sql(connector, table, schema_name, primary_key)
            
            await connector.disconnect()
            return result
            
        except Exception as e:
            logger.error(f"Delete row failed on '{connection.name}.{table}': {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _update_sql(
        self,
        connector,
        table: str,
        schema: str,
        primary_key: Dict[str, Any],
        changes: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update SQL row."""
        set_clause = ", ".join([f"{col} = '{val}'" for col, val in changes.items()])
        where_clause = " AND ".join([f"{col} = '{val}'" for col, val in primary_key.items()])
        
        if schema and schema != "main":
            query = f"UPDATE {schema}.{table} SET {set_clause} WHERE {where_clause}"
        else:
            query = f"UPDATE {table} SET {set_clause} WHERE {where_clause}"
        
        result = await connector.execute_query(query)
        
        if result.get("success"):
            return {"success": True, "message": "Row updated successfully"}
        else:
            return {"success": False, "error": result.get("error", "Update failed")}
    
    async def _insert_sql(
        self,
        connector,
        table: str,
        schema: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Insert SQL row."""
        columns = ", ".join(data.keys())
        values = ", ".join([f"'{val}'" for val in data.values()])
        
        if schema and schema != "main":
            query = f"INSERT INTO {schema}.{table} ({columns}) VALUES ({values})"
        else:
            query = f"INSERT INTO {table} ({columns}) VALUES ({values})"
        
        result = await connector.execute_query(query)
        
        if result.get("success"):
            return {"success": True, "message": "Row inserted successfully"}
        else:
            return {"success": False, "error": result.get("error", "Insert failed")}
    
    async def _delete_sql(
        self,
        connector,
        table: str,
        schema: str,
        primary_key: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Delete SQL row."""
        where_clause = " AND ".join([f"{col} = '{val}'" for col, val in primary_key.items()])
        
        if schema and schema != "main":
            query = f"DELETE FROM {schema}.{table} WHERE {where_clause}"
        else:
            query = f"DELETE FROM {table} WHERE {where_clause}"
        
        result = await connector.execute_query(query)
        
        if result.get("success"):
            return {"success": True, "message": "Row deleted successfully"}
        else:
            return {"success": False, "error": result.get("error", "Delete failed")}
    
    async def _update_mongodb(
        self,
        connector,
        collection: str,
        filter_doc: Dict[str, Any],
        changes: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update MongoDB document."""
        try:
            db = connector.connection.get_default_database()
            coll = db[collection]
            result = await coll.update_one(filter_doc, {"$set": changes})
            
            if result.modified_count > 0:
                return {"success": True, "message": "Document updated successfully"}
            else:
                return {"success": False, "error": "No document matched the filter"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _insert_mongodb(
        self,
        connector,
        collection: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Insert MongoDB document."""
        try:
            db = connector.connection.get_default_database()
            coll = db[collection]
            result = await coll.insert_one(data)
            
            return {"success": True, "message": "Document inserted successfully", "id": str(result.inserted_id)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _delete_mongodb(
        self,
        connector,
        collection: str,
        filter_doc: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Delete MongoDB document."""
        try:
            db = connector.connection.get_default_database()
            coll = db[collection]
            result = await coll.delete_one(filter_doc)
            
            if result.deleted_count > 0:
                return {"success": True, "message": "Document deleted successfully"}
            else:
                return {"success": False, "error": "No document matched the filter"}
        except Exception as e:
            return {"success": False, "error": str(e)}