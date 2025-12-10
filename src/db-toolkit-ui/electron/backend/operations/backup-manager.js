/**
 * Central backup manager.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const backupStorage = require('../utils/backup-storage');
const { backupPostgreSQL, restorePostgreSQL } = require('./backup/postgresql-backup');
const { backupMySQL, restoreMySQL } = require('./backup/mysql-backup');
const { backupSQLite, restoreSQLite } = require('./backup/sqlite-backup');
const { backupMongoDB, restoreMongoDB } = require('./backup/mongodb-backup');
const { compressFile, decompressFile } = require('./backup/compression');

const BACKUP_DIR = path.join(os.homedir(), '.db-toolkit', 'backups', 'files');

class BackupManager {
  constructor() {
    this.ensureBackupDir();
  }

  async ensureBackupDir() {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }

  async createBackup(connection, config, name, backupType, tables = null, compress = true) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    let filename = `${config.name}_${timestamp}.sql`;
    if (compress) filename += '.gz';
    
    const filePath = path.join(BACKUP_DIR, filename);
    
    const backup = await backupStorage.addBackup(
      config.id,
      name,
      backupType,
      filePath,
      tables,
      compress
    );
    
    this._executeBackup(backup, connection, config, tables, compress);
    return backup;
  }

  async _executeBackup(backup, connection, config, tables, compress) {
    const { backupNotifier } = require('../ws/backup-notifier');
    
    try {
      await backupStorage.updateBackup(backup.id, { status: 'in_progress' });
      await backupNotifier.notifyBackupUpdate(backup.id, 'in_progress', { 
        connection_name: config.name, 
        progress: 0 
      });
      
      await backupNotifier.notifyBackupUpdate(backup.id, 'in_progress', { 
        connection_name: config.name, 
        progress: 25 
      });
      
      const dbType = config.type;
      if (dbType === 'postgresql') {
        await backupPostgreSQL(backup, config, tables);
      } else if (dbType === 'mysql') {
        await backupMySQL(backup, config, tables);
      } else if (dbType === 'sqlite') {
        await backupSQLite(backup, config);
      } else if (dbType === 'mongodb') {
        await backupMongoDB(backup, config, tables);
      } else {
        throw new Error(`Backup not supported for ${dbType}`);
      }
      
      await backupNotifier.notifyBackupUpdate(backup.id, 'in_progress', { 
        connection_name: config.name, 
        progress: 75 
      });
      
      if (compress) {
        await backupNotifier.notifyBackupUpdate(backup.id, 'in_progress', { 
          connection_name: config.name, 
          progress: 85 
        });
        const uncompressed = backup.file_path.replace('.gz', '');
        if (await this._fileExists(uncompressed)) {
          await compressFile(uncompressed);
        }
      }
      
      const finalPath = await this._fileExists(backup.file_path) ? backup.file_path : backup.file_path.replace('.gz', '');
      const stats = await fs.stat(finalPath);
      
      await backupStorage.updateBackup(backup.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        file_size: stats.size,
        file_path: finalPath
      });
      
      await backupNotifier.notifyBackupUpdate(backup.id, 'completed', { 
        file_size: stats.size, 
        connection_name: config.name, 
        progress: 100 
      });
    } catch (error) {
      await backupStorage.updateBackup(backup.id, {
        status: 'failed',
        error_message: error.message
      });
      
      await backupNotifier.notifyBackupUpdate(backup.id, 'failed', { 
        error: error.message, 
        connection_name: config.name 
      });
    }
  }

  async restoreBackup(backup, targetConnection, targetConfig) {
    let filePath = backup.file_path;
    
    if (backup.compressed) {
      const tempFile = filePath.replace('.gz', '');
      await decompressFile(filePath, tempFile);
      filePath = tempFile;
    }
    
    try {
      const dbType = targetConfig.type;
      if (dbType === 'postgresql') {
        await restorePostgreSQL(filePath, targetConfig);
      } else if (dbType === 'mysql') {
        await restoreMySQL(filePath, targetConfig);
      } else if (dbType === 'sqlite') {
        await restoreSQLite(filePath, targetConfig);
      } else if (dbType === 'mongodb') {
        await restoreMongoDB(filePath, targetConfig);
      }
    } finally {
      if (backup.compressed && await this._fileExists(filePath)) {
        await fs.unlink(filePath);
      }
    }
  }

  async deleteBackup(backupId) {
    const backup = await backupStorage.getBackup(backupId);
    if (!backup) return false;
    
    if (await this._fileExists(backup.file_path)) {
      await fs.unlink(backup.file_path);
    }
    
    return await backupStorage.deleteBackup(backupId);
  }

  async verifyBackup(backupId) {
    const backup = await backupStorage.getBackup(backupId);
    if (!backup || !(await this._fileExists(backup.file_path))) {
      return false;
    }
    
    try {
      const stats = await fs.stat(backup.file_path);
      if (stats.size === 0) return false;
      
      await backupStorage.updateBackup(backupId, { verified: true });
      return true;
    } catch {
      return false;
    }
  }

  async _fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = { BackupManager };
