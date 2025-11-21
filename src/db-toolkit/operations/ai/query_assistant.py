"""Query Assistant for DBAssist AI functionality."""

from utils.logger import logger
from typing import Dict, List, Any, Optional
from .gemini_client import gemini_client


class QueryAssistant:
    """AI assistant for SQL query operations."""

    def __init__(self):
        """Initialize query assistant."""
        self.client = gemini_client

    async def generate_from_natural_language(
        self, 
        natural_language: str, 
        schema_context: Dict, 
        db_type: str = "postgresql"
    ) -> Dict[str, str]:
        """Convert natural language to SQL query."""
        try:
            result = await self.client.generate_query(
                natural_language=natural_language,
                schema_context=schema_context,
                db_type=db_type
            )
            return {
                "success": True,
                "sql": result.get("sql", ""),
                "explanation": result.get("explanation", ""),
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
            result = await self.client.optimize_query(
                query=query,
                execution_plan=execution_plan,
                db_type=db_type,
                schema_context=schema_context
            )
            return {
                "success": True,
                "suggestions": result.get("suggestions", []),
                "optimized_query": result.get("optimized_query"),
                "performance_assessment": result.get("performance_assessment", "Unknown"),
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
            result = await self.client.explain_query(
                query=query,
                db_type=db_type,
                schema_context=schema_context
            )
            return {
                "success": True,
                "explanation": result.get("explanation", ""),
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
            result = await self.client.fix_error(
                query=query,
                error=error_message,
                db_type=db_type,
                schema_context=schema_context
            )
            return {
                "success": True,
                "explanation": result.get("explanation", ""),
                "fixed_query": result.get("fixed_query", ""),
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


# Global instance
query_assistant = QueryAssistant()