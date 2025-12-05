"""Query Assistant for DBAssist AI functionality."""

from utils.logger import logger
from typing import Dict, List, Any, Optional
from core.config import settings
from .cloudflare_client import CloudflareAIClient
from .prompts import (
    NL_TO_SQL_PROMPT,
    QUERY_EXPLANATION_PROMPT,
    QUERY_OPTIMIZATION_PROMPT,
    QUERY_ERROR_FIX_PROMPT,
    SYSTEM_PROMPT
)


class QueryAssistant:
    """AI assistant for SQL query operations."""

    def __init__(self):
        """Initialize query assistant."""
        if not settings.has_cloudflare_credentials:
            raise ValueError("Cloudflare credentials not configured")
        
        self.client = CloudflareAIClient(
            account_id=settings.cloudflare_account_id,
            api_token=settings.cloudflare_api_token
        )
        self.model = settings.cloudflare_model
        self.temperature = settings.ai_temperature
        self.max_tokens = settings.ai_max_tokens

    async def generate_from_natural_language(
        self, 
        natural_language: str, 
        schema_context: Dict, 
        db_type: str = "postgresql"
    ) -> Dict[str, str]:
        """Convert natural language to SQL query."""
        try:
            # Format schema context
            schema_str = self._format_schema(schema_context)
            
            # Build prompt
            prompt = NL_TO_SQL_PROMPT.format(
                db_type=db_type,
                schema_context=schema_str,
                user_request=natural_language
            )
            
            # Generate SQL
            response = await self.client.generate(
                prompt=prompt,
                model=self.model,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                system_prompt=SYSTEM_PROMPT
            )
            
            # Extract SQL from response
            sql = self._extract_sql(response)
            
            return {
                "success": True,
                "sql": sql,
                "explanation": "Query generated from natural language",
                "confidence": "high"
            }
        except Exception as e:
            logger.error(f"AI operation error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "sql": "",
                "explanation": ""
            }

    async def optimize_query(
        self, 
        query: str, 
        execution_plan: Optional[Dict] = None,
        db_type: str = "postgresql",
        schema_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Analyze and optimize SQL query."""
        try:
            schema_str = self._format_schema(schema_context) if schema_context else "N/A"
            plan_str = str(execution_plan) if execution_plan else "N/A"
            
            prompt = QUERY_OPTIMIZATION_PROMPT.format(
                db_type=db_type,
                schema_context=schema_str,
                query=query,
                execution_plan=plan_str
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
                "suggestions": [response],
                "optimized_query": self._extract_sql(response),
                "performance_assessment": "Analyzed",
                "improvements": []
            }
        except Exception as e:
            logger.error(f"AI operation error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "suggestions": []
            }

    async def explain_query(
        self, 
        query: str, 
        db_type: str = "postgresql",
        schema_context: Optional[Dict] = None
    ) -> Dict[str, str]:
        """Explain what a SQL query does."""
        try:
            schema_str = self._format_schema(schema_context) if schema_context else "N/A"
            
            prompt = QUERY_EXPLANATION_PROMPT.format(
                db_type=db_type,
                schema_context=schema_str,
                query=query
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
                "explanation": response,
                "complexity": "medium"
            }
        except Exception as e:
            logger.error(f"AI operation error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "explanation": ""
            }

    async def fix_query_error(
        self, 
        query: str, 
        error_message: str,
        db_type: str = "postgresql",
        schema_context: Optional[Dict] = None
    ) -> Dict[str, str]:
        """Fix SQL query errors."""
        try:
            schema_str = self._format_schema(schema_context) if schema_context else "N/A"
            
            prompt = QUERY_ERROR_FIX_PROMPT.format(
                db_type=db_type,
                schema_context=schema_str,
                query=query,
                error_message=error_message
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
                "explanation": response,
                "fixed_query": self._extract_sql(response),
                "error_type": "syntax"
            }
        except Exception as e:
            logger.error(f"AI operation error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "explanation": "",
                "fixed_query": ""
            }

    async def suggest_completion(
        self, 
        partial_query: str, 
        cursor_position: int,
        schema_context: Dict,
        db_type: str = "postgresql"
    ) -> Dict[str, Any]:
        """Suggest query completions based on partial input."""
        try:
            # For now, return basic completion suggestions
            # This can be enhanced with more sophisticated completion logic
            return {
                "success": True,
                "suggestions": [
                    {"text": "SELECT * FROM ", "type": "keyword"},
                    {"text": "WHERE ", "type": "keyword"},
                    {"text": "ORDER BY ", "type": "keyword"}
                ],
                "context": "basic"
            }
        except Exception as e:
            logger.error(f"AI operation error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "suggestions": []
            }
    
    def _format_schema(self, schema_context: Dict) -> str:
        """Format schema context for prompt (limit to prevent 413 errors)."""
        if not schema_context:
            return "No schema available"
        
        formatted = []
        max_tables = 20  # Limit to prevent payload too large
        
        for idx, (table_name, table_info) in enumerate(schema_context.items()):
            if idx >= max_tables:
                formatted.append(f"... and {len(schema_context) - max_tables} more tables")
                break
            
            if isinstance(table_info, dict) and 'columns' in table_info:
                # Limit columns per table
                cols = table_info['columns'][:10]  # Max 10 columns per table
                col_str = ", ".join([f"{c['name']} ({c.get('type', 'unknown')})" for c in cols])
                if len(table_info['columns']) > 10:
                    col_str += f" ... +{len(table_info['columns']) - 10} more"
                formatted.append(f"{table_name}: {col_str}")
        
        return "\n".join(formatted) if formatted else str(schema_context)
    
    def _extract_sql(self, response: str) -> str:
        """Extract SQL from AI response."""
        # Remove markdown code blocks
        if "```sql" in response:
            start = response.find("```sql") + 6
            end = response.find("```", start)
            return response[start:end].strip()
        elif "```" in response:
            start = response.find("```") + 3
            end = response.find("```", start)
            return response[start:end].strip()
        
        # Look for SQL keywords
        lines = response.split('\n')
        sql_lines = []
        in_sql = False
        
        for line in lines:
            line_upper = line.strip().upper()
            if line_upper.startswith(('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WITH', 'CREATE', 'ALTER', 'DROP')):
                in_sql = True
            if in_sql:
                sql_lines.append(line)
                if line.strip().endswith(';'):
                    break
        
        return '\n'.join(sql_lines).strip() if sql_lines else response.strip()


# Global instance
query_assistant = QueryAssistant()