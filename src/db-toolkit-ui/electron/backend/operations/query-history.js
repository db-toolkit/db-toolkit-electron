/**
 * Query history management.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class QueryHistory {
  constructor(storagePath = null, maxHistory = 100) {
    this.storagePath = storagePath || path.join(os.homedir(), '.db-toolkit', 'query_history.json');
    this.maxHistory = maxHistory;
  }

  async ensureStorageDir() {
    const dir = path.dirname(this.storagePath);
    await fs.mkdir(dir, { recursive: true });
  }

  async addQuery(connectionId, query, success, executionTime, rowCount = 0, error = null) {
    const history = await this.loadHistory();

    if (!history[connectionId]) {
      history[connectionId] = [];
    }

    const entry = {
      query,
      timestamp: Date.now() / 1000,
      success,
      execution_time: executionTime,
      row_count: rowCount,
      error,
    };

    history[connectionId].unshift(entry);
    history[connectionId] = history[connectionId].slice(0, this.maxHistory);

    await this.saveHistory(history);
  }

  async getHistory(connectionId, limit = 50) {
    const history = await this.loadHistory();
    return (history[connectionId] || []).slice(0, limit);
  }

  async clearHistory(connectionId) {
    const history = await this.loadHistory();
    if (history[connectionId]) {
      delete history[connectionId];
      await this.saveHistory(history);
      return true;
    }
    return false;
  }

  async searchHistory(connectionId, searchTerm) {
    const history = await this.getHistory(connectionId);
    const term = searchTerm.toLowerCase();

    return history.filter(entry => entry.query.toLowerCase().includes(term));
  }

  async cleanupOldHistory(retentionDays = 30) {
    const history = await this.loadHistory();
    const cutoffTime = Date.now() / 1000 - retentionDays * 24 * 60 * 60;
    let removedCount = 0;

    for (const connectionId in history) {
      const originalCount = history[connectionId].length;
      history[connectionId] = history[connectionId].filter(
        entry => (entry.timestamp || 0) > cutoffTime
      );
      removedCount += originalCount - history[connectionId].length;
    }

    await this.saveHistory(history);
    return removedCount;
  }

  async loadHistory() {
    try {
      await this.ensureStorageDir();
      const data = await fs.readFile(this.storagePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {};
      }
      console.error('Failed to load query history:', error);
      return {};
    }
  }

  async saveHistory(history) {
    try {
      await this.ensureStorageDir();
      await fs.writeFile(this.storagePath, JSON.stringify(history, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save query history:', error);
    }
  }
}

const queryHistory = new QueryHistory();

module.exports = { QueryHistory, queryHistory };
