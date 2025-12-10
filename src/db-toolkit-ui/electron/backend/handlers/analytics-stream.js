/**
 * IPC handlers for analytics streaming.
 */

const { ipcMain } = require('electron');
const { startAnalyticsStream, stopAnalyticsStream } = require('../ws/analytics-stream');

function registerAnalyticsStreamHandlers() {
  ipcMain.handle('analytics:stream:start', async (event, connectionId) => {
    try {
      startAnalyticsStream(connectionId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('analytics:stream:stop', async (event, connectionId) => {
    try {
      stopAnalyticsStream(connectionId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerAnalyticsStreamHandlers };
