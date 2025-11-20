"""Google Gemini AI client with API key rotation."""

import os
import asyncio
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from .prompts import (
    QUERY_EXPLANATION_PROMPT,
    QUERY_OPTIMIZATION_PROMPT,
    QUERY_ERROR_FIX_PROMPT,
    QUERY_COMPLETION_PROMPT,
    SCHEMA_ANALYSIS_PROMPT,
    SYSTEM_PROMPT,
    CONTEXT_PROMPT
)


class GeminiClient:
    """Google Gemini AI client with automatic key rotation for rate limit management."""

    def __init__(self):
        """Initialize Gemini client with API key rotation."""
        self.api_keys = self._load_api_keys()
        self.current_key_index = 0
        
    def _load_api_keys(self) -> List[str]:
        """Load all available Gemini API keys from environment."""
        keys = []
        # Check for single key first
        single_key = os.getenv('GEMINI_API_KEY')
        if single_key:
            keys.append(single_key)
        
        # Then check for numbered keys
        for i in range(1, 6):  # Support up to 5 keys
            key = os.getenv(f'GEMINI_API_KEY_{i}')
            if key:
                keys.append(key)
        return keys
    
    def _get_next_key(self) -> str:
        """Rotate to next API key to distribute load."""
        if not self.api_keys:
            raise ValueError("No Gemini API keys configured. Please set GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.")
        
        key = self.api_keys[self.current_key_index]
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        return key
    
    async def _make_request(self, prompt: str, max_retries: int = 3) -> str:
        """Make AI request with automatic key rotation and retry logic."""
        # Get configuration from environment
        model_name = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
        temperature = float(os.getenv('GEMINI_TEMPERATURE', '0.3'))
        max_tokens = int(os.getenv('GEMINI_MAX_TOKENS', '2048'))
        
        last_error = None
        
        for attempt in range(max_retries):
            for key_attempt in range(len(self.api_keys)):
                try:
                    api_key = self._get_next_key()
                    genai.configure(api_key=api_key)
                    model = genai.GenerativeModel(model_name)
                    
                    response = await asyncio.to_thread(
                        model.generate_content, 
                        prompt,
                        generation_config=genai.types.GenerationConfig(
                            temperature=temperature,
                            max_output_tokens=max_tokens,
                        )
                    )
                    return response.text
                    
                except Exception as e:
                    last_error = e
                    error_msg = str(e).lower()
                    if "quota" in error_msg or "rate limit" in error_msg:
                        continue  # Try next key
                    else:
                        # For non-rate-limit errors, retry with same key
                        if attempt < max_retries - 1:
                            await asyncio.sleep(1)
                        break
            
            # If we tried all keys and got rate limits, wait before next attempt
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        # Raise the actual last error instead of generic message
        if last_error:
            raise last_error
        raise Exception("Request failed after all retries")
    
    def _build_context(self, db_type: str, connection_name: str = "", schema_context: Dict = None) -> str:
        """Build context prompt with database information."""
        table_list = []
        if schema_context:
            table_list = list(schema_context.get('tables', {}).keys())
        
        return CONTEXT_PROMPT.format(
            db_type=db_type,
            connection_name=connection_name,
            table_list=", ".join(table_list[:10]),  # Limit to first 10 tables
            user_level="intermediate"
        )
    
    async def generate_query(self, natural_language: str, schema_context: Dict, db_type: str = "postgresql") -> Dict[str, str]:
        """Convert natural language to SQL query."""
        context = self._build_context(db_type, schema_context=schema_context)
        
        prompt = f"""{SYSTEM_PROMPT}

{context}

Convert this natural language request to SQL:
Request: {natural_language}

Available schema:
{schema_context}

Provide:
1. SQL query (clean, executable)
2. Brief explanation of what the query does
3. Any assumptions made

Format your response as:
SQL: [your query here]
EXPLANATION: [brief explanation]
"""
        
        response = await self._make_request(prompt)
        return {"sql": response, "explanation": "AI-generated query"}
    
    async def optimize_query(self, query: str, execution_plan: Optional[Dict] = None, db_type: str = "postgresql", schema_context: Dict = None) -> Dict[str, Any]:
        """Optimize SQL query and provide suggestions."""
        context = self._build_context(db_type, schema_context=schema_context)
        
        prompt = QUERY_OPTIMIZATION_PROMPT.format(
            db_type=db_type,
            schema_context=str(schema_context) if schema_context else "Not provided",
            execution_plan=str(execution_plan) if execution_plan else "Not available",
            query=query
        )
        
        full_prompt = f"{SYSTEM_PROMPT}\n\n{context}\n\n{prompt}"
        response = await self._make_request(full_prompt)
        
        return {
            "suggestions": [response],
            "optimized_query": None,  # Will be extracted from response
            "performance_assessment": "Analysis provided"
        }
    
    async def explain_query(self, query: str, db_type: str = "postgresql", schema_context: Dict = None) -> Dict[str, str]:
        """Explain what a SQL query does in plain English."""
        context = self._build_context(db_type, schema_context=schema_context)
        
        prompt = QUERY_EXPLANATION_PROMPT.format(
            db_type=db_type,
            schema_context=str(schema_context) if schema_context else "Not provided",
            query=query
        )
        
        full_prompt = f"{SYSTEM_PROMPT}\n\n{context}\n\n{prompt}"
        response = await self._make_request(full_prompt)
        
        return {"explanation": response}
    
    async def fix_error(self, query: str, error: str, db_type: str = "postgresql", schema_context: Dict = None) -> Dict[str, str]:
        """Fix SQL query errors."""
        context = self._build_context(db_type, schema_context=schema_context)
        
        prompt = QUERY_ERROR_FIX_PROMPT.format(
            db_type=db_type,
            schema_context=str(schema_context) if schema_context else "Not provided",
            error_message=error,
            query=query
        )
        
        full_prompt = f"{SYSTEM_PROMPT}\n\n{context}\n\n{prompt}"
        response = await self._make_request(full_prompt)
        
        return {"explanation": response, "fixed_query": None}  # Will be extracted from response
    
    async def analyze_table(self, table_name: str, columns: List[Dict], db_type: str = "postgresql") -> Dict[str, Any]:
        """Provide insights about a database table."""
        schema_info = f"Table: {table_name}\nColumns: {columns}"
        
        prompt = SCHEMA_ANALYSIS_PROMPT.format(
            db_type=db_type,
            schema_info=schema_info
        )
        
        full_prompt = f"{SYSTEM_PROMPT}\n\n{prompt}"
        response = await self._make_request(full_prompt)
        
        return {
            "summary": response,
            "suggestions": [],
            "common_queries": [],
            "index_recommendations": []
        }


# Global instance
gemini_client = GeminiClient()