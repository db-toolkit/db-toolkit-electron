"""CSV import operations."""

import csv
import time
import asyncio
from typing import List, Dict, Any, Optional, Callable
from pathlib import Path
from ..core.models import DatabaseConnection, DatabaseType
from ..core.csv_models import ImportConfig, ImportProgress, ImportResult, ImportStatus, ValidationError, ColumnMapping
from ..connectors.factory import ConnectorFactory
from ..operations.data_validator import DataValidator


class CSVImporter:
    """Handles CSV import operations."""
    
    def __init__(self, connection: DatabaseConnection):
        """Initialize CSV importer."""
        self.connection = connection
        self.connector = ConnectorFactory.create_connector(connection)
        self._cancelled = False
    
    async def import_data(self, config: ImportConfig, 
                         progress_callback: Optional[Callable[[ImportProgress], None]] = None) -> ImportResult:
        """Import CSV data to database table."""
        start_time = time.time()
        validation_errors = []
        
        try:
            # Connect to database
            if not await self.connector.connect():
                return ImportResult(
                    status=ImportStatus.FAILED,
                    total_rows=0,
                    successful_rows=0,
                    failed_rows=0,
                    validation_errors=[],
                    execution_time=time.time() - start_time,
                    error_message="Failed to connect to database"
                )
            
            # Count total rows for progress
            total_rows = self._count_csv_rows(config)
            
            # Initialize progress
            progress = ImportProgress(
                total_rows=total_rows,
                processed_rows=0,
                successful_rows=0,
                failed_rows=0,
                current_batch=0,
                status=ImportStatus.IN_PROGRESS
            )
            
            if progress_callback:
                progress_callback(progress)
            
            # Process CSV file in batches
            successful_rows, failed_rows, validation_errors = await self._process_csv_batches(
                config, progress, progress_callback
            )
            
            return ImportResult(
                status=ImportStatus.COMPLETED if not self._cancelled else ImportStatus.CANCELLED,
                total_rows=total_rows,
                successful_rows=successful_rows,
                failed_rows=failed_rows,
                validation_errors=validation_errors,
                execution_time=time.time() - start_time
            )
            
        except Exception as e:
            return ImportResult(
                status=ImportStatus.FAILED,
                total_rows=0,
                successful_rows=0,
                failed_rows=0,
                validation_errors=validation_errors,
                execution_time=time.time() - start_time,
                error_message=str(e)
            )
        
        finally:
            await self.connector.disconnect()
    
    def cancel_import(self) -> None:
        """Cancel ongoing import operation."""
        self._cancelled = True
    
    def _count_csv_rows(self, config: ImportConfig) -> int:
        """Count total rows in CSV file."""
        try:
            with open(config.file_path, 'r', encoding=config.encoding) as csvfile:
                reader = csv.reader(csvfile, delimiter=config.delimiter)
                
                # Skip header and initial rows
                skip_count = config.skip_rows
                if config.has_header:
                    skip_count += 1
                
                for _ in range(skip_count):
                    next(reader, None)
                
                return sum(1 for _ in reader)
        except Exception:
            return 0
    
    async def _process_csv_batches(self, config: ImportConfig, progress: ImportProgress,
                                 progress_callback: Optional[Callable[[ImportProgress], None]]) -> tuple:
        """Process CSV file in batches."""
        successful_rows = 0
        failed_rows = 0
        validation_errors = []
        
        with open(config.file_path, 'r', encoding=config.encoding) as csvfile:
            reader = csv.DictReader(
                csvfile,
                delimiter=config.delimiter,
                quotechar=config.quote_char
            )
            
            # Skip initial rows
            for _ in range(config.skip_rows):
                next(reader, None)
            
            batch_data = []
            row_number = config.skip_rows + (1 if config.has_header else 0)
            
            for row in reader:
                if self._cancelled:
                    break
                
                row_number += 1
                
                # Validate and transform row
                validated_row, row_errors = self._validate_row(row, config.column_mappings, row_number)
                
                if row_errors:
                    validation_errors.extend(row_errors)
                    failed_rows += 1
                else:
                    batch_data.append(validated_row)
                
                # Process batch when full
                if len(batch_data) >= config.batch_size:
                    batch_success = await self._insert_batch(batch_data, config)
                    if batch_success:
                        successful_rows += len(batch_data)
                    else:
                        failed_rows += len(batch_data)
                    
                    batch_data.clear()
                    progress.current_batch += 1
                
                # Update progress
                progress.processed_rows = row_number - (config.skip_rows + (1 if config.has_header else 0))
                progress.successful_rows = successful_rows
                progress.failed_rows = failed_rows
                
                if progress_callback and progress.processed_rows % 100 == 0:
                    progress_callback(progress)
            
            # Process remaining batch
            if batch_data and not self._cancelled:
                batch_success = await self._insert_batch(batch_data, config)
                if batch_success:
                    successful_rows += len(batch_data)
                else:
                    failed_rows += len(batch_data)
        
        return successful_rows, failed_rows, validation_errors
    
    def _validate_row(self, row: Dict[str, str], mappings: List[ColumnMapping], 
                     row_number: int) -> tuple:
        """Validate and transform a CSV row."""
        validated_row = {}
        errors = []
        
        for mapping in mappings:
            csv_value = row.get(mapping.csv_column, "")
            
            # Handle empty values
            if not csv_value and mapping.is_required:
                if mapping.default_value is not None:
                    validated_row[mapping.db_column] = mapping.default_value
                else:
                    errors.append(ValidationError(
                        row_number=row_number,
                        column=mapping.csv_column,
                        value=csv_value,
                        error_message=f"Required field '{mapping.csv_column}' is empty"
                    ))
                    continue
            
            # Sanitize and validate value
            try:
                sanitized_value = DataValidator.sanitize_value(csv_value, mapping.data_type)
                validated_row[mapping.db_column] = sanitized_value
            except Exception as e:
                errors.append(ValidationError(
                    row_number=row_number,
                    column=mapping.csv_column,
                    value=csv_value,
                    error_message=f"Invalid value: {str(e)}"
                ))
        
        return validated_row, errors
    
    async def _insert_batch(self, batch_data: List[Dict[str, Any]], config: ImportConfig) -> bool:
        """Insert a batch of validated data."""
        if not batch_data:
            return True
        
        try:
            table_name = f"{config.schema_name}.{config.table_name}" if config.schema_name else config.table_name
            
            # Build INSERT query
            columns = list(batch_data[0].keys())
            placeholders = ", ".join(["%s"] * len(columns))
            
            if config.on_duplicate == "update":
                # Get primary key columns for conflict resolution
                pk_columns = await self._get_primary_key_columns(table_name, config.schema_name)
                
                if pk_columns and self.connection.db_type == DatabaseType.POSTGRESQL:
                    # PostgreSQL UPSERT
                    conflict_columns = ", ".join(pk_columns)
                    update_clause = ", ".join([f"{col} = EXCLUDED.{col}" for col in columns if col not in pk_columns])
                    query = f"""
                    INSERT INTO {table_name} ({', '.join(columns)}) 
                    VALUES ({placeholders})
                    ON CONFLICT ({conflict_columns}) DO UPDATE SET {update_clause}
                    """
                elif pk_columns and self.connection.db_type == DatabaseType.MYSQL:
                    # MySQL UPSERT
                    update_clause = ", ".join([f"{col} = VALUES({col})" for col in columns if col not in pk_columns])
                    query = f"""
                    INSERT INTO {table_name} ({', '.join(columns)}) 
                    VALUES ({placeholders})
                    ON DUPLICATE KEY UPDATE {update_clause}
                    """
                else:
                    # Fallback to simple INSERT
                    query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
            else:
                # Simple INSERT
                query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
            
            # Execute batch insert
            for row in batch_data:
                values = [row[col] for col in columns]
                formatted_query = query
                for value in values:
                    formatted_query = formatted_query.replace("%s", f"'{value}'", 1)
                
                await self.connector.execute_query(formatted_query)
            
            return True
            
        except Exception:
            return False
    
    async def _get_primary_key_columns(self, table_name: str, schema_name: Optional[str]) -> List[str]:
        """Get primary key columns for the table."""
        try:
            if self.connection.db_type == DatabaseType.POSTGRESQL:
                schema = schema_name or 'public'
                query = """
                SELECT kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name
                WHERE tc.constraint_type = 'PRIMARY KEY' 
                    AND tc.table_name = %s AND tc.table_schema = %s
                ORDER BY kcu.ordinal_position
                """
                query = query.replace('%s', f"'{table_name.split('.')[-1]}'").replace('%s', f"'{schema}'")
                
            elif self.connection.db_type == DatabaseType.MYSQL:
                db_name = schema_name or self.connection.database
                query = f"""
                SELECT COLUMN_NAME as column_name
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE CONSTRAINT_NAME = 'PRIMARY' 
                    AND TABLE_NAME = '{table_name.split('.')[-1]}' 
                    AND TABLE_SCHEMA = '{db_name}'
                ORDER BY ORDINAL_POSITION
                """
                
            elif self.connection.db_type == DatabaseType.SQLITE:
                query = f"PRAGMA table_info({table_name.split('.')[-1]})"
                
            else:
                return []
            
            result = await self.connector.execute_query(query)
            
            if self.connection.db_type == DatabaseType.SQLITE:
                return [row['name'] for row in result if row.get('pk')]
            else:
                return [row['column_name'] for row in result]
                
        except Exception:
            return []