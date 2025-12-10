/**
 * SQLite database connector.
 */

const Database = require('better-sqlite3');
const BaseConnector = require('./base');
const { logger } = require('../utils/logger');

class SQLiteConnector extends BaseConnector {
  async connect(config) {
    try {
      this.connection = new Database(config.database);
      this.isConnected = true;
      logger.info('SQLite connection established');
      return true;
    } catch (error) {
      this.isConnected = false;
      logger.error(`SQLite connection failed: ${error.message}`);
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        this.connection.close();
        logger.info('SQLite connection closed');
      }
      this.isConnected = false;
      return true;
    } catch (error) {
      logger.error(`Error closing SQLite connection: ${error.message}`);
      return false;
    }
  }

  async testConnection(config) {
    try {
      const db = new Database(config.database);
      db.prepare('SELECT 1').get();
      db.close();
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getSchemas() {
    return ['main'];
  }

  async getTables(schema = null) {
    const query = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
    const rows = this.connection.prepare(query).all();
    return rows.map(row => row.name);
  }

  async getColumns(table, schema = null) {
    const query = `PRAGMA table_info("${table}")`;
    const rows = this.connection.prepare(query).all();
    return rows.map(row => ({
      column_name: row.name,
      data_type: row.type,
      is_nullable: row.notnull === 0 ? 'YES' : 'NO',
      column_default: row.dflt_value,
    }));
  }

  async executeQuery(query) {
    try {
      const stmt = this.connection.prepare(query);
      const isSelect = query.trim().toUpperCase().startsWith('SELECT');
      
      if (isSelect) {
        const rows = stmt.all();
        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          const data = rows.map(row => Object.values(row));
          return {
            success: true,
            columns,
            data,
            row_count: rows.length,
          };
        }
        return { success: true, columns: [], data: [], row_count: 0 };
      } else {
        const info = stmt.run();
        return {
          success: true,
          columns: [],
          data: [],
          row_count: info.changes,
        };
      }
    } catch (error) {
      logger.error(`SQLite query error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

module.exports = SQLiteConnector;
