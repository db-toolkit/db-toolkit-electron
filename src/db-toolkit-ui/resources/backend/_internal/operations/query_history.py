"""Query history management."""

import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from utils.logger import logger


class QueryHistory:
    """Manages query history per connection."""
    
    def __init__(self, storage_path: Optional[Path] = None, max_history: int = 100):
        """Initialize query history."""
        self.storage_path = storage_path or Path.home() / ".db-toolkit" / "query_history.json"
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self.max_history = max_history
    
    def add_query(
        self,
        connection_id: str,
        query: str,
        success: bool,
        execution_time: float,
        row_count: int = 0,
        error: Optional[str] = None
    ) -> None:
        """Add query to history."""
        history = self._load_history()
        
        if connection_id not in history:
            history[connection_id] = []
        
        entry = {
            "query": query,
            "timestamp": time.time(),
            "success": success,
            "execution_time": execution_time,
            "row_count": row_count,
            "error": error
        }
        
        history[connection_id].insert(0, entry)
        
        # Keep only max_history entries
        history[connection_id] = history[connection_id][:self.max_history]
        
        self._save_history(history)
    
    def get_history(self, connection_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get query history for connection."""
        history = self._load_history()
        return history.get(connection_id, [])[:limit]
    
    def clear_history(self, connection_id: str) -> bool:
        """Clear history for connection."""
        history = self._load_history()
        if connection_id in history:
            del history[connection_id]
            self._save_history(history)
            return True
        return False
    
    def search_history(self, connection_id: str, search_term: str) -> List[Dict[str, Any]]:
        """Search query history."""
        history = self.get_history(connection_id)
        search_term = search_term.lower()
        
        return [
            entry for entry in history
            if search_term in entry["query"].lower()
        ]
    
    def cleanup_old_history(self, retention_days: int = 30) -> int:
        """Remove history older than retention_days."""
        history = self._load_history()
        cutoff_time = time.time() - (retention_days * 24 * 60 * 60)
        removed_count = 0
        
        for connection_id in history:
            original_count = len(history[connection_id])
            history[connection_id] = [
                entry for entry in history[connection_id]
                if entry.get("timestamp", 0) > cutoff_time
            ]
            removed_count += original_count - len(history[connection_id])
        
        self._save_history(history)
        return removed_count
    
    def _load_history(self) -> Dict[str, List[Dict[str, Any]]]:
        """Load history from storage."""
        if not self.storage_path.exists():
            return {}
        
        try:
            with open(self.storage_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load query history: {str(e)}")
            return {}
    
    def _save_history(self, history: Dict[str, List[Dict[str, Any]]]) -> None:
        """Save history to storage."""
        try:
            with open(self.storage_path, 'w') as f:
                json.dump(history, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save query history: {str(e)}")