"""Query validation utilities."""

import re
from typing import List, Tuple, Optional
from ..core.models import DatabaseType


class QueryValidator:
    """Validates SQL queries for safety and syntax."""
    
    # Dangerous SQL patterns to block
    DANGEROUS_PATTERNS = [
        r'\bdrop\s+database\b',
        r'\bdrop\s+schema\b',
        r'\btruncate\s+table\b',
        r'\bdelete\s+from\s+\w+\s*(?:;|$)',  # DELETE without WHERE
        r'\bupdate\s+\w+\s+set\s+.*?(?:;|$)(?!.*where)',  # UPDATE without WHERE
        r'\b(exec|execute)\s*\(',
        r'\bxp_cmdshell\b',
        r'\bsp_executesql\b',
    ]
    
    # SQL injection patterns
    INJECTION_PATTERNS = [
        r"'.*?;.*?--",
        r"'.*?union.*?select",
        r"'.*?or.*?1=1",
        r"'.*?and.*?1=1",
        r"\bor\b.*?\b1=1\b",
        r"\band\b.*?\b1=1\b",
    ]
    
    @classmethod
    def validate_query(cls, query: str, db_type: DatabaseType, 
                      allow_dangerous: bool = False) -> Tuple[bool, List[str]]:
        """Validate query for safety and basic syntax."""
        errors = []
        
        if not query.strip():
            errors.append("Query cannot be empty")
            return False, errors
        
        # Check for dangerous patterns
        if not allow_dangerous:
            for pattern in cls.DANGEROUS_PATTERNS:
                if re.search(pattern, query, re.IGNORECASE):
                    errors.append(f"Potentially dangerous operation detected: {pattern}")
        
        # Check for SQL injection patterns
        for pattern in cls.INJECTION_PATTERNS:
            if re.search(pattern, query, re.IGNORECASE):
                errors.append("Potential SQL injection detected")
        
        # Database-specific validation
        if db_type == DatabaseType.MONGODB:
            errors.extend(cls._validate_mongodb_query(query))
        else:
            errors.extend(cls._validate_sql_query(query, db_type))
        
        return len(errors) == 0, errors
    
    @classmethod
    def _validate_sql_query(cls, query: str, db_type: DatabaseType) -> List[str]:
        """Validate SQL query syntax."""
        errors = []
        
        # Basic SQL syntax checks
        query_lower = query.lower().strip()
        
        # Check for balanced parentheses
        if query.count('(') != query.count(')'):
            errors.append("Unbalanced parentheses")
        
        # Check for balanced quotes
        single_quotes = query.count("'") - query.count("\\'")
        double_quotes = query.count('"') - query.count('\\"')
        
        if single_quotes % 2 != 0:
            errors.append("Unbalanced single quotes")
        
        if double_quotes % 2 != 0:
            errors.append("Unbalanced double quotes")
        
        # Database-specific syntax
        if db_type == DatabaseType.MYSQL:
            # MySQL specific checks
            if '`' in query and query.count('`') % 2 != 0:
                errors.append("Unbalanced backticks")
        
        return errors
    
    @classmethod
    def _validate_mongodb_query(cls, query: str) -> List[str]:
        """Validate MongoDB query."""
        errors = []
        
        # Basic MongoDB query validation
        try:
            # Check if it looks like valid JSON/JavaScript
            if not query.strip().startswith(('db.', 'use ', 'show')):
                errors.append("MongoDB query should start with 'db.', 'use', or 'show'")
        except Exception:
            errors.append("Invalid MongoDB query syntax")
        
        return errors
    
    @classmethod
    def sanitize_query(cls, query: str) -> str:
        """Basic query sanitization."""
        # Remove comments
        query = re.sub(r'--.*$', '', query, flags=re.MULTILINE)
        query = re.sub(r'/\*.*?\*/', '', query, flags=re.DOTALL)
        
        # Normalize whitespace
        query = ' '.join(query.split())
        
        return query.strip()
    
    @classmethod
    def is_read_only_query(cls, query: str) -> bool:
        """Check if query is read-only (SELECT, SHOW, DESCRIBE, etc.)."""
        query_lower = query.strip().lower()
        
        read_only_keywords = [
            'select', 'show', 'describe', 'desc', 'explain',
            'with', 'values'  # CTE and VALUES are typically read-only
        ]
        
        return any(query_lower.startswith(keyword) for keyword in read_only_keywords)