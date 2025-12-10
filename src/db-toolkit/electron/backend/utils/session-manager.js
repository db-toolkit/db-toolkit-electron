/**
 * Session state management.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { connectionStorage } = require('./connection-storage');
const { logger } = require('./logger');

class SessionManager {
  constructor() {
    this.sessionFile = path.join(os.homedir(), '.db-toolkit', 'session.json');
  }

  async ensureDir() {
    const dir = path.dirname(this.sessionFile);
    await fs.mkdir(dir, { recursive: true });
  }

  async saveSession(activeConnectionIds, lastActive = null) {
    try {
      await this.ensureDir();
      const sessionData = {
        active_connection_ids: activeConnectionIds,
        last_active_connection: lastActive,
        settings: {},
      };

      await fs.writeFile(this.sessionFile, JSON.stringify(sessionData, null, 2), 'utf-8');
      return true;
    } catch (error) {
      logger.error('Failed to save session:', error);
      return false;
    }
  }

  async loadSession() {
    try {
      const data = await fs.readFile(this.sessionFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Failed to load session:', error);
      }
      return { active_connection_ids: [], last_active_connection: null, settings: {} };
    }
  }

  async clearSession() {
    try {
      await fs.unlink(this.sessionFile);
      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Failed to clear session:', error);
        return false;
      }
      return true;
    }
  }

  async getRestorableConnections() {
    const session = await this.loadSession();
    const connections = [];

    for (const connId of session.active_connection_ids || []) {
      const conn = await connectionStorage.getConnection(connId);
      if (conn) {
        connections.push(conn);
      }
    }

    return connections;
  }
}

const sessionManager = new SessionManager();

module.exports = { SessionManager, sessionManager };
