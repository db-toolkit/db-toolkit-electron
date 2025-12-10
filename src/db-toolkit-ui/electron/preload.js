const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getSystemMetrics: () => ipcRenderer.invoke('get-system-metrics'),
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action, data) => callback(action, data));
  },
  removeMenuActionListener: () => {
    ipcRenderer.removeAllListeners('menu-action');
  },
  sendThemeChange: (theme) => {
    ipcRenderer.send('theme-changed', theme);
  },
  updateRecentConnections: (connections) => {
    ipcRenderer.send('update-recent-connections', connections);
  },
  ipcRenderer: {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
  }
});
