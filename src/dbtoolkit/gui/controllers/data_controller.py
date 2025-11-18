"""Data editing controller for UI integration."""

import asyncio
from PySide6.QtCore import QObject, Signal, Slot, Property, QThread
from PySide6.QtQml import QmlElement
from typing import List, Dict, Any, Optional
from ...core.storage import connection_storage
from ...core.data_editor import EditSession, ValidationError
from ...operations.data_editor import DataEditor
from ...utils.constants import QML_IMPORT_NAME, QML_IMPORT_MAJOR_VERSION
import asyncio


class DataEditWorker(QThread):
    """Worker thread for data editing operations."""
    
    editCompleted = Signal(bool, str)  # success, message
    
    def __init__(self, connection_id: str, operation: str, **kwargs):
        """Initialize data edit worker."""
        super().__init__()
        self.connection_id = connection_id
        self.operation = operation
        self.kwargs = kwargs
    
    def run(self) -> None:
        """Execute data operation in background thread."""
        try:
            connection = connection_storage.get_connection(self.connection_id)
            if not connection:
                self.editCompleted.emit(False, "Connection not found")
                return
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                editor = DataEditor(connection)
                
                if self.operation == "update_cell":
                    success = loop.run_until_complete(
                        editor.update_cell(**self.kwargs)
                    )
                    message = "Cell updated successfully" if success else "Update failed"
                
                elif self.operation == "commit":
                    success = loop.run_until_complete(editor.commit_changes())
                    message = "Changes committed successfully" if success else "Commit failed"
                
                elif self.operation == "rollback":
                    success = loop.run_until_complete(editor.rollback_changes())
                    message = "Changes rolled back successfully" if success else "Rollback failed"
                
                else:
                    success = False
                    message = f"Unknown operation: {self.operation}"
                
                self.editCompleted.emit(success, message)
                
            finally:
                loop.close()
                
        except ValidationError as e:
            self.editCompleted.emit(False, str(e))
        except Exception as e:
            self.editCompleted.emit(False, f"Operation failed: {str(e)}")


@QmlElement
class DataController(QObject):
    """Controller for data editing operations."""
    
    editCompleted = Signal(bool, str, arguments=['success', 'message'])
    editingChanged = Signal()
    changesChanged = Signal()
    
    def __init__(self):
        """Initialize data controller."""
        super().__init__()
        self._editing = False
        self._current_connection_id = ""
        self._pending_changes = 0
        self._worker: Optional[DataEditWorker] = None
    
    @Property(bool, notify=editingChanged)
    def editing(self) -> bool:
        """Get editing state."""
        return self._editing
    
    @Property(int, notify=changesChanged)
    def pendingChanges(self) -> int:
        """Get number of pending changes."""
        return self._pending_changes
    
    @Slot(str)
    def set_connection(self, connection_id: str) -> None:
        """Set current connection."""
        self._current_connection_id = connection_id
        self._pending_changes = 0
        self.changesChanged.emit()
    
    @Slot(str, str, str, str, str)
    def update_cell(self, table: str, row_id: str, column: str, new_value: str, schema: str = "") -> None:
        """Update a single cell value."""
        if self._editing or not self._current_connection_id:
            return
        
        self._set_editing(True)
        
        # Stop previous worker
        if self._worker and self._worker.isRunning():
            self._worker.terminate()
            self._worker.wait()
        
        # Start new worker
        kwargs = {
            'table': table,
            'row_id': row_id,
            'column': column,
            'new_value': new_value,
            'schema': schema if schema else None
        }
        
        self._worker = DataEditWorker(self._current_connection_id, "update_cell", **kwargs)
        self._worker.editCompleted.connect(self._on_edit_completed)
        self._worker.finished.connect(lambda: self._set_editing(False))
        self._worker.start()
    
    @Slot()
    def commit_changes(self) -> None:
        """Commit all pending changes."""
        if self._editing or not self._current_connection_id:
            return
        
        self._set_editing(True)
        
        self._worker = DataEditWorker(self._current_connection_id, "commit")
        self._worker.editCompleted.connect(self._on_edit_completed)
        self._worker.finished.connect(lambda: self._set_editing(False))
        self._worker.start()
    
    @Slot()
    def rollback_changes(self) -> None:
        """Rollback all pending changes."""
        if self._editing or not self._current_connection_id:
            return
        
        self._set_editing(True)
        
        self._worker = DataEditWorker(self._current_connection_id, "rollback")
        self._worker.editCompleted.connect(self._on_edit_completed)
        self._worker.finished.connect(lambda: self._set_editing(False))
        self._worker.start()
    
    def _on_edit_completed(self, success: bool, message: str) -> None:
        """Handle edit operation completion."""
        if success:
            if "updated" in message.lower():
                self._pending_changes += 1
            elif "committed" in message.lower() or "rolled back" in message.lower():
                self._pending_changes = 0
                # Trigger schema/data refresh
                self._refresh_after_commit()
            
            self.changesChanged.emit()
        
        self.editCompleted.emit(success, message)
    
    def _refresh_after_commit(self) -> None:
        """Refresh schema and data after commit."""
        # Signal to refresh data views
        from ...operations.schema_updater import SchemaUpdater
        
        if self._current_connection_id:
            connection = connection_storage.get_connection(self._current_connection_id)
            if connection:
                updater = SchemaUpdater(connection)
                # Invalidate cache to force refresh
                asyncio.create_task(updater.invalidate_schema_cache())
    
    def _set_editing(self, editing: bool) -> None:
        """Set editing state."""
        if self._editing != editing:
            self._editing = editing
            self.editingChanged.emit()