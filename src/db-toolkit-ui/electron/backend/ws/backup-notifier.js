/**
 * Backup status notifier using IPC events.
 */

const { BrowserWindow } = require('electron');

class BackupNotifier {
  async notifyBackupUpdate(backupId, status, data = {}) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('backup:update', {
        type: 'backup_update',
        backup_id: backupId,
        status,
        data
      });
    }
  }
}

const backupNotifier = new BackupNotifier();

module.exports = { backupNotifier };
