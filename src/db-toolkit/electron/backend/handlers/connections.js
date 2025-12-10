/**
 * Connection management IPC handlers.
 */

const { ipcMain } = require('electron');
const { connectionStorage } = require('../utils/connection-storage');
const { connectionManager } = require('../utils/connection-manager');
const { ConnectorFactory } = require('../connectors');
const { logger } = require('../utils/logger.js');

function registerConnectionHandlers() {
  // Get all connections
  ipcMain.handle('connections:getAll', async () => {
    try {
      return await connectionStorage.getAllConnections();
    } catch (error) {
      logger.error('Failed to get connections:', error);
      throw error;
    }
  });

  // Create connection
  ipcMain.handle('connections:create', async (event, request) => {
    try {
      logger.info(`Creating connection '${request.name}' (${request.db_type})`);
      return await connectionStorage.addConnection(
        request.name,
        request.db_type,
        {
          host: request.host,
          port: request.port,
          database: request.database,
          username: request.username,
          password: request.password,
        }
      );
    } catch (error) {
      logger.error(`Failed to create connection '${request.name}':`, error);
      throw error;
    }
  });

  // Update connection
  ipcMain.handle('connections:update', async (event, connectionId, request) => {
    try {
      const connection = await connectionStorage.getConnection(connectionId);
      if (!connection) {
        throw new Error('Connection not found');
      }

      return await connectionStorage.updateConnection(connectionId, {
        name: request.name,
        db_type: request.db_type,
        host: request.host,
        port: request.port,
        database: request.database,
        username: request.username,
        password: request.password,
      });
    } catch (error) {
      logger.error('Failed to update connection:', error);
      throw error;
    }
  });

  // Delete connection
  ipcMain.handle('connections:delete', async (event, connectionId) => {
    try {
      logger.info(`Deleting connection '${connectionId}'`);
      const success = await connectionStorage.removeConnection(connectionId);
      if (!success) {
        throw new Error('Connection not found');
      }
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete connection:', error);
      throw error;
    }
  });

  // Test connection
  ipcMain.handle('connections:test', async (event, request) => {
    try {
      const connector = ConnectorFactory.createConnector(request.db_type);
      const result = await connector.testConnection({
        host: request.host,
        port: request.port,
        database: request.database,
        username: request.username,
        password: request.password,
      });
      return { data: result };
    } catch (error) {
      return { data: { success: false, message: error.message } };
    }
  });

  // Connect to database
  ipcMain.handle('connections:connect', async (event, connectionId) => {
    try {
      const connection = await connectionStorage.getConnection(connectionId);
      if (!connection) {
        throw new Error('Connection not found');
      }

      logger.info(`Connecting to database '${connection.name}'`);
      const success = await connectionManager.connect(connection);

      if (success) {
        logger.info(`Successfully connected to '${connection.name}'`);
        return { data: { success: true, message: 'Connected successfully' } };
      } else {
        logger.error(`Failed to connect to '${connection.name}'`);
        const error = new Error('Failed to connect. Please check your credentials and database server.');
        error.response = { data: { detail: error.message } };
        throw error;
      }
    } catch (error) {
      logger.error('Connection error:', error);
      if (!error.response) {
        error.response = { data: { detail: error.message } };
      }
      throw error;
    }
  });

  // Disconnect from database
  ipcMain.handle('connections:disconnect', async (event, connectionId) => {
    try {
      const success = await connectionManager.disconnect(connectionId);
      return {
        data: {
          success,
          message: success ? 'Disconnected' : 'Not connected',
        }
      };
    } catch (error) {
      logger.error('Disconnect error:', error);
      throw error;
    }
  });

  // Get connection status
  ipcMain.handle('connections:status', async (event, connectionId) => {
    try {
      return await connectionManager.getConnectionStatus(connectionId);
    } catch (error) {
      logger.error('Failed to get connection status:', error);
      throw error;
    }
  });
}

module.exports = { registerConnectionHandlers };
