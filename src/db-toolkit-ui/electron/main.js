const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { checkForUpdates } = require('./updater');

// Set app name before anything else
app.name = 'DB Toolkit';

function createMenu() {
  const isDev = !app.isPackaged;
  
  const viewSubmenu = [
    { role: 'reload' },
    { role: 'forceReload' },
  ];
  
  if (isDev) {
    viewSubmenu.push({ role: 'toggleDevTools' });
  }
  
  viewSubmenu.push(
    { type: 'separator' },
    { role: 'resetZoom' },
    { role: 'zoomIn' },
    { role: 'zoomOut' },
    { type: 'separator' },
    { role: 'togglefullscreen' }
  );

  const template = [
    {
      label: 'DB Toolkit',
      submenu: [
        {
          label: 'About DB Toolkit',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'About DB Toolkit',
              message: 'DB Toolkit',
              detail: `Version: 0.5.2\nA modern database management tool\n\nBuilt with Electron, React, and Python FastAPI\n\n© 2025 DB Toolkit`,
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Check for Updates...',
          click: checkForUpdates
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { label: 'Hide DB Toolkit', role: 'hide' },
        { role: 'hideOthers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: viewSubmenu
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const iconPath = path.join(__dirname, '../build/icons/icon.png');
  
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'DB Toolkit',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    },
  });
  
  win.on('page-title-updated', (event) => {
    event.preventDefault();
  });

  const isDev = !app.isPackaged;
  
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

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

app.whenReady().then(() => {
  createMenu();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
