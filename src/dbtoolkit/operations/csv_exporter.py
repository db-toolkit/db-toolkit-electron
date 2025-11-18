"""CSV export operations."""

import csv
import time
import asyncio
from typing import List, Dict, Any, Optional, Callable
from pathlib import Path
from ..core.models import DatabaseConnection
from ..core.csv_models import ExportConfig, ExportProgress, ExportResult, ExportStatus
from ..connectors.factory import ConnectorFactory


class CSVExporter:
    """Handles CSV export operations."""
    
    def __init__(self, connection: DatabaseConnection):
        """Initialize CSV exporter."""
        self.connection = connection
        self.connector = ConnectorFactory.create_connector(connection)
        self._cancelled = False
    
    async def export_data(self, config: ExportConfig, 
                         progress_callback: Optional[Callable[[ExportProgress], None]] = None) -> ExportResult:
        """Export data to CSV file."""
        start_time = time.time()
        
        try:
            # Connect to database
            if not await self.connector.connect():
                return ExportResult(
                    status=ExportStatus.FAILED,
                    exported_rows=0,
                    file_size=0,
                    execution_time=time.time() - start_time,
                    error_message="Failed to connect to database"
                )
            
            # Build query
            query = self._build_export_query(config)
            
            # Get total row count for progress
            count_query = self._build_count_query(config)
            count_result = await self.connector.execute_query(count_query)
            total_rows = count_result[0].get('count', 0) if count_result else 0
            
            # Initialize progress
            progress = ExportProgress(
                total_rows=total_rows,
                exported_rows=0,
                current_batch=0,
                status=ExportStatus.IN_PROGRESS
            )
            
            if progress_callback:
                progress_callback(progress)
            
            # Execute export
            exported_rows = await self._execute_export(query, config, progress, progress_callback)
            
            # Get file size
            file_size = config.file_path.stat().st_size if config.file_path.exists() else 0
            
            return ExportResult(
                status=ExportStatus.COMPLETED if not self._cancelled else ExportStatus.CANCELLED,
                exported_rows=exported_rows,
                file_size=file_size,
                execution_time=time.time() - start_time
            )
            
        except Exception as e:
            return ExportResult(
                status=ExportStatus.FAILED,
                exported_rows=0,
                file_size=0,
                execution_time=time.time() - start_time,
                error_message=str(e)
            )
        
        finally:
            await self.connector.disconnect()
    
    def cancel_export(self) -> None:
        """Cancel ongoing export operation."""
        self._cancelled = True
    
    def _build_export_query(self, config: ExportConfig) -> str:
        """Build SQL query for export."""
        if config.query:
            query = config.query
        else:
            table_name = f"{config.schema_name}.{config.table_name}" if config.schema_name else config.table_name
            query = f"SELECT * FROM {table_name}"
        
        if config.limit:
            query += f" LIMIT {config.limit}"
        
        return query
    
    def _build_count_query(self, config: ExportConfig) -> str:
        """Build count query for progress tracking."""
        if config.query:
            return f"SELECT COUNT(*) as count FROM ({config.query}) as subquery"
        else:
            table_name = f"{config.schema_name}.{config.table_name}" if config.schema_name else config.table_name
            return f"SELECT COUNT(*) as count FROM {table_name}"
    
    async def _execute_export(self, query: str, config: ExportConfig, 
                            progress: ExportProgress, 
                            progress_callback: Optional[Callable[[ExportProgress], None]]) -> int:
        """Execute the actual export operation."""
        # Execute query
        data = await self.connector.execute_query(query)
        
        if not data:
            return 0
        
        # Create output directory if needed
        config.file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write CSV file
        with open(config.file_path, 'w', newline='', encoding=config.encoding) as csvfile:
            writer = csv.DictWriter(
                csvfile,
                fieldnames=list(data[0].keys()),
                delimiter=config.delimiter,
                quotechar=config.quote_char,
                quoting=csv.QUOTE_MINIMAL
            )
            
            # Write header
            if config.include_header:
                writer.writeheader()
            
            # Write data rows
            for i, row in enumerate(data):
                if self._cancelled:
                    break
                
                # Convert values to strings and handle None
                clean_row = {}
                for key, value in row.items():
                    if value is None:
                        clean_row[key] = ""
                    else:
                        clean_row[key] = str(value)
                
                writer.writerow(clean_row)
                
                # Update progress
                progress.exported_rows = i + 1
                if progress_callback and (i + 1) % 100 == 0:
                    progress_callback(progress)
        
        return len(data)