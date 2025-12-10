/**
 * IPC handlers for backup operations.
 */

const { ipcMain } = require('electron');
const { BackupManager } = require('../operations/backup-manager');
const { connectionManager } = require('../utils/connection-manager');
const { connectionStorage } = require('../utils/connection-storage');
const backupStorage = require('../utils/backup-storage');

function registerBackupHandlers() {
  const backupManager = new BackupManager();

  ipcMain.handle('backup:create', async (event, data) => {
    const { connection_id, name, backup_type, tables, compress } = data;
    const connectionId = connection_id;
    const backupType = backup_type;
    
    try {
      const config = await connectionStorage.getConnection(connectionId);
      
      if (!config) {
        return { success: false, error: 'Connection not found' };
      }

      const backup = await backupManager.createBackup(null, config, name, backupType, tables, compress);
      return { success: true, backup };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('backup:list', async (event, connectionId) => {
    try {
      const backups = await backupStorage.getAllBackups(connectionId);
      return { success: true, backups };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('backup:get', async (event, backupId) => {
    try {
      const backup = await backupStorage.getBackup(backupId);
      return { success: true, backup };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('backup:restore', async (event, backupId, targetConnectionId) => {
    try {
      const backup = await backupStorage.getBackup(backupId);
      const targetConnection = await connectionManager.getConnector(targetConnectionId);
      const targetConfig = await connectionStorage.getConnection(targetConnectionId);
      
      if (!backup || !targetConnection || !targetConfig) {
        return { success: false, error: 'Backup or connection not found' };
      }

      await backupManager.restoreBackup(backup, targetConnection, targetConfig);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('backup:delete', async (event, backupId) => {
    try {
      const result = await backupManager.deleteBackup(backupId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('backup:verify', async (event, backupId) => {
    try {
      const result = await backupManager.verifyBackup(backupId);
      return { success: true, verified: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('backup:schedule:create', async (event, schedule) => {
    try {
      const result = await backupStorage.addSchedule(schedule);
      return { success: true, schedule: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('backup:schedule:list', async (event) => {
    try {
      const schedules = await backupStorage.getAllSchedules();
      return { success: true, schedules };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('backup:schedule:update', async (event, scheduleId, updates) => {
    try {
      const result = await backupStorage.updateSchedule(scheduleId, updates);
      return { success: true, schedule: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('backup:schedule:delete', async (event, scheduleId) => {
    try {
      const result = await backupStorage.deleteSchedule(scheduleId);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('backup:get-all', async (event, connectionId) => {
    try {
      const backups = await backupStorage.getAllBackups(connectionId);
      return { success: true, backups };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('backup:download', async (event, backupId) => {
    try {
      const backup = await backupStorage.getBackup(backupId);
      if (!backup) {
        return { success: false, error: 'Backup not found' };
      }
      // For Electron, we just return the file path - the frontend handles the download
      return { success: true, filePath: backup.file_path };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerBackupHandlers };
