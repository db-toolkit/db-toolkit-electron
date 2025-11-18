"""Schema exploration controller."""

import asyncio
from PySide6.QtCore import QObject, Signal, Slot, Property, QThread
from PySide6.QtQml import QmlElement
from typing import Optional, List, Dict, Any
from ...core.storage import connection_storage
from ...connectors.factory import ConnectorFactory
from ...utils.cache import metadata_cache
from ...utils.constants import QML_IMPORT_NAME, QML_IMPORT_MAJOR_VERSION, DEFAULT_CACHE_TTL
from ..models.tree_model import TreeModel


class SchemaWorker(QThread):
    """Worker thread for schema operations."""
    
    schemaLoaded = Signal(list)
    errorOccurred = Signal(str)
    
    def __init__(self, connection_id: str):
        """Initialize worker."""
        super().__init__()
        self.connection_id = connection_id
    
    def run(self) -> None:
        """Load schema data in background thread."""
        try:
            # Get connection
            connection = connection_storage.get_connection(self.connection_id)
            if not connection:
                self.errorOccurred.emit("Connection not found")
                return
            
            # Check cache first
            cache_key = f"schema_{self.connection_id}"
            cached_data = metadata_cache.get(cache_key)
            if cached_data:
                self.schemaLoaded.emit(cached_data)
                return
            
            # Create connector and fetch schema
            connector = ConnectorFactory.create_connector(connection)
            
            # Run async operations in event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                schema_data = loop.run_until_complete(self._fetch_schema_data(connector))
                
                # Cache the results
                metadata_cache.set(cache_key, schema_data, ttl=DEFAULT_CACHE_TTL)
                
                self.schemaLoaded.emit(schema_data)
                
            finally:
                loop.close()
                
        except Exception as e:
            self.errorOccurred.emit(f"Failed to load schema: {str(e)}")
    
    async def _fetch_schema_data(self, connector) -> List[Dict[str, Any]]:
        """Fetch complete schema data."""
        schema_data = []
        
        # Connect to database
        if not await connector.connect():
            raise Exception("Failed to connect to database")
        
        try:
            # Get schemas
            schemas = await connector.get_schemas()
            
            for schema in schemas:
                # Get tables in schema
                tables = await connector.get_tables(schema)
                
                for table in tables:
                    # Get columns for table
                    columns = await connector.get_columns(table, schema)
                    
                    for column in columns:
                        schema_data.append({
                            'schema': schema,
                            'table': table,
                            'column_name': column.get('column_name'),
                            'data_type': column.get('data_type'),
                            'is_nullable': column.get('is_nullable'),
                            'column_default': column.get('column_default')
                        })
        
        finally:
            await connector.disconnect()
        
        return schema_data


@QmlElement
class SchemaController(QObject):
    """Controller for schema exploration."""
    
    schemaModelChanged = Signal()
    loadingChanged = Signal()
    errorChanged = Signal()
    
    def __init__(self):
        """Initialize schema controller."""
        super().__init__()
        self._schema_model = TreeModel()
        self._loading = False
        self._error = ""
        self._current_connection_id = ""
        self._worker: Optional[SchemaWorker] = None
    
    @Property(TreeModel, notify=schemaModelChanged)
    def schemaModel(self) -> TreeModel:
        """Get schema model for QML."""
        return self._schema_model
    
    @Property(bool, notify=loadingChanged)
    def loading(self) -> bool:
        """Get loading state."""
        return self._loading
    
    @Property(str, notify=errorChanged)
    def error(self) -> str:
        """Get error message."""
        return self._error
    
    @Slot(str)
    def load_schema(self, connection_id: str) -> None:
        """Load schema for connection."""
        if self._loading:
            return
        
        self._current_connection_id = connection_id
        self._set_loading(True)
        self._set_error("")
        
        # Stop previous worker
        if self._worker and self._worker.isRunning():
            self._worker.terminate()
            self._worker.wait()
        
        # Start new worker
        self._worker = SchemaWorker(connection_id)
        self._worker.schemaLoaded.connect(self._on_schema_loaded)
        self._worker.errorOccurred.connect(self._on_error)
        self._worker.finished.connect(lambda: self._set_loading(False))
        self._worker.start()
    
    @Slot()
    def refresh_schema(self) -> None:
        """Refresh current schema."""
        if self._current_connection_id:
            # Clear cache for this connection
            cache_key = f"schema_{self._current_connection_id}"
            metadata_cache.clear(cache_key)
            
            # Reload schema
            self.load_schema(self._current_connection_id)
    
    def _on_schema_loaded(self, schema_data: List[Dict[str, Any]]) -> None:
        """Handle schema data loaded."""
        self._schema_model.load_schema_data(schema_data)
        self.schemaModelChanged.emit()
    
    @Slot(int)
    def toggle_item(self, row: int) -> None:
        """Toggle expanded state of tree item."""
        self._schema_model.toggle_expanded(row)
        self.schemaModelChanged.emit()
    
    def _on_error(self, error_message: str) -> None:
        """Handle error occurred."""
        self._set_error(error_message)
    
    def _set_loading(self, loading: bool) -> None:
        """Set loading state."""
        if self._loading != loading:
            self._loading = loading
            self.loadingChanged.emit()
    
    def _set_error(self, error: str) -> None:
        """Set error message."""
        if self._error != error:
            self._error = error
            self.errorChanged.emit()