"""Conflict resolution for concurrent database operations."""

import asyncio
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass


class ConflictType(Enum):
    """Types of operation conflicts."""
    CONCURRENT_EDIT = "concurrent_edit"
    SCHEMA_CHANGE = "schema_change"
    CONNECTION_LIMIT = "connection_limit"
    TRANSACTION_LOCK = "transaction_lock"


class ResolutionStrategy(Enum):
    """Conflict resolution strategies."""
    FIRST_WINS = "first_wins"
    LAST_WINS = "last_wins"
    MERGE = "merge"
    PROMPT_USER = "prompt_user"
    QUEUE = "queue"


@dataclass
class ConflictInfo:
    """Information about a detected conflict."""
    
    conflict_type: ConflictType
    session_id: str
    resource_id: str  # table, connection, etc.
    conflicting_session: str
    timestamp: datetime
    details: Dict[str, Any]


class ConflictResolver:
    """Resolves conflicts between concurrent operations."""
    
    def __init__(self):
        """Initialize conflict resolver."""
        self.active_locks: Dict[str, Dict[str, Any]] = {}
        self.pending_operations: Dict[str, List[Callable]] = {}
        self.conflict_handlers: Dict[ConflictType, ResolutionStrategy] = {
            ConflictType.CONCURRENT_EDIT: ResolutionStrategy.PROMPT_USER,
            ConflictType.SCHEMA_CHANGE: ResolutionStrategy.FIRST_WINS,
            ConflictType.CONNECTION_LIMIT: ResolutionStrategy.QUEUE,
            ConflictType.TRANSACTION_LOCK: ResolutionStrategy.QUEUE
        }
    
    async def acquire_lock(self, resource_id: str, session_id: str, 
                          operation_type: str, timeout: int = 30) -> bool:
        """Acquire exclusive lock on resource."""
        lock_key = f"{resource_id}:{operation_type}"
        
        # Check if already locked
        if lock_key in self.active_locks:
            existing_lock = self.active_locks[lock_key]
            
            # Check if lock is expired
            if self._is_lock_expired(existing_lock):
                del self.active_locks[lock_key]
            else:
                # Handle conflict
                conflict = ConflictInfo(
                    conflict_type=ConflictType.TRANSACTION_LOCK,
                    session_id=session_id,
                    resource_id=resource_id,
                    conflicting_session=existing_lock['session_id'],
                    timestamp=datetime.now(),
                    details={'operation_type': operation_type}
                )
                
                return await self._resolve_conflict(conflict)
        
        # Acquire lock
        self.active_locks[lock_key] = {
            'session_id': session_id,
            'acquired_at': datetime.now(),
            'timeout': timeout,
            'operation_type': operation_type
        }
        
        return True
    
    def release_lock(self, resource_id: str, session_id: str, operation_type: str) -> bool:
        """Release lock on resource."""
        lock_key = f"{resource_id}:{operation_type}"
        
        if lock_key in self.active_locks:
            lock_info = self.active_locks[lock_key]
            if lock_info['session_id'] == session_id:
                del self.active_locks[lock_key]
                
                # Process pending operations
                self._process_pending_operations(resource_id)
                return True
        
        return False
    
    async def detect_concurrent_edit(self, table_id: str, row_id: str, 
                                   session_id: str, last_modified: datetime) -> Optional[ConflictInfo]:
        """Detect concurrent editing conflicts."""
        # This would check if the row was modified by another session
        # since the current session last read it
        
        # Simplified implementation - would need actual database checks
        for lock_key, lock_info in self.active_locks.items():
            if (table_id in lock_key and 
                lock_info['session_id'] != session_id and
                lock_info['operation_type'] == 'edit'):
                
                return ConflictInfo(
                    conflict_type=ConflictType.CONCURRENT_EDIT,
                    session_id=session_id,
                    resource_id=f"{table_id}:{row_id}",
                    conflicting_session=lock_info['session_id'],
                    timestamp=datetime.now(),
                    details={'last_modified': last_modified.isoformat()}
                )
        
        return None
    
    async def handle_schema_change(self, schema_id: str, session_id: str) -> bool:
        """Handle schema change conflicts."""
        # Check for active queries or edits on affected tables
        affected_locks = [
            lock_key for lock_key in self.active_locks.keys()
            if schema_id in lock_key
        ]
        
        if affected_locks:
            conflict = ConflictInfo(
                conflict_type=ConflictType.SCHEMA_CHANGE,
                session_id=session_id,
                resource_id=schema_id,
                conflicting_session="multiple",
                timestamp=datetime.now(),
                details={'affected_operations': len(affected_locks)}
            )
            
            return await self._resolve_conflict(conflict)
        
        return True
    
    def queue_operation(self, resource_id: str, operation: Callable) -> None:
        """Queue operation for later execution."""
        if resource_id not in self.pending_operations:
            self.pending_operations[resource_id] = []
        
        self.pending_operations[resource_id].append(operation)
    
    async def _resolve_conflict(self, conflict: ConflictInfo) -> bool:
        """Resolve conflict based on strategy."""
        strategy = self.conflict_handlers.get(conflict.conflict_type, ResolutionStrategy.PROMPT_USER)
        
        if strategy == ResolutionStrategy.FIRST_WINS:
            # Deny the new operation
            return False
        
        elif strategy == ResolutionStrategy.LAST_WINS:
            # Force release existing lock
            self._force_release_locks(conflict.resource_id)
            return True
        
        elif strategy == ResolutionStrategy.QUEUE:
            # Queue for later execution
            return False  # Caller should queue the operation
        
        elif strategy == ResolutionStrategy.PROMPT_USER:
            # In a real implementation, this would show a dialog
            # For now, default to first wins
            return False
        
        return False
    
    def _is_lock_expired(self, lock_info: Dict[str, Any]) -> bool:
        """Check if lock has expired."""
        acquired_at = lock_info['acquired_at']
        timeout = lock_info['timeout']
        
        return datetime.now() > acquired_at + timedelta(seconds=timeout)
    
    def _force_release_locks(self, resource_id: str) -> None:
        """Force release all locks on resource."""
        keys_to_remove = [
            key for key in self.active_locks.keys()
            if resource_id in key
        ]
        
        for key in keys_to_remove:
            del self.active_locks[key]
    
    def _process_pending_operations(self, resource_id: str) -> None:
        """Process queued operations for resource."""
        if resource_id in self.pending_operations:
            operations = self.pending_operations[resource_id]
            
            # Execute first pending operation
            if operations:
                operation = operations.pop(0)
                asyncio.create_task(operation())
            
            # Clean up if no more operations
            if not operations:
                del self.pending_operations[resource_id]
    
    def cleanup_expired_locks(self) -> int:
        """Clean up expired locks."""
        expired_keys = [
            key for key, lock_info in self.active_locks.items()
            if self._is_lock_expired(lock_info)
        ]
        
        for key in expired_keys:
            resource_id = key.split(':')[0]
            del self.active_locks[key]
            self._process_pending_operations(resource_id)
        
        return len(expired_keys)
    
    def get_active_locks_for_session(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all active locks for a session."""
        return [
            {
                'resource_id': key.split(':')[0],
                'operation_type': lock_info['operation_type'],
                'acquired_at': lock_info['acquired_at'].isoformat()
            }
            for key, lock_info in self.active_locks.items()
            if lock_info['session_id'] == session_id
        ]


# Global conflict resolver
conflict_resolver = ConflictResolver()