"""Database backup and restore operations."""

import asyncio
import gzip
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List
from core.models import DatabaseConnection, BackupType, BackupStatus, Backup, BackupSchedule
from core.backup_storage import BackupStorage
from ws.backup_notifier import backup_notifier


class BackupManager:
    """Manages database backups and restores."""

    def __init__(self):
        self.storage = BackupStorage()
        self.backup_dir = Path.home() / ".db-toolkit" / "backups" / "files"
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    async def create_backup(
        self,
        connection: DatabaseConnection,
        name: str,
        backup_type: BackupType,
        tables: Optional[List[str]] = None,
        compress: bool = True,
    ) -> Backup:
        """Create database backup."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{connection.name}_{timestamp}.sql"
        if compress:
            filename += ".gz"
        
        file_path = str(self.backup_dir / filename)
        
        backup = await self.storage.add_backup(
            connection_id=connection.id,
            name=name,
            backup_type=backup_type,
            file_path=file_path,
            tables=tables,
            compressed=compress,
        )
        
        return backup

    async def create_scheduled_backup(
        self,
        connection: DatabaseConnection,
        schedule: BackupSchedule,
    ) -> Backup:
        """Create backup from schedule."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        name = f"{schedule.name}_{timestamp}"
        
        backup = await self.create_backup(
            connection=connection,
            name=name,
            backup_type=schedule.backup_type,
            tables=schedule.tables,
            compress=schedule.compressed,
        )
        
        await self.storage.update_backup(backup.id, schedule_id=schedule.id)
        await self.storage.update_schedule(
            schedule.id,
            last_run=datetime.now().isoformat(),
            next_run=self.parse_schedule(schedule.schedule).isoformat() if self.parse_schedule(schedule.schedule) else None,
        )
        
        await self.apply_retention_policy(connection.id, schedule.id, schedule.retention_count)
        
        asyncio.create_task(self._execute_backup(backup, connection, tables, compress))
        return backup

    async def _execute_backup(
        self,
        backup: Backup,
        connection: DatabaseConnection,
        tables: Optional[List[str]],
        compress: bool,
    ):
        """Execute backup in background."""
        try:
            await self.storage.update_backup(backup.id, status=BackupStatus.IN_PROGRESS)
            await backup_notifier.notify_backup_update(backup.id, BackupStatus.IN_PROGRESS.value)
            
            if connection.db_type.value == "postgresql":
                await self._backup_postgresql(backup, connection, tables)
            elif connection.db_type.value == "mysql":
                await self._backup_mysql(backup, connection, tables)
            elif connection.db_type.value == "sqlite":
                await self._backup_sqlite(backup, connection)
            elif connection.db_type.value == "mongodb":
                await self._backup_mongodb(backup, connection, tables)
            else:
                raise ValueError(f"Backup not supported for {connection.db_type}")
            
            if compress and not backup.file_path.endswith(".gz"):
                await self._compress_file(backup.file_path)
            
            file_size = Path(backup.file_path).stat().st_size
            await self.storage.update_backup(
                backup.id,
                status=BackupStatus.COMPLETED,
                completed_at=datetime.now().isoformat(),
                file_size=file_size,
            )
            await backup_notifier.notify_backup_update(backup.id, BackupStatus.COMPLETED.value, {"file_size": file_size})
        except Exception as e:
            await self.storage.update_backup(
                backup.id,
                status=BackupStatus.FAILED,
                error_message=str(e),
            )
            await backup_notifier.notify_backup_update(backup.id, BackupStatus.FAILED.value, {"error": str(e)})

    async def _backup_postgresql(
        self,
        backup: Backup,
        connection: DatabaseConnection,
        tables: Optional[List[str]],
    ):
        """Backup PostgreSQL database."""
        cmd = [
            "pg_dump",
            "-h", connection.host,
            "-p", str(connection.port or 5432),
            "-U", connection.username,
            "-d", connection.database,
            "-F", "p",
        ]
        
        if backup.backup_type == BackupType.SCHEMA_ONLY:
            cmd.append("--schema-only")
        elif backup.backup_type == BackupType.DATA_ONLY:
            cmd.append("--data-only")
        elif backup.backup_type == BackupType.TABLES and tables:
            for table in tables:
                cmd.extend(["-t", table])
        
        output_file = backup.file_path.replace(".gz", "") if backup.compressed else backup.file_path
        cmd.extend(["-f", output_file])
        
        env = {"PGPASSWORD": connection.password} if connection.password else {}
        process = await asyncio.create_subprocess_exec(
            *cmd,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"pg_dump failed: {stderr.decode()}")

    async def _backup_mysql(
        self,
        backup: Backup,
        connection: DatabaseConnection,
        tables: Optional[List[str]],
    ):
        """Backup MySQL database."""
        cmd = [
            "mysqldump",
            "-h", connection.host,
            "-P", str(connection.port or 3306),
            "-u", connection.username,
        ]
        
        if connection.password:
            cmd.append(f"-p{connection.password}")
        
        if backup.backup_type == BackupType.SCHEMA_ONLY:
            cmd.append("--no-data")
        elif backup.backup_type == BackupType.DATA_ONLY:
            cmd.append("--no-create-info")
        
        cmd.append(connection.database)
        
        if backup.backup_type == BackupType.TABLES and tables:
            cmd.extend(tables)
        
        output_file = backup.file_path.replace(".gz", "") if backup.compressed else backup.file_path
        
        with open(output_file, "w") as f:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=f,
                stderr=asyncio.subprocess.PIPE,
            )
            _, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"mysqldump failed: {stderr.decode()}")

    async def _backup_sqlite(self, backup: Backup, connection: DatabaseConnection):
        """Backup SQLite database."""
        output_file = backup.file_path.replace(".gz", "") if backup.compressed else backup.file_path
        await asyncio.to_thread(shutil.copy2, connection.database, output_file)

    async def _backup_mongodb(
        self,
        backup: Backup,
        connection: DatabaseConnection,
        tables: Optional[List[str]],
    ):
        """Backup MongoDB database."""
        output_dir = backup.file_path.replace(".sql.gz", "").replace(".sql", "")
        
        cmd = [
            "mongodump",
            "--host", connection.host,
            "--port", str(connection.port or 27017),
            "--db", connection.database,
            "--out", output_dir,
        ]
        
        if connection.username:
            cmd.extend(["--username", connection.username])
        if connection.password:
            cmd.extend(["--password", connection.password])
        
        if backup.backup_type == BackupType.TABLES and tables:
            for table in tables:
                cmd.extend(["--collection", table])
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"mongodump failed: {stderr.decode()}")
        
        if backup.compressed:
            await self._compress_directory(output_dir, backup.file_path)
            await asyncio.to_thread(shutil.rmtree, output_dir)

    async def _compress_directory(self, dir_path: str, output_path: str):
        """Compress directory to tar.gz."""
        def compress():
            import tarfile
            with tarfile.open(output_path, "w:gz") as tar:
                tar.add(dir_path, arcname=Path(dir_path).name)
        
        await asyncio.to_thread(compress)

    async def _compress_file(self, file_path: str):
        """Compress backup file with gzip."""
        def compress():
            with open(file_path, "rb") as f_in:
                with gzip.open(f"{file_path}.gz", "wb") as f_out:
                    shutil.copyfileobj(f_in, f_out)
            Path(file_path).unlink()
        
        await asyncio.to_thread(compress)

    async def restore_backup(
        self,
        backup: Backup,
        target_connection: DatabaseConnection,
        tables: Optional[List[str]] = None,
    ):
        """Restore database from backup."""
        file_path = backup.file_path
        
        if backup.compressed:
            temp_file = file_path.replace(".gz", "")
            await self._decompress_file(file_path, temp_file)
            file_path = temp_file
        
        try:
            if target_connection.db_type.value == "postgresql":
                await self._restore_postgresql(file_path, target_connection)
            elif target_connection.db_type.value == "mysql":
                await self._restore_mysql(file_path, target_connection)
            elif target_connection.db_type.value == "sqlite":
                await self._restore_sqlite(file_path, target_connection)
            elif target_connection.db_type.value == "mongodb":
                await self._restore_mongodb(file_path, target_connection)
        finally:
            if backup.compressed and Path(file_path).exists():
                Path(file_path).unlink()

    async def _decompress_file(self, compressed_path: str, output_path: str):
        """Decompress gzip file."""
        def decompress():
            with gzip.open(compressed_path, "rb") as f_in:
                with open(output_path, "wb") as f_out:
                    shutil.copyfileobj(f_in, f_out)
        
        await asyncio.to_thread(decompress)

    async def _restore_postgresql(self, file_path: str, connection: DatabaseConnection):
        """Restore PostgreSQL database."""
        cmd = [
            "psql",
            "-h", connection.host,
            "-p", str(connection.port or 5432),
            "-U", connection.username,
            "-d", connection.database,
            "-f", file_path,
        ]
        
        env = {"PGPASSWORD": connection.password} if connection.password else {}
        process = await asyncio.create_subprocess_exec(
            *cmd,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"psql restore failed: {stderr.decode()}")

    async def _restore_mysql(self, file_path: str, connection: DatabaseConnection):
        """Restore MySQL database."""
        cmd = [
            "mysql",
            "-h", connection.host,
            "-P", str(connection.port or 3306),
            "-u", connection.username,
        ]
        
        if connection.password:
            cmd.append(f"-p{connection.password}")
        
        cmd.append(connection.database)
        
        with open(file_path, "r") as f:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=f,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            _, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"mysql restore failed: {stderr.decode()}")

    async def _restore_sqlite(self, file_path: str, connection: DatabaseConnection):
        """Restore SQLite database."""
        await asyncio.to_thread(shutil.copy2, file_path, connection.database)

    async def _restore_mongodb(self, file_path: str, connection: DatabaseConnection):
        """Restore MongoDB database."""
        temp_dir = file_path + "_extract"
        
        if file_path.endswith(".gz"):
            await self._decompress_directory(file_path, temp_dir)
            restore_dir = temp_dir
        else:
            restore_dir = file_path
        
        try:
            cmd = [
                "mongorestore",
                "--host", connection.host,
                "--port", str(connection.port or 27017),
                "--db", connection.database,
                restore_dir,
            ]
            
            if connection.username:
                cmd.extend(["--username", connection.username])
            if connection.password:
                cmd.extend(["--password", connection.password])
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            _, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"mongorestore failed: {stderr.decode()}")
        finally:
            if file_path.endswith(".gz") and Path(temp_dir).exists():
                await asyncio.to_thread(shutil.rmtree, temp_dir)

    async def _decompress_directory(self, compressed_path: str, output_dir: str):
        """Decompress tar.gz directory."""
        def decompress():
            import tarfile
            with tarfile.open(compressed_path, "r:gz") as tar:
                tar.extractall(output_dir)
        
        await asyncio.to_thread(decompress)

    async def delete_backup(self, backup_id: str) -> bool:
        """Delete backup file and metadata."""
        backup = await self.storage.get_backup(backup_id)
        if not backup:
            return False
        
        if Path(backup.file_path).exists():
            Path(backup.file_path).unlink()
        
        return await self.storage.delete_backup(backup_id)

    async def verify_backup(self, backup_id: str) -> bool:
        """Verify backup file integrity."""
        backup = await self.storage.get_backup(backup_id)
        if not backup or not Path(backup.file_path).exists():
            return False
        
        try:
            file_path = backup.file_path
            if backup.compressed:
                with gzip.open(file_path, 'rb') as f:
                    f.read(1024)
            else:
                with open(file_path, 'rb') as f:
                    f.read(1024)
            
            await self.storage.update_backup(backup_id, verified=True)
            return True
        except Exception:
            return False

    def parse_schedule(self, schedule: str) -> Optional[datetime]:
        """Parse schedule string to next run time."""
        now = datetime.now()
        if schedule == 'daily':
            return now + timedelta(days=1)
        elif schedule == 'weekly':
            return now + timedelta(weeks=1)
        elif schedule == 'monthly':
            return now + timedelta(days=30)
        return None

    async def apply_retention_policy(self, connection_id: str, schedule_id: str, retention_count: int):
        """Apply retention policy to backups."""
        backups = await self.storage.get_all_backups(connection_id)
        schedule_backups = [b for b in backups if b.schedule_id == schedule_id and b.status == BackupStatus.COMPLETED]
        schedule_backups.sort(key=lambda x: x.created_at, reverse=True)
        
        if len(schedule_backups) > retention_count:
            for backup in schedule_backups[retention_count:]:
                await self.delete_backup(backup.id)
