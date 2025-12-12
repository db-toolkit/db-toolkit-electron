const { app, BrowserWindow } = require('electron');
const { createWindow } = require('./window-manager');
const { registerAdditionalHandlers } = require('./ipc-handlers');
const { restoreSession, saveSession, cleanupSession } = require('./session-lifecycle');

function registerIpcHandlers() {
  // Register all backend IPC handlers
  const { registerAllHandlers } = require('./backend/handlers');
  registerAllHandlers();
  
  // Register additional handlers
  registerAdditionalHandlers();
}

app.whenReady().then(async () => {
  registerIpcHandlers();
  const { createMenu } = require('./menu');
  const { startBackgroundTasks } = require('./backend/operations/tasks');
  
  const mainWindow = createWindow();
  createMenu(mainWindow, !app.isPackaged);
  
  // Start background tasks
  startBackgroundTasks();
  
  // Restore previous session
  await restoreSession();
});

app.on('window-all-closed', async () => {
  await saveSession();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  const { stopBackgroundTasks } = require('./backend/operations/tasks');
  stopBackgroundTasks();
  await cleanupSession();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
