"""Backup metadata storage."""

import json
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from core.models import Backup, BackupStatus, BackupType, BackupSchedule


class BackupStorage:
    """Manages backup metadata storage."""

    def __init__(self):
        self.storage_dir = Path.home() / ".db-toolkit" / "backups"
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_file = self.storage_dir / "backups.json"
        self._ensure_file()

    def _ensure_file(self):
        """Ensure metadata file exists."""
        if not self.metadata_file.exists():
            self.metadata_file.write_text(json.dumps({"backups": [], "schedules": []}))

    def _read(self) -> dict:
        """Read metadata file."""
        return json.loads(self.metadata_file.read_text())

    def _write(self, data: dict):
        """Write metadata file."""
        self.metadata_file.write_text(json.dumps(data, indent=2))

    async def add_backup(
        self,
        connection_id: str,
        name: str,
        backup_type: BackupType,
        file_path: str,
        tables: Optional[List[str]] = None,
        compressed: bool = False,
    ) -> Backup:
        """Add new backup."""
        data = self._read()
        backup_id = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        backup = Backup(
            id=backup_id,
            connection_id=connection_id,
            name=name,
            backup_type=backup_type,
            file_path=file_path,
            status=BackupStatus.PENDING,
            tables=tables,
            compressed=compressed,
            created_at=datetime.now().isoformat(),
        )
        
        data["backups"].append(backup.model_dump())
        self._write(data)
        return backup

    async def get_backup(self, backup_id: str) -> Optional[Backup]:
        """Get backup by ID."""
        data = self._read()
        for backup_data in data["backups"]:
            if backup_data["id"] == backup_id:
                return Backup(**backup_data)
        return None

    async def get_all_backups(self, connection_id: Optional[str] = None) -> List[Backup]:
        """Get all backups, optionally filtered by connection."""
        data = self._read()
        backups = [Backup(**b) for b in data["backups"]]
        if connection_id:
            backups = [b for b in backups if b.connection_id == connection_id]
        return sorted(backups, key=lambda x: x.created_at, reverse=True)

    async def update_backup(self, backup_id: str, **updates) -> Optional[Backup]:
        """Update backup metadata."""
        data = self._read()
        for i, backup_data in enumerate(data["backups"]):
            if backup_data["id"] == backup_id:
                backup_data.update(updates)
                data["backups"][i] = backup_data
                self._write(data)
                return Backup(**backup_data)
        return None

    async def delete_backup(self, backup_id: str) -> bool:
        """Delete backup metadata."""
        data = self._read()
        original_len = len(data["backups"])
        data["backups"] = [b for b in data["backups"] if b["id"] != backup_id]
        if len(data["backups"]) < original_len:
            self._write(data)
            return True
        return False

    async def add_schedule(self, schedule: BackupSchedule) -> BackupSchedule:
        """Add backup schedule."""
        data = self._read()
        if "schedules" not in data:
            data["schedules"] = []
        data["schedules"].append(schedule.model_dump())
        self._write(data)
        return schedule

    async def get_schedule(self, schedule_id: str) -> Optional[BackupSchedule]:
        """Get schedule by ID."""
        data = self._read()
        for sched in data.get("schedules", []):
            if sched["id"] == schedule_id:
                return BackupSchedule(**sched)
        return None

    async def get_all_schedules(self) -> List[BackupSchedule]:
        """Get all schedules."""
        data = self._read()
        return [BackupSchedule(**s) for s in data.get("schedules", [])]

    async def update_schedule(self, schedule_id: str, **updates) -> Optional[BackupSchedule]:
        """Update schedule."""
        data = self._read()
        if "schedules" not in data:
            return None
        for i, sched in enumerate(data["schedules"]):
            if sched["id"] == schedule_id:
                sched.update(updates)
                data["schedules"][i] = sched
                self._write(data)
                return BackupSchedule(**sched)
        return None

    async def delete_schedule(self, schedule_id: str) -> bool:
        """Delete schedule."""
        data = self._read()
        if "schedules" not in data:
            return False
        original_len = len(data["schedules"])
        data["schedules"] = [s for s in data["schedules"] if s["id"] != schedule_id]
        if len(data["schedules"]) < original_len:
            self._write(data)
            return True
        return False
