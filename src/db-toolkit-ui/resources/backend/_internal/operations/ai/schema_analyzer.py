"""Schema Analyzer for DBAssist AI functionality."""

from utils.logger import logger
from typing import Dict, List, Any
from core.config import settings
from .cloudflare_client import CloudflareAIClient
from .prompts import SCHEMA_ANALYSIS_PROMPT, SCHEMA_RECOMMENDATIONS_PROMPT, SYSTEM_PROMPT


class SchemaAnalyzer:
    """AI assistant for database schema analysis."""

    def __init__(self):
        """Initialize schema analyzer."""
        if not settings.has_cloudflare_credentials:
            raise ValueError("Cloudflare credentials not configured")
        
        self.client = CloudflareAIClient(
            account_id=settings.cloudflare_account_id,
            api_token=settings.cloudflare_api_token
        )
        self.model = settings.cloudflare_model
        self.temperature = settings.ai_temperature
        self.max_tokens = settings.ai_max_tokens

    async def analyze_table(
        self, 
        table_name: str, 
        columns: List[Dict], 
        db_type: str = "postgresql"
    ) -> Dict[str, Any]:
        """Analyze a database table and provide insights."""
        try:
            # Format schema info
            schema_info = f"Table: {table_name}\n"
            schema_info += "Columns:\n"
            for col in columns:
                schema_info += f"  - {col.get('name')} ({col.get('type', 'unknown')})\n"
            
            prompt = SCHEMA_ANALYSIS_PROMPT.format(
                db_type=db_type,
                schema_info=schema_info
            )
            
            response = await self.client.generate(
                prompt=prompt,
                model=self.model,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                system_prompt=SYSTEM_PROMPT
            )
            
            return {
                "success": True,
                "table_name": table_name,
                "summary": response,
                "purpose": "Data storage and retrieval",
                "suggestions": [],
                "common_queries": [],
                "index_recommendations": [],
                "relationship_suggestions": []
            }
        except Exception as e:
            logger.error(f"AI operation error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "table_name": table_name,
                "summary": "",
                "suggestions": []
            }

    async def suggest_indexes(
        self, 
        table_name: str, 
        columns: List[Dict],
        query_patterns: List[str] = None,
        db_type: str = "postgresql"
    ) -> Dict[str, Any]:
        """Suggest database indexes for better performance."""
        try:
            # Basic index suggestions based on column types and patterns
            suggestions = []
            
            for column in columns:
                col_name = column.get('name', '')
                col_type = column.get('type', '').lower()
                
                # Suggest indexes for common patterns
                if 'id' in col_name.lower() and col_name != 'id':
                    suggestions.append({
                        "type": "btree",
                        "columns": [col_name],
                        "reason": f"Foreign key column {col_name} would benefit from an index"
                    })
                elif col_type in ['timestamp', 'date', 'datetime']:
                    suggestions.append({
                        "type": "btree", 
                        "columns": [col_name],
                        "reason": f"Date/time column {col_name} commonly used in WHERE clauses"
                    })
                elif 'email' in col_name.lower():
                    suggestions.append({
                        "type": "btree",
                        "columns": [col_name],
                        "reason": f"Email column {col_name} likely used for lookups"
                    })

            return {
                "success": True,
                "table_name": table_name,
                "index_suggestions": suggestions,
                "performance_impact": "medium"
            }
        except Exception as e:
            logger.error(f"AI operation error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "index_suggestions": []
            }

    async def analyze_relationships(
        self, 
        tables: Dict[str, List[Dict]], 
        db_type: str = "postgresql"
    ) -> Dict[str, Any]:
        """Analyze potential relationships between tables."""
        try:
            relationships = []
            table_names = list(tables.keys())
            
            # Look for potential foreign key relationships
            for table_name, columns in tables.items():
                for column in columns:
                    col_name = column.get('name', '').lower()
                    
                    # Check if column name suggests a foreign key
                    if col_name.endswith('_id') and col_name != 'id':
                        referenced_table = col_name[:-3]  # Remove '_id'
                        
                        # Check if referenced table exists
                        for other_table in table_names:
                            if other_table.lower() == referenced_table or other_table.lower() == referenced_table + 's':
                                relationships.append({
                                    "from_table": table_name,
                                    "from_column": column.get('name'),
                                    "to_table": other_table,
                                    "to_column": "id",
                                    "relationship_type": "many_to_one",
                                    "confidence": "medium"
                                })

            return {
                "success": True,
                "relationships": relationships,
                "total_suggestions": len(relationships)
            }
        except Exception as e:
            logger.error(f"AI operation error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "relationships": []
            }

    async def generate_common_queries(
        self, 
        table_name: str, 
        columns: List[Dict],
        db_type: str = "postgresql"
    ) -> Dict[str, Any]:
        """Generate common SQL queries for a table."""
        try:
            queries = []
            col_names = [col.get('name') for col in columns if col.get('name')]
            
            # Basic SELECT query
            queries.append({
                "name": "Select All Records",
                "query": f"SELECT * FROM {table_name} LIMIT 10;",
                "description": "Retrieve first 10 records from the table"
            })
            
            # Count query
            queries.append({
                "name": "Count Records",
                "query": f"SELECT COUNT(*) FROM {table_name};",
                "description": "Count total number of records"
            })
            
            # Find queries based on column types
            for column in columns:
                col_name = column.get('name', '')
                col_type = column.get('type', '').lower()
                
                if 'timestamp' in col_type or 'date' in col_type:
                    queries.append({
                        "name": f"Recent Records by {col_name}",
                        "query": f"SELECT * FROM {table_name} WHERE {col_name} >= NOW() - INTERVAL '7 days' ORDER BY {col_name} DESC;",
                        "description": f"Find records from the last 7 days based on {col_name}"
                    })
                elif 'email' in col_name.lower():
                    queries.append({
                        "name": f"Find by {col_name}",
                        "query": f"SELECT * FROM {table_name} WHERE {col_name} = 'example@email.com';",
                        "description": f"Find records by {col_name}"
                    })

            return {
                "success": True,
                "table_name": table_name,
                "queries": queries[:5],  # Limit to 5 queries
                "total_generated": len(queries)
            }
        except Exception as e:
            logger.error(f"AI operation error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "queries": []
            }


# Global instance
schema_analyzer = SchemaAnalyzer()