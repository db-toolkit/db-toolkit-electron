/**
 * Connection management operations.
 */

const { ConnectorFactory } = require('../connectors');
const { settingsStorage } = require('./settings-storage');

class ConnectionManager {
  constructor() {
    this.activeConnections = new Map();
    this.connectionMetadata = new Map();
  }

  async connect(connection, timeout = null) {
    console.log(`Connecting to '${connection.name}' (${connection.db_type})`);
    
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
        console.log(`Successfully connected to '${connection.name}'`);
        return true;
      }
      
      console.error(`Failed to connect to '${connection.name}'`);
      return false;
    } catch (error) {
      console.error(`Connection error for '${connection.name}':`, error.message);
      return false;
    }
  }

  async disconnect(connectionId) {
    console.log(`Disconnecting from connection '${connectionId}'`);
    
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
