"""Operation locking for concurrent access control."""

import asyncio
from typing import Dict
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from utils.logger import logger


class OperationLock:
    """Manages locks for database operations with timeouts and read/write separation."""

    def __init__(self):
        """Initialize operation lock manager."""
        self._locks: Dict[str, asyncio.Lock] = {}
        self._lock_times: Dict[str, datetime] = {}
        self._max_lock_time = 30  # 30 seconds max lock time

    def get_lock(self, connection_id: str) -> asyncio.Lock:
        """Get or create lock for a connection."""
        if connection_id not in self._locks:
            self._locks[connection_id] = asyncio.Lock()
        return self._locks[connection_id]

    async def acquire(self, connection_id: str, timeout: float = 10.0) -> bool:
        """Acquire lock for connection with timeout."""
        lock = self.get_lock(connection_id)
        try:
            await asyncio.wait_for(lock.acquire(), timeout=timeout)
            self._lock_times[connection_id] = datetime.now()
            return True
        except asyncio.TimeoutError:
            return False

    def release(self, connection_id: str):
        """Release lock for connection."""
        if connection_id in self._locks:
            try:
                self._locks[connection_id].release()
                if connection_id in self._lock_times:
                    del self._lock_times[connection_id]
            except RuntimeError:
                # Lock was already released
                pass

    def is_locked(self, connection_id: str) -> bool:
        """Check if connection is locked."""
        if connection_id in self._locks:
            # Check for expired locks
            if connection_id in self._lock_times:
                lock_time = self._lock_times[connection_id]
                if datetime.now() - lock_time > timedelta(seconds=self._max_lock_time):
                    # Force release expired lock
                    self.force_unlock(connection_id)
                    return False
            return self._locks[connection_id].locked()
        return False

    def cleanup(self, connection_id: str):
        """Remove lock for disconnected connection."""
        if connection_id in self._locks:
            try:
                if self._locks[connection_id].locked():
                    self._locks[connection_id].release()
            except RuntimeError:
                pass
            del self._locks[connection_id]
        if connection_id in self._lock_times:
            del self._lock_times[connection_id]
    
    def force_unlock(self, connection_id: str):
        """Force unlock a connection (use with caution)."""
        logger.warning(f"Force unlocking connection '{connection_id}'")
        if connection_id in self._locks:
            try:
                if self._locks[connection_id].locked():
                    self._locks[connection_id].release()
            except RuntimeError:
                pass
        if connection_id in self._lock_times:
            del self._lock_times[connection_id]
    
    @asynccontextmanager
    async def acquire_lock(self, connection_id: str, timeout: float = 10.0, read_only: bool = False):
        """Context manager for acquiring and releasing locks."""
        if read_only:
            # For read-only operations, don't block if already locked
            yield
            return
            
        acquired = await self.acquire(connection_id, timeout)
        if not acquired:
            logger.error(f"Failed to acquire lock for '{connection_id}' - operation in progress")
            raise RuntimeError("Cannot perform operation: another operation is in progress")
        
        try:
            yield
        finally:
            self.release(connection_id)


operation_lock = OperationLock()

# Maximum concurrent operations per connection
MAX_CONCURRENT_OPERATIONS = 1  # Only 1 write operation at a time
MAX_READ_OPERATIONS = 5  # Up to 5 concurrent read operations
