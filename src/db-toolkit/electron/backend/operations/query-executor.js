/**
 * Query execution engine.
 */

const { connectionManager } = require('../utils/connection-manager');
const { QUERY_DEFAULTS } = require('../utils/constants');
const { logger } = require('../utils/logger.js');

class QueryExecutor {
  constructor(defaultTimeout = QUERY_DEFAULTS.TIMEOUT, defaultLimit = QUERY_DEFAULTS.LIMIT) {
    this.defaultTimeout = defaultTimeout;
    this.defaultLimit = defaultLimit;
  }

  async executeQuery(connection, query, limit = null, offset = 0, timeout = null) {
    if (!query || !query.trim()) {
      return {
        success: false,
        error: 'Query cannot be empty',
        columns: [],
        rows: [],
        total_rows: 0,
        execution_time: 0.0,
      };
    }

    query = query.trim();
    limit = limit || this.defaultLimit;
    timeout = timeout || this.defaultTimeout;

    const validation = this.validateQuery(query, connection.db_type);
    if (!validation.safe) {
      return {
        success: false,
        error: validation.error,
        columns: [],
        rows: [],
        total_rows: 0,
        execution_time: 0.0,
      };
    }

    const startTime = Date.now();

    try {
      let connector = await connectionManager.getConnector(connection.id);
      if (!connector) {
        const success = await connectionManager.connect(connection, timeout);
        if (!success) {
          throw new Error('Failed to establish database connection');
        }
        connector = await connectionManager.getConnector(connection.id);
        if (!connector) {
          throw new Error('Connection manager failed to provide connector');
        }
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeout * 1000)
      );

      const result = await Promise.race([
        connector.executeQuery(query),
        timeoutPromise,
      ]);

      const executionTime = (Date.now() - startTime) / 1000;

      if (result.success) {
        return {
          success: true,
          columns: result.columns || [],
          rows: result.data || [],
          total_rows: result.row_count || 0,
          execution_time: Math.round(executionTime * 1000) / 1000,
          has_more: (result.row_count || 0) >= limit,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Unknown error',
          columns: [],
          rows: [],
          total_rows: 0,
          execution_time: Math.round(executionTime * 1000) / 1000,
        };
      }
    } catch (error) {
      const executionTime = (Date.now() - startTime) / 1000;
      logger.error(`Query execution failed on '${connection.name}':`, error);
      return {
        success: false,
        error: error.message,
        columns: [],
        rows: [],
        total_rows: 0,
        execution_time: Math.round(executionTime * 1000) / 1000,
      };
    }
  }

  validateQuery(query, dbType) {
    const queryUpper = query.toUpperCase().trim();

    const dangerousKeywords = [
      'DROP DATABASE',
      'DROP SCHEMA',
      'TRUNCATE',
      queryUpper.includes('WHERE') ? null : 'DELETE FROM',
      queryUpper.includes('WHERE') ? null : 'UPDATE',
    ].filter(Boolean);

    for (const keyword of dangerousKeywords) {
      if (queryUpper.includes(keyword)) {
        return {
          safe: false,
          error: `Dangerous operation detected: ${keyword}. Use with caution.`,
        };
      }
    }

    if (dbType === 'mongodb') {
      if (!query.startsWith('{') && !query.startsWith('db.')) {
        return {
          safe: false,
          error: 'MongoDB query must be valid JSON or db.collection syntax',
        };
      }
    }

    return { safe: true };
  }


}

const queryExecutor = new QueryExecutor();

module.exports = { QueryExecutor, queryExecutor };
