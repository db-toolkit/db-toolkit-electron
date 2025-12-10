/**
 * Data explorer operations.
 */

const { connectionManager } = require('../utils/connection-manager');
const { logger } = require('../utils/logger.js');

class DataExplorer {
  async browseData(connection, schemaName, tableName, limit = 100, offset = 0, sortColumn = null, sortOrder = 'ASC', filters = null) {
    let connector = await connectionManager.getConnector(connection.id);
    if (!connector) {
      const success = await connectionManager.connect(connection);
      if (!success) {
        return { success: false, error: 'Failed to establish database connection' };
      }
      connector = await connectionManager.getConnector(connection.id);
      if (!connector) {
        return { success: false, error: 'Connection manager failed to provide connector' };
      }
    }

    try {
      const dbType = connection.db_type;
      let query;
      
      if (dbType === 'sqlite') {
        query = `SELECT * FROM "${tableName}"`;
      } else {
        query = `SELECT * FROM "${schemaName}"."${tableName}"`;
      }

      if (filters && Object.keys(filters).length > 0) {
        const conditions = [];
        for (const [column, value] of Object.entries(filters)) {
          if (value) {
            if (dbType === 'sqlite') {
              conditions.push(`"${column}" LIKE '%${value}%'`);
            } else {
              conditions.push(`"${column}" ILIKE '%${value}%'`);
            }
          }
        }
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      if (sortColumn) {
        query += ` ORDER BY "${sortColumn}" ${sortOrder}`;
      }

      query += ` LIMIT ${limit} OFFSET ${offset}`;

      const result = await connector.executeQuery(query);
      const rows = result.data || [];
      const columns = result.columns || [];

      const truncatedRows = rows.map(row =>
        row.map(val => {
          if ((typeof val === 'string' || Buffer.isBuffer(val)) && String(val).length > 100) {
            return String(val).substring(0, 100) + '...';
          }
          return val;
        })
      );

      return {
        success: true,
        rows: truncatedRows,
        columns,
        limit,
        offset,
      };
    } catch (error) {
      logger.error(`Failed to browse data for '${connection.name}.${schemaName}.${tableName}':`, error);
      return { success: false, error: error.message };
    }
  }

  async getRowCount(connection, schemaName, tableName) {
    const connector = await connectionManager.getConnector(connection.id);
    if (!connector) {
      return 0;
    }

    try {
      const dbType = connection.db_type;
      let query;
      
      if (dbType === 'sqlite') {
        query = `SELECT COUNT(*) FROM "${tableName}"`;
      } else {
        query = `SELECT COUNT(*) FROM "${schemaName}"."${tableName}"`;
      }
      
      const result = await connector.executeQuery(query);

      if (result.success && result.data && result.data.length > 0) {
        return result.data[0][0];
      }
      return 0;
    } catch (error) {
      logger.error(`Failed to get row count for '${connection.name}.${schemaName}.${tableName}':`, error);
      return 0;
    }
  }

  async getTableRelationships(connection, schemaName, tableName) {
    const connector = await connectionManager.getConnector(connection.id);
    if (!connector) {
      return { success: false, error: 'Not connected' };
    }

    try {
      const query = `
        SELECT
          kcu.column_name,
          ccu.table_schema AS foreign_schema,
          ccu.table_name AS foreign_table,
          ccu.column_name AS foreign_column
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = '${schemaName}'
          AND tc.table_name = '${tableName}'
      `;
      const result = await connector.executeQuery(query);
      return { success: true, relationships: result.data || [] };
    } catch (error) {
      logger.error(`Failed to get table relationships for '${connection.name}.${schemaName}.${tableName}':`, error);
      return { success: false, error: error.message };
    }
  }

  async getCellData(connection, schemaName, tableName, columnName, rowIdentifier) {
    const connector = await connectionManager.getConnector(connection.id);
    if (!connector) {
      return { success: false, error: 'Not connected' };
    }

    try {
      const dbType = connection.db_type;
      const conditions = Object.entries(rowIdentifier).map(([k, v]) => `"${k}" = '${v}'`);
      const whereClause = conditions.join(' AND ');
      
      let query;
      if (dbType === 'sqlite') {
        query = `SELECT "${columnName}" FROM "${tableName}" WHERE ${whereClause} LIMIT 1`;
      } else {
        query = `SELECT "${columnName}" FROM "${schemaName}"."${tableName}" WHERE ${whereClause} LIMIT 1`;
      }

      const result = await connector.executeQuery(query);
      if (result.success && result.data && result.data.length > 0) {
        return { success: true, data: result.data[0][0] };
      }
      return { success: false, error: 'No data found' };
    } catch (error) {
      logger.error(`Failed to get cell data for '${connection.name}.${schemaName}.${tableName}.${columnName}':`, error);
      return { success: false, error: error.message };
    }
  }
}

const dataExplorer = new DataExplorer();

module.exports = { DataExplorer, dataExplorer };
