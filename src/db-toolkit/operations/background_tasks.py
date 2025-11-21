"""Background tasks for maintenance with adaptive scheduling."""

import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, Any
from operations.query_history import QueryHistory
from core.settings_storage import SettingsStorage
from utils.cache import schema_cache, query_cache
from utils.logger import logger


class AdaptiveScheduler:
    """Adaptive task scheduler that adjusts intervals based on workload."""
    
    def __init__(self):
        """Initialize adaptive scheduler."""
        self.task_stats: Dict[str, Dict[str, Any]] = {}
        self.last_activity = time.time()
        self.activity_threshold = 300  # 5 minutes
    
    def record_activity(self):
        """Record system activity."""
        self.last_activity = time.time()
    
    def is_system_idle(self) -> bool:
        """Check if system has been idle."""
        return (time.time() - self.last_activity) > self.activity_threshold
    
    def get_adaptive_interval(self, task_name: str, base_interval: int, idle_multiplier: float = 2.0) -> int:
        """Get adaptive interval based on system activity."""
        if self.is_system_idle():
            return int(base_interval * idle_multiplier)
        return base_interval
    
    def record_task_execution(self, task_name: str, duration: float, items_processed: int = 0):
        """Record task execution statistics."""
        if task_name not in self.task_stats:
            self.task_stats[task_name] = {
                'executions': 0,
                'total_duration': 0.0,
                'total_items': 0,
                'last_execution': None
            }
        
        stats = self.task_stats[task_name]
        stats['executions'] += 1
        stats['total_duration'] += duration
        stats['total_items'] += items_processed
        stats['last_execution'] = datetime.now().isoformat()


scheduler = AdaptiveScheduler()


async def cleanup_old_history_task():
    """Adaptive cleanup of old query history and cache."""
    history = QueryHistory()
    settings_storage = SettingsStorage()
    base_interval = 4 * 60 * 60  # 4 hours base interval
    
    while True:
        try:
            start_time = time.time()
            
            # Get adaptive interval (longer when system is idle)
            interval = scheduler.get_adaptive_interval('history_cleanup', base_interval, 1.5)
            await asyncio.sleep(interval)
            
            # Get retention days from settings
            settings = await settings_storage.get_settings()
            retention_days = settings.query_history_retention_days
            
            # Cleanup old history
            removed_history = history.cleanup_old_history(retention_days)
            
            # Cleanup expired cache entries
            removed_schema = schema_cache.cleanup_expired()
            
            # Record task execution
            duration = time.time() - start_time
            scheduler.record_task_execution('history_cleanup', duration, removed_history + removed_schema)
            
            if removed_history > 0 or removed_schema > 0:
                logger.info(f"Cleaned up {removed_history} history entries, {removed_schema} expired cache entries")
                
        except Exception as e:
            logger.error(f"Error in history cleanup task: {e}")
            # Back off on error
            await asyncio.sleep(60)


async def backup_scheduler_task():
    """Adaptive backup scheduler."""
    from core.backup_storage import BackupStorage
    from core.storage import ConnectionStorage
    from operations.backup_manager import BackupManager
    
    backup_storage = BackupStorage()
    connection_storage = ConnectionStorage()
    backup_manager = BackupManager()
    base_interval = 60  # 1 minute base check
    
    while True:
        try:
            start_time = time.time()
            
            schedules = await backup_storage.get_all_schedules()
            now = datetime.now()
            
            # Check if any backups are due
            backups_due = any(
                schedule.enabled and schedule.next_run and 
                now >= datetime.fromisoformat(schedule.next_run)
                for schedule in schedules
            )
            
            # Adaptive interval: check more frequently when backups are due
            if backups_due:
                interval = base_interval
            else:
                # Check less frequently when no backups are due
                next_backup_times = [
                    datetime.fromisoformat(schedule.next_run)
                    for schedule in schedules
                    if schedule.enabled and schedule.next_run
                ]
                
                if next_backup_times:
                    next_backup = min(next_backup_times)
                    time_until_next = (next_backup - now).total_seconds()
                    # Check at most every 30 minutes, at least every 5 minutes
                    interval = max(300, min(1800, time_until_next / 2))
                else:
                    interval = 1800  # 30 minutes if no schedules
            
            # Process due backups
            backups_processed = 0
            for schedule in schedules:
                if not schedule.enabled:
                    continue
                
                if schedule.next_run:
                    next_run = datetime.fromisoformat(schedule.next_run)
                    if now >= next_run:
                        connection = await connection_storage.get_connection(schedule.connection_id)
                        if connection:
                            logger.info(f"Running scheduled backup for '{connection.name}'")
                            await backup_manager.create_scheduled_backup(connection, schedule)
                            backups_processed += 1
            
            # Record task execution
            duration = time.time() - start_time
            scheduler.record_task_execution('backup_scheduler', duration, backups_processed)
            
            await asyncio.sleep(interval)
            
        except Exception as e:
            logger.error(f"Error in backup scheduler: {e}")
            await asyncio.sleep(300)  # Back off on error


# Activity tracking for adaptive scheduling
def record_query_activity():
    """Record query activity for adaptive scheduling."""
    scheduler.record_activity()


def get_scheduler_stats() -> Dict[str, Any]:
    """Get scheduler statistics."""
    return {
        'task_stats': scheduler.task_stats,
        'last_activity': scheduler.last_activity,
        'is_idle': scheduler.is_system_idle()
    }
