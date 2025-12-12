/**
 * Connection management operations.
 */

const { ConnectorFactory } = require('../connectors');
const { settingsStorage } = require('./settings-storage');
const { logger } = require('./logger');

class ConnectionManager {
  constructor() {
    this.activeConnections = new Map();
    this.connectionMetadata = new Map();
    this.reconnectTimers = new Map();
  }

  async connect(connection, timeout = null) {
    logger.info(`Connecting to '${connection.name}' (${connection.db_type})`);
    
    try {
      if (timeout === null) {
        const settings = await settingsStorage.getSettings();
        timeout = settings.connection_timeout;
      }
      
      const connector = ConnectorFactory.createConnector(connection.db_type);
      
      const connectPromise = connector.connect(connection);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), timeout * 1000)
      );
      
      const success = await Promise.race([connectPromise, timeoutPromise]);
      
      if (success) {
        this.activeConnections.set(connection.id, connector);
        this.connectionMetadata.set(connection.id, connection);
        logger.info(`Successfully connected to '${connection.name}'`);
        
        if (connection.auto_reconnect) {
          this.setupAutoReconnect(connection.id);
        }
        
        return true;
      }
      
      logger.error(`Failed to connect to '${connection.name}'`);
      return false;
    } catch (error) {
      logger.error(`Connection error for '${connection.name}': ${error.message}`);
      
      if (connection.auto_reconnect) {
        this.scheduleReconnect(connection.id, connection);
      }
      
      return false;
    }
  }

  async disconnect(connectionId) {
    logger.info(`Disconnecting from connection '${connectionId}'`);
    
    this.clearReconnectTimer(connectionId);
    
    const connector = this.activeConnections.get(connectionId);
    if (connector) {
      const success = await connector.disconnect();
      if (success) {
        this.activeConnections.delete(connectionId);
        this.connectionMetadata.delete(connectionId);
      }
      return success;
    }
    return false;
  }

  async getConnector(connectionId) {
    return this.activeConnections.get(connectionId);
  }

  async getConnection(connectionId) {
    return this.connectionMetadata.get(connectionId);
  }

  async isConnected(connectionId) {
    const connector = this.activeConnections.get(connectionId);
    return connector !== undefined && connector.isConnected;
  }

  async getAllActiveConnections() {
    return Array.from(this.activeConnections.keys());
  }

  async getConnectionCount() {
    return this.activeConnections.size;
  }

  async disconnectAll() {
    const connectionIds = Array.from(this.activeConnections.keys());
    for (const connectionId of connectionIds) {
      await this.disconnect(connectionId);
    }
  }

  setupAutoReconnect(connectionId) {
    const checkInterval = setInterval(async () => {
      const connector = this.activeConnections.get(connectionId);
      const connection = this.connectionMetadata.get(connectionId);
      
      if (!connector || !connection) {
        this.clearReconnectTimer(connectionId);
        return;
      }
      
      if (!connector.isConnected) {
        logger.warn(`Connection lost for '${connection.name}', attempting reconnect...`);
        await this.connect(connection);
      }
    }, 30000); // Check every 30 seconds
    
    this.reconnectTimers.set(connectionId, checkInterval);
  }

  scheduleReconnect(connectionId, connection, attempt = 1) {
    if (attempt > 3) {
      logger.error(`Max reconnect attempts reached for '${connection.name}'`);
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
    logger.info(`Scheduling reconnect attempt ${attempt} for '${connection.name}' in ${delay}ms`);
    
    const timer = setTimeout(async () => {
      const success = await this.connect(connection);
      if (!success) {
        this.scheduleReconnect(connectionId, connection, attempt + 1);
      }
    }, delay);
    
    this.reconnectTimers.set(connectionId, timer);
  }

  clearReconnectTimer(connectionId) {
    const timer = this.reconnectTimers.get(connectionId);
    if (timer) {
      clearTimeout(timer);
      clearInterval(timer);
      this.reconnectTimers.delete(connectionId);
    }
  }

  async getConnectionStatus(connectionId) {
    const connector = this.activeConnections.get(connectionId);
    const metadata = this.connectionMetadata.get(connectionId);

    if (!connector || !metadata) {
      return { connected: false };
    }

    return {
      connected: connector.isConnected,
      db_type: metadata.db_type,
      name: metadata.name,
    };
  }
}

const connectionManager = new ConnectionManager();

module.exports = { ConnectionManager, connectionManager };
