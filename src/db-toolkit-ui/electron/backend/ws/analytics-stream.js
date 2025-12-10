/**
 * Real-time analytics streaming using IPC events.
 */

const { BrowserWindow } = require('electron');
const { AnalyticsManager } = require('../operations/analytics-manager');
const { getConnection } = require('../utils/connection-manager');
const { getConnectionById } = require('../utils/connection-storage');

const activeStreams = new Map();

function startAnalyticsStream(connectionId) {
  if (activeStreams.has(connectionId)) return;

  const connection = getConnection(connectionId);
  const config = getConnectionById(connectionId);
  
  if (!connection || !config) return;

  const manager = new AnalyticsManager(connection);
  
  const interval = setInterval(async () => {
    try {
      const result = await manager.getAnalytics(config, connectionId);
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('analytics:update', {
          connection_id: connectionId,
          data: result
        });
      }
    } catch (error) {
      stopAnalyticsStream(connectionId);
    }
  }, 3000);

  activeStreams.set(connectionId, interval);
}

function stopAnalyticsStream(connectionId) {
  const interval = activeStreams.get(connectionId);
  if (interval) {
    clearInterval(interval);
    activeStreams.delete(connectionId);
  }
}

function stopAllStreams() {
  for (const [connectionId] of activeStreams) {
    stopAnalyticsStream(connectionId);
  }
}

module.exports = { startAnalyticsStream, stopAnalyticsStream, stopAllStreams };
