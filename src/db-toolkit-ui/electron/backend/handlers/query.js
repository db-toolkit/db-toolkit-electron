/**
 * Query execution IPC handlers.
 */

const { ipcMain } = require('electron');
const { connectionStorage } = require('../utils/connection-storage');
const { queryExecutor } = require('../operations/query-executor');
const { queryHistory } = require('../operations/query-history');

function registerQueryHandlers() {
  // Execute query
  ipcMain.handle('query:execute', async (event, connectionId, request) => {
    try {
      const connection = await connectionStorage.getConnection(connectionId);
      if (!connection) {
        throw new Error('Connection not found');
      }

      console.log(`Executing query on '${connection.name}': ${request.query.substring(0, 100)}...`);

      const result = await queryExecutor.executeQuery(
        connection,
        request.query,
        request.limit,
        request.offset || 0,
        request.timeout
      );

      if (result.success) {
        console.log(`Query executed successfully (${result.total_rows} rows, ${result.execution_time}s)`);
      } else {
        console.error(`Query failed: ${result.error}`);
      }

      // Save to history
      await queryHistory.addQuery(
        connectionId,
        request.query,
        result.success,
        result.execution_time,
        result.total_rows,
        result.error
      );

      return result;
    } catch (error) {
      console.error('Query execution error:', error);
      throw error;
    }
  });

  // Get query history
  ipcMain.handle('query:getHistory', async (event, connectionId, limit = 50) => {
    try {
      const connection = await connectionStorage.getConnection(connectionId);
      if (!connection) {
        throw new Error('Connection not found');
      }

      const queries = await queryHistory.getHistory(connectionId, limit);
      return { success: true, history: queries, count: queries.length };
    } catch (error) {
      console.error('Failed to get query history:', error);
      throw error;
    }
  });

  // Clear query history
  ipcMain.handle('query:clearHistory', async (event, connectionId) => {
    try {
      const connection = await connectionStorage.getConnection(connectionId);
      if (!connection) {
        throw new Error('Connection not found');
      }

      const success = await queryHistory.clearHistory(connectionId);
      return {
        success,
        message: success ? 'History cleared' : 'No history found',
      };
    } catch (error) {
      console.error('Failed to clear query history:', error);
      throw error;
    }
  });

  // Search query history
  ipcMain.handle('query:searchHistory', async (event, connectionId, searchTerm) => {
    try {
      const connection = await connectionStorage.getConnection(connectionId);
      if (!connection) {
        throw new Error('Connection not found');
      }

      const results = await queryHistory.searchHistory(connectionId, searchTerm);
      return { success: true, results, count: results.length };
    } catch (error) {
      console.error('Failed to search query history:', error);
      throw error;
    }
  });

  // Cleanup old query history
  ipcMain.handle('query:cleanupHistory', async (event, retentionDays = 30) => {
    try {
      console.log(`Cleaning up query history older than ${retentionDays} days`);
      const removed = await queryHistory.cleanupOldHistory(retentionDays);
      console.log(`Removed ${removed} old queries from history`);
      return {
        success: true,
        removed_count: removed,
        message: `Removed ${removed} old queries`,
      };
    } catch (error) {
      console.error('Failed to cleanup query history:', error);
      throw error;
    }
  });
}

module.exports = { registerQueryHandlers };
