const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');

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
              detail: `Version: 2.0.0\nA modern database management tool\n\nBuilt with Electron, React, and Python FastAPI\n\n© 2025 DB Toolkit`,
              buttons: ['OK']
            });
          }
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
