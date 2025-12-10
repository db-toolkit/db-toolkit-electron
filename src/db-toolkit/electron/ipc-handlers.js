/**
 * Additional IPC handlers for file operations and system metrics.
 */

const { ipcMain, shell, dialog, BrowserWindow, app } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { exec } = require('child_process');

function registerFileHandlers() {
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('list-migration-files', async (event, projectPath) => {
    try {
      const migrationsPath = path.join(projectPath, 'migrations');
      const files = await fs.readdir(migrationsPath);
      return files
        .filter(f => f.endsWith('.py') && f !== '__init__.py')
        .map(name => ({
          name,
          path: path.join(migrationsPath, name)
        }));
    } catch (error) {
      return [];
    }
  });

  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error('Failed to read file');
    }
  });

  ipcMain.handle('open-in-editor', async (event, filePath) => {
    try {
      await shell.openPath(filePath);
    } catch (error) {
      throw new Error('Failed to open file');
    }
  });

  ipcMain.handle('delete-file', async (event, filePath) => {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      throw new Error('Failed to delete file');
    }
  });

  ipcMain.handle('rename-file', async (event, oldPath, newName) => {
    try {
      const dir = path.dirname(oldPath);
      const newPath = path.join(dir, newName);
      await fs.rename(oldPath, newPath);
    } catch (error) {
      throw new Error('Failed to rename file');
    }
  });

  ipcMain.handle('open-folder', async (event, folderPath) => {
    try {
      await shell.openPath(folderPath);
    } catch (error) {
      throw new Error('Failed to open folder');
    }
  });

  ipcMain.handle('shell:showItemInFolder', async (event, filePath) => {
    try {
      shell.showItemInFolder(filePath);
    } catch (error) {
      throw new Error('Failed to show item in folder');
    }
  });

  ipcMain.handle('dialog:showOpenDialog', async (event, options) => {
    try {
      const result = await dialog.showOpenDialog(options);
      return result.canceled ? null : result.filePaths[0];
    } catch (error) {
      throw new Error('Failed to show open dialog');
    }
  });
}

function registerSystemHandlers() {
  ipcMain.handle('get-system-metrics', async () => {
    const loadAvg = os.loadavg()[0];
    
    return new Promise((resolve) => {
      if (process.platform === 'darwin' || process.platform === 'linux') {
        exec('df -k /', (error, stdout) => {
          let disk = { used: 0, free: 0, total: 0 };
          if (!error && stdout) {
            const lines = stdout.trim().split('\n');
            if (lines.length > 1) {
              const parts = lines[1].trim().split(/\s+/);
              const usedKB = parseInt(parts[2]) || 0;
              const availKB = parseInt(parts[3]) || 0;
              disk = {
                used: usedKB / 1024 / 1024,
                free: availKB / 1024 / 1024,
                total: (usedKB + availKB) / 1024 / 1024
              };
            }
          }
          resolve({ loadAvg, disk });
        });
      } else if (process.platform === 'win32') {
        exec('wmic logicaldisk get size,freespace,caption', (error, stdout) => {
          let disk = { used: 0, free: 0, total: 0 };
          if (!error && stdout) {
            const lines = stdout.trim().split('\n');
            if (lines.length > 1) {
              const parts = lines[1].trim().split(/\s+/);
              const freeBytes = parseInt(parts[1]) || 0;
              const totalBytes = parseInt(parts[2]) || 0;
              disk = {
                free: freeBytes / 1024 / 1024 / 1024,
                total: totalBytes / 1024 / 1024 / 1024,
                used: (totalBytes - freeBytes) / 1024 / 1024 / 1024
              };
            }
          }
          resolve({ loadAvg, disk });
        });
      } else {
        resolve({ loadAvg, disk: { used: 0, free: 0, total: 0 } });
      }
    });
  });


}

function registerMenuHandlers() {
  ipcMain.on('theme-changed', (event, theme) => {
    // Theme changed - menu will update on next createMenu call
  });

  ipcMain.on('update-recent-connections', (event, connections) => {
    const { updateRecentConnections } = require('./menu');
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (mainWindow) {
      updateRecentConnections(connections, mainWindow, !app.isPackaged);
    }
  });
}

function registerAdditionalHandlers() {
  registerFileHandlers();
  registerSystemHandlers();
  registerMenuHandlers();
}

module.exports = { registerAdditionalHandlers };