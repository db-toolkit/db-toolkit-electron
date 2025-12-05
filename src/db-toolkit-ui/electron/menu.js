const { Menu, dialog, shell } = require('electron');
const { checkForUpdates } = require('./updater');

let currentTheme = 'light';
let recentConnections = [];

function createMenu(mainWindow, isDev = false) {
  
  const template = [
    {
      label: 'DB Toolkit',
      submenu: [
        {
          label: 'About DB Toolkit',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About DB Toolkit',
              message: 'DB Toolkit',
              detail: `Version: 0.5.1\nA modern database management tool\n\nBuilt with Electron, React, and Python FastAPI\n\n© 2025 DB Toolkit`,
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
    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Connection',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-action', 'new-connection')
        },
        {
          label: 'New Query Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow.webContents.send('menu-action', 'new-query-tab')
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => mainWindow.webContents.send('menu-action', 'close-tab')
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow.webContents.send('menu-action', 'preferences')
        },
        { type: 'separator' },
        {
          label: 'Recent Connections',
          submenu: recentConnections.length > 0 
            ? recentConnections.map(conn => ({
                label: conn.name,
                click: () => mainWindow.webContents.send('menu-action', 'connect-recent', conn.id)
              }))
            : [{ label: 'No recent connections', enabled: false }]
        }
      ]
    },
    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow.webContents.send('menu-action', 'find')
        },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    // View Menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow.webContents.send('menu-action', 'toggle-sidebar')
        },
        {
          label: 'Toggle Terminal',
          accelerator: 'CmdOrCtrl+`',
          click: () => mainWindow.webContents.send('menu-action', 'toggle-terminal')
        },
        {
          label: 'Toggle AI Assistant',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => mainWindow.webContents.send('menu-action', 'toggle-ai')
        },
        { type: 'separator' },
        {
          label: currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => mainWindow.webContents.send('menu-action', 'toggle-theme')
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // Database Menu
    {
      label: 'Database',
      submenu: [
        {
          label: 'Connect to Database',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => mainWindow.webContents.send('menu-action', 'connect-database')
        },
        {
          label: 'Disconnect',
          click: () => mainWindow.webContents.send('menu-action', 'disconnect-database')
        },
        {
          label: 'Refresh Schema',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.webContents.send('menu-action', 'refresh-schema')
        },
        { type: 'separator' },
        {
          label: 'Run Query',
          accelerator: 'CmdOrCtrl+Enter',
          click: () => mainWindow.webContents.send('menu-action', 'run-query')
        },
        {
          label: 'Stop Query',
          accelerator: 'CmdOrCtrl+.',
          click: () => mainWindow.webContents.send('menu-action', 'stop-query')
        },
        { type: 'separator' },
        {
          label: 'View ER Diagram',
          click: () => mainWindow.webContents.send('menu-action', 'view-er-diagram')
        },
        {
          label: 'Analyze Schema with AI',
          click: () => mainWindow.webContents.send('menu-action', 'analyze-schema')
        }
      ]
    },
    // Tools Menu
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Migrations',
          click: () => mainWindow.webContents.send('menu-action', 'open-migrations')
        },
        {
          label: 'Backups & Restore',
          click: () => mainWindow.webContents.send('menu-action', 'open-backups')
        },
        {
          label: 'Analytics Dashboard',
          click: () => mainWindow.webContents.send('menu-action', 'open-analytics')
        },
        { type: 'separator' },
        {
          label: 'Terminal',
          accelerator: 'CmdOrCtrl+`',
          click: () => mainWindow.webContents.send('menu-action', 'toggle-terminal')
        },
        {
          label: 'Command Palette',
          accelerator: 'CmdOrCtrl+K',
          click: () => mainWindow.webContents.send('menu-action', 'command-palette')
        }
      ]
    },
    // Window Menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    },
    // Help Menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          accelerator: 'F1',
          click: () => shell.openExternal('https://github.com/yourusername/db-toolkit')
        },
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: () => mainWindow.webContents.send('menu-action', 'keyboard-shortcuts')
        },
        {
          label: 'Report Issue',
          click: () => mainWindow.webContents.send('menu-action', 'report-issue')
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: checkForUpdates
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function updateThemeMenu(theme) {
  currentTheme = theme;
}

function updateRecentConnections(connections, mainWindow, isDev = false) {
  recentConnections = connections.slice(0, 5);
  createMenu(mainWindow, isDev);
}

module.exports = { createMenu, updateThemeMenu, updateRecentConnections };
