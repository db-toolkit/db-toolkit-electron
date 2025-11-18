"""Query execution controller."""

import asyncio
from PySide6.QtCore import QObject, Signal, Slot, Property, QThread
from PySide6.QtQml import QmlElement
from typing import List, Dict, Any, Optional
from ...core.storage import connection_storage
from ...core.query import QueryResult
from ...operations.query_executor import QueryExecutor
from ...operations.query_history import query_history
from ...operations.query_validator import QueryValidator
from ...utils.constants import QML_IMPORT_NAME, QML_IMPORT_MAJOR_VERSION


class QueryWorker(QThread):
    """Worker thread for query execution."""
    
    queryCompleted = Signal(bool, list, list, int, float, str)  # success, data, columns, row_count, time, error
    
    def __init__(self, connection_id: str, query: str):
        """Initialize query worker."""
        super().__init__()
        self.connection_id = connection_id
        self.query = query
    
    def run(self) -> None:
        """Execute query in background thread."""
        try:
            connection = connection_storage.get_connection(self.connection_id)
            if not connection:
                self.queryCompleted.emit(False, [], [], 0, 0.0, "Connection not found")
                return
            
            # Validate query
            is_valid, errors = QueryValidator.validate_query(query=self.query, db_type=connection.db_type)
            if not is_valid:
                self.queryCompleted.emit(False, [], [], 0, 0.0, "; ".join(errors))
                return
            
            # Execute query
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                executor = QueryExecutor(connection)
                result = loop.run_until_complete(executor.execute_query(self.query))
                
                # Add to history
                query_history.add_query(self.connection_id, self.query, result)
                
                # Emit result
                self.queryCompleted.emit(
                    result.success,
                    result.data,
                    result.columns,
                    result.row_count,
                    result.execution_time,
                    result.error_message or ""
                )
                
            finally:
                loop.close()
                
        except Exception as e:
            self.queryCompleted.emit(False, [], [], 0, 0.0, str(e))


@QmlElement
class QueryController(QObject):
    """Controller for query execution."""
    
    queryCompleted = Signal(bool, list, list, int, float, str, arguments=[
        'success', 'data', 'columns', 'rowCount', 'executionTime', 'errorMessage'
    ])
    executingChanged = Signal()
    historyChanged = Signal()
    
    def __init__(self):
        """Initialize query controller."""
        super().__init__()\n        self._executing = False
        self._current_connection_id = ""
        self._worker: Optional[QueryWorker] = None
    
    @Property(bool, notify=executingChanged)
    def executing(self) -> bool:
        """Get execution state."""
        return self._executing
    
    @Property(list, notify=historyChanged)
    def history(self) -> List[Dict[str, Any]]:
        """Get query history for current connection."""
        if not self._current_connection_id:
            return []
        
        history_items = query_history.get_history(self._current_connection_id, limit=20)
        return [item.to_dict() for item in history_items]
    
    @Slot(str)
    def set_connection(self, connection_id: str) -> None:
        """Set current connection."""
        self._current_connection_id = connection_id
        self.historyChanged.emit()
    
    @Slot(str)
    def execute_query(self, query: str) -> None:
        """Execute query against current connection."""
        if self._executing or not self._current_connection_id:
            return
        
        query = query.strip()
        if not query:
            return
        
        self._set_executing(True)
        
        # Stop previous worker
        if self._worker and self._worker.isRunning():
            self._worker.terminate()
            self._worker.wait()
        
        # Start new worker
        self._worker = QueryWorker(self._current_connection_id, query)
        self._worker.queryCompleted.connect(self._on_query_completed)
        self._worker.finished.connect(lambda: self._set_executing(False))
        self._worker.start()
    
    @Slot(str, result=bool)
    def validate_query(self, query: str) -> bool:
        """Validate query syntax."""
        if not self._current_connection_id:
            return False
        
        connection = connection_storage.get_connection(self._current_connection_id)
        if not connection:
            return False
        
        is_valid, _ = QueryValidator.validate_query(query, connection.db_type)
        return is_valid
    
    @Slot(str, result=bool)
    def is_read_only(self, query: str) -> bool:
        """Check if query is read-only."""
        return QueryValidator.is_read_only_query(query)
    
    @Slot()
    def clear_history(self) -> None:
        """Clear query history for current connection."""
        if self._current_connection_id:
            query_history.clear_history(self._current_connection_id)
            self.historyChanged.emit()
    
    @Slot(str, result=list)
    def search_history(self, search_term: str) -> List[Dict[str, Any]]:
        """Search query history."""
        if not self._current_connection_id:
            return []
        
        results = query_history.search_history(self._current_connection_id, search_term)
        return [item.to_dict() for item in results]
    
    def _on_query_completed(self, success: bool, data: List[Dict[str, Any]], 
                           columns: List[str], row_count: int, execution_time: float, 
                           error_message: str) -> None:
        """Handle query completion."""
        self.queryCompleted.emit(success, data, columns, row_count, execution_time, error_message)
        self.historyChanged.emit()  # Refresh history
    
    def _set_executing(self, executing: bool) -> None:
        """Set executing state."""
        if self._executing != executing:
            self._executing = executing
            self.executingChanged.emit()