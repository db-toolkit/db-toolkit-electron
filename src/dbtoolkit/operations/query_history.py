"""Query history management."""

import json
import uuid
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
from ..core.config import config
from ..core.query import QueryHistoryItem, QueryResult


class QueryHistoryManager:
    """Manages query history storage and retrieval."""
    
    def __init__(self):
        """Initialize query history manager."""
        self.history_file = config.config_dir / "query_history.json"
        self._history: Dict[str, List[QueryHistoryItem]] = {}
        self.load_history()
    
    def load_history(self) -> None:
        """Load query history from file."""
        if not self.history_file.exists():
            return
        
        try:
            with open(self.history_file, 'r') as f:
                data = json.load(f)
                
            for connection_id, items in data.items():
                self._history[connection_id] = [
                    QueryHistoryItem.from_dict(item) for item in items
                ]
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error loading query history: {e}")
    
    def save_history(self) -> None:
        """Save query history to file."""
        data = {}
        for connection_id, items in self._history.items():
            data[connection_id] = [item.to_dict() for item in items]
        
        with open(self.history_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def add_query(self, connection_id: str, query: str, result: QueryResult) -> str:
        """Add query to history."""
        history_item = QueryHistoryItem(
            id=str(uuid.uuid4()),
            connection_id=connection_id,
            query=query,
            timestamp=datetime.now(),
            execution_time=result.execution_time,
            success=result.success,
            row_count=result.row_count,
            error_message=result.error_message
        )
        
        if connection_id not in self._history:
            self._history[connection_id] = []
        
        self._history[connection_id].insert(0, history_item)  # Most recent first
        
        # Keep only last 100 queries per connection
        self._history[connection_id] = self._history[connection_id][:100]
        
        self.save_history()
        return history_item.id
    
    def get_history(self, connection_id: str, limit: int = 50) -> List[QueryHistoryItem]:
        """Get query history for connection."""
        return self._history.get(connection_id, [])[:limit]
    
    def get_all_history(self) -> Dict[str, List[QueryHistoryItem]]:
        """Get all query history."""
        return self._history.copy()
    
    def clear_history(self, connection_id: Optional[str] = None) -> None:
        """Clear query history."""
        if connection_id:
            self._history.pop(connection_id, None)
        else:
            self._history.clear()
        
        self.save_history()
    
    def search_history(self, connection_id: str, search_term: str) -> List[QueryHistoryItem]:
        """Search query history by query text."""
        history = self._history.get(connection_id, [])
        return [
            item for item in history
            if search_term.lower() in item.query.lower()
        ]


# Global history manager
query_history = QueryHistoryManager()