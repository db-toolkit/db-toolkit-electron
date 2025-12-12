/**
 * SQLite backup operations.
 */

const fs = require('fs').promises;

async function backupSQLite(backup, config) {
  const { backupNotifier } = require('../../ws/backup-notifier');
  const outputFile = backup.file_path.replace('.gz', '');
  
  await backupNotifier.notifyBackupUpdate(backup.id, 'in_progress', { 
    connection_name: config.name, 
    progress: 40 
  });
  
  await fs.copyFile(config.database, outputFile);
  
  await backupNotifier.notifyBackupUpdate(backup.id, 'in_progress', { 
    connection_name: config.name, 
    progress: 80 
  });
}

async function restoreSQLite(filePath, config) {
  await fs.copyFile(filePath, config.database);
}

module.exports = { backupSQLite, restoreSQLite };
