/**
 * Connection storage management.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');

class ConnectionStorage {
  constructor(storagePath = null) {
    this.storagePath = storagePath || path.join(os.homedir(), '.db-toolkit', 'connections.json');
  }

  async ensureStorageDir() {
    const dir = path.dirname(this.storagePath);
    await fs.mkdir(dir, { recursive: true });
  }

  async getAllConnections() {
    try {
      await this.ensureStorageDir();
      const data = await fs.readFile(this.storagePath, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed.connections || [];
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async getConnection(connectionId) {
    const connections = await this.getAllConnections();
    return connections.find(conn => conn.id === connectionId) || null;
  }

  async addConnection(name, dbType, options = {}) {
    const connection = {
      id: crypto.randomUUID(),
      name,
      db_type: dbType,
      ...options,
    };

    const connections = await this.getAllConnections();
    connections.push(connection);
    await this.saveConnections(connections);

    return connection;
  }

  async updateConnection(connectionId, updates) {
    const connections = await this.getAllConnections();
    const index = connections.findIndex(conn => conn.id === connectionId);

    if (index === -1) {
      return null;
    }

    connections[index] = {
      ...connections[index],
      ...updates,
      id: connectionId,
    };

    await this.saveConnections(connections);
    return connections[index];
  }

  async removeConnection(connectionId) {
    const connections = await this.getAllConnections();
    const originalCount = connections.length;
    const filtered = connections.filter(conn => conn.id !== connectionId);

    if (filtered.length < originalCount) {
      await this.saveConnections(filtered);
      return true;
    }
    return false;
  }

  async saveConnections(connections) {
    await this.ensureStorageDir();
    const data = { connections };
    await fs.writeFile(this.storagePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

const connectionStorage = new ConnectionStorage();

module.exports = { ConnectionStorage, connectionStorage };
