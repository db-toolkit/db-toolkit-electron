"""CSV import/export operations."""

import csv
import io
from typing import Any, Dict, List, Optional

from connectors.base import BaseConnector
from core.models import DatabaseType
from utils.logger import logger

class CSVHandler:
    """Handle CSV import and export operations."""

    @staticmethod
    async def export_to_csv(
        connector: BaseConnector,
        table: str,
        schema: Optional[str] = None,
        query: Optional[str] = None,
        delimiter: str = ",",
        include_headers: bool = True,
    ) -> str:
        """Export table or query results to CSV string."""
        if query:
            result = await connector.execute_query(query)
        else:
            full_table = f"{schema}.{table}" if schema else table
            if connector.db_type == DatabaseType.MONGODB:
                result = await connector.execute_query(f"db.{table}.find()")
            else:
                result = await connector.execute_query(f"SELECT * FROM {full_table}")

        # Handle both dict and direct result formats
        if isinstance(result, dict):
            rows = result.get("rows") or result.get("data", [])
            columns = result.get("columns", [])
        else:
            rows = []
            columns = []

        if not rows or not columns:
            return ""

        output = io.StringIO()
        writer = csv.writer(output, delimiter=delimiter)
        
        if include_headers:
            writer.writerow(columns)

        for row in rows:
            writer.writerow(row)

        return output.getvalue()

    @staticmethod
    def validate_csv_data(
        csv_content: str, column_mapping: Dict[str, str]
    ) -> tuple[List[Dict[str, Any]], List[str]]:
        """Validate CSV data and return parsed rows with errors."""
        errors = []
        rows = []

        try:
            csv_file = io.StringIO(csv_content)
            reader = csv.DictReader(csv_file)

            for idx, row in enumerate(reader, start=2):
                mapped_row = {}
                for csv_col, db_col in column_mapping.items():
                    if csv_col in row:
                        value = row[csv_col].strip()
                        mapped_row[db_col] = value if value else None
                    else:
                        errors.append(f"Row {idx}: Missing column '{csv_col}'")

                if mapped_row:
                    rows.append(mapped_row)

        except csv.Error as e:
            logger.error(f"CSV parsing error: {str(e)}")
            errors.append(f"CSV parsing error: {str(e)}")
        except Exception as e:
            logger.error(f"CSV validation error: {str(e)}")
            errors.append(f"Validation error: {str(e)}")

        return rows, errors

    @staticmethod
    async def import_from_csv(
        connector: BaseConnector,
        table: str,
        rows: List[Dict[str, Any]],
        schema: Optional[str] = None,
        batch_size: int = 100,
    ) -> Dict[str, Any]:
        """Import CSV data into database table."""
        if not rows:
            return {"success": False, "error": "No data to import"}

        imported = 0
        failed = 0
        errors = []

        full_table = f"{schema}.{table}" if schema else table

        for i in range(0, len(rows), batch_size):
            batch = rows[i : i + batch_size]

            try:
                if connector.db_type == DatabaseType.MONGODB:
                    await connector._db[table].insert_many(batch)
                    imported += len(batch)
                else:
                    for row in batch:
                        columns = ", ".join(row.keys())
                        placeholders = ", ".join([f":{k}" for k in row.keys()])
                        query = f"INSERT INTO {full_table} ({columns}) VALUES ({placeholders})"

                        try:
                            await connector.execute_query(query, row)
                            imported += 1
                        except Exception as e:
                            logger.error(f"CSV import row {i + batch.index(row) + 1} failed: {str(e)}")
                            failed += 1
                            errors.append(f"Row {i + batch.index(row) + 1}: {str(e)}")

            except Exception as e:
                logger.error(f"CSV import batch {i // batch_size + 1} failed: {str(e)}")
                failed += len(batch)
                errors.append(f"Batch {i // batch_size + 1}: {str(e)}")

        return {
            "success": imported > 0,
            "imported": imported,
            "failed": failed,
            "errors": errors[:10],
            "total_errors": len(errors),
        }
