"""CSV import/export controller for UI integration."""

import asyncio
from pathlib import Path
from PySide6.QtCore import QObject, Signal, Slot, Property, QThread
from PySide6.QtQml import QmlElement
from typing import List, Dict, Any, Optional
from ...core.storage import connection_storage
from ...core.csv_models import ImportConfig, ExportConfig, ColumnMapping, ImportProgress, ExportProgress
from ...operations.csv_importer import CSVImporter
from ...operations.csv_exporter import CSVExporter
from ...utils.constants import QML_IMPORT_NAME, QML_IMPORT_MAJOR_VERSION
import asyncio


class CSVWorker(QThread):
    """Worker thread for CSV operations."""
    
    operationCompleted = Signal(bool, str, dict)  # success, message, result_data
    progressUpdated = Signal(float, str)  # progress_percent, status_message
    
    def __init__(self, connection_id: str, operation: str, **kwargs):
        """Initialize CSV worker."""
        super().__init__()
        self.connection_id = connection_id
        self.operation = operation
        self.kwargs = kwargs
        self.processor = None
    
    def run(self) -> None:
        """Execute CSV operation in background thread."""
        try:
            connection = connection_storage.get_connection(self.connection_id)
            if not connection:
                self.operationCompleted.emit(False, "Connection not found", {})
                return
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                if self.operation == "import":
                    self.processor = CSVImporter(connection)
                    result = loop.run_until_complete(
                        self.processor.import_data(
                            self.kwargs['config'],
                            progress_callback=self._on_import_progress
                        )
                    )
                    
                    self.operationCompleted.emit(
                        result.status.value == "completed",
                        f"Import completed: {result.successful_rows} rows imported, {result.failed_rows} failed",
                        {
                            'total_rows': result.total_rows,
                            'successful_rows': result.successful_rows,
                            'failed_rows': result.failed_rows,
                            'execution_time': result.execution_time
                        }
                    )
                
                elif self.operation == "export":
                    self.processor = CSVExporter(connection)
                    result = loop.run_until_complete(
                        self.processor.export_data(
                            self.kwargs['config'],
                            progress_callback=self._on_export_progress
                        )
                    )
                    
                    self.operationCompleted.emit(
                        result.status.value == "completed",
                        f"Export completed: {result.exported_rows} rows exported",
                        {
                            'exported_rows': result.exported_rows,
                            'file_size': result.file_size,
                            'execution_time': result.execution_time
                        }
                    )
                
            finally:
                loop.close()
                
        except Exception as e:
            self.operationCompleted.emit(False, f"Operation failed: {str(e)}", {})
    
    def cancel_operation(self) -> None:
        """Cancel the ongoing operation."""
        if self.processor:
            if hasattr(self.processor, 'cancel_import'):
                self.processor.cancel_import()
            elif hasattr(self.processor, 'cancel_export'):
                self.processor.cancel_export()
    
    def _on_import_progress(self, progress: ImportProgress) -> None:
        """Handle import progress updates."""
        message = f"Importing... {progress.processed_rows}/{progress.total_rows} rows"
        self.progressUpdated.emit(progress.progress_percent, message)
    
    def _on_export_progress(self, progress: ExportProgress) -> None:
        """Handle export progress updates."""
        message = f"Exporting... {progress.exported_rows}/{progress.total_rows} rows"
        self.progressUpdated.emit(progress.progress_percent, message)


@QmlElement
class CSVController(QObject):
    """Controller for CSV import/export operations."""
    
    operationCompleted = Signal(bool, str, dict, arguments=['success', 'message', 'resultData'])
    progressUpdated = Signal(float, str, arguments=['progressPercent', 'statusMessage'])
    operatingChanged = Signal()
    
    def __init__(self):
        """Initialize CSV controller."""
        super().__init__()
        self._operating = False
        self._current_connection_id = ""
        self._worker: Optional[CSVWorker] = None
    
    @Property(bool, notify=operatingChanged)
    def operating(self) -> bool:
        """Get operation state."""
        return self._operating
    
    @Slot(str)
    def set_connection(self, connection_id: str) -> None:
        """Set current connection."""
        self._current_connection_id = connection_id
    
    @Slot(str, str, str, list, bool, str, str, str, int, int, str)
    def import_csv(self, file_path: str, table_name: str, schema_name: str, 
                   column_mappings: List[Dict], has_header: bool, delimiter: str,
                   quote_char: str, encoding: str, skip_rows: int, batch_size: int,
                   on_duplicate: str) -> None:
        """Import CSV file to database table."""
        if self._operating or not self._current_connection_id:
            return
        
        try:
            # Convert column mappings
            mappings = []
            for mapping_dict in column_mappings:
                mappings.append(ColumnMapping(
                    csv_column=mapping_dict['csv_column'],
                    db_column=mapping_dict['db_column'],
                    data_type=mapping_dict['data_type'],
                    is_required=mapping_dict['is_required'],
                    default_value=mapping_dict.get('default_value')
                ))
            
            # Create import config
            config = ImportConfig(
                file_path=Path(file_path),
                table_name=table_name,
                schema_name=schema_name if schema_name else None,
                column_mappings=mappings,
                has_header=has_header,
                delimiter=delimiter,
                quote_char=quote_char,
                encoding=encoding,
                skip_rows=skip_rows,
                batch_size=batch_size,
                on_duplicate=on_duplicate
            )
            
            self._start_operation("import", config=config)
            
        except Exception as e:
            self.operationCompleted.emit(False, f"Import setup failed: {str(e)}", {})
    
    @Slot(str, str, str, str, bool, str, str, str, int)
    def export_csv(self, file_path: str, table_name: str, schema_name: str, query: str,
                   include_header: bool, delimiter: str, quote_char: str, encoding: str,
                   limit: int) -> None:
        """Export data to CSV file."""
        if self._operating or not self._current_connection_id:
            return
        
        try:
            # Create export config
            config = ExportConfig(
                file_path=Path(file_path),
                table_name=table_name if table_name else None,
                schema_name=schema_name if schema_name else None,
                query=query if query else None,
                include_header=include_header,
                delimiter=delimiter,
                quote_char=quote_char,
                encoding=encoding,
                limit=limit if limit > 0 else None
            )
            
            self._start_operation("export", config=config)
            
        except Exception as e:
            self.operationCompleted.emit(False, f"Export setup failed: {str(e)}", {})
    
    @Slot()
    def cancel_operation(self) -> None:
        """Cancel ongoing operation."""
        if self._worker and self._worker.isRunning():
            self._worker.cancel_operation()
            self._worker.terminate()
            self._worker.wait()
            self._set_operating(False)
    
    def _start_operation(self, operation: str, **kwargs) -> None:
        """Start CSV operation."""
        self._set_operating(True)
        
        # Stop previous worker
        if self._worker and self._worker.isRunning():
            self._worker.terminate()
            self._worker.wait()
        
        # Start new worker
        self._worker = CSVWorker(self._current_connection_id, operation, **kwargs)
        self._worker.operationCompleted.connect(self._on_operation_completed)
        self._worker.progressUpdated.connect(self.progressUpdated.emit)
        self._worker.finished.connect(lambda: self._set_operating(False))
        self._worker.start()
    
    def _on_operation_completed(self, success: bool, message: str, result_data: Dict[str, Any]) -> None:
        """Handle operation completion."""
        if success:
            # Refresh schema and data after successful import/export
            self._refresh_after_operation()
        
        self.operationCompleted.emit(success, message, result_data)
    
    def _refresh_after_operation(self) -> None:
        """Refresh schema and data views after CSV operations."""
        from ...operations.schema_updater import SchemaUpdater
        
        if self._current_connection_id:
            connection = connection_storage.get_connection(self._current_connection_id)
            if connection:
                updater = SchemaUpdater(connection)
                # Invalidate cache to force refresh of schema and data
                asyncio.create_task(updater.invalidate_schema_cache())
    
    def _set_operating(self, operating: bool) -> None:
        """Set operating state."""
        if self._operating != operating:
            self._operating = operating
            self.operatingChanged.emit()