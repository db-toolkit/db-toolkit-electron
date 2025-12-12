/**
 * IPC handlers for AI operations.
 */

const { ipcMain } = require('electron');
const { getQueryAssistant } = require('../operations/ai/query-assistant');
const { getSchemaAnalyzer } = require('../operations/ai/schema-analyzer');
const { connectionManager } = require('../utils/connection-manager');

function registerAIHandlers() {
  const { logger } = require('../utils/logger');

  ipcMain.handle('ai:generate-sql', async (event, naturalLanguage, schemaContext, dbType) => {
    try {
      logger.info(`AI generate-sql called with: '${naturalLanguage}', dbType: ${dbType}`);
      const assistant = getQueryAssistant();
      if (!assistant) {
        return { success: false, error: 'AI not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env' };
      }

      return await assistant.generateFromNaturalLanguage(naturalLanguage, schemaContext, dbType);
    } catch (error) {
      logger.error('AI generate-sql error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:explain-query', async (event, args) => {
    try {
      const { query, connection_id, schema_context } = args;
      const connection = await connectionManager.getConnection(connection_id);
      const dbType = connection ? connection.db_type : 'postgres'; // Default to postgres if not found

      logger.info(`AI explain-query called with query: '${query}', dbType: ${dbType}`);
      const assistant = getQueryAssistant();
      if (!assistant) {
        return { success: false, error: 'AI not configured' };
      }

      return await assistant.explainQuery(query, dbType, schema_context);
    } catch (error) {
      logger.error('AI explain-query error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:optimize-query', async (event, args) => {
    try {
      const { query, execution_plan, connection_id, schema_context } = args;
      const connection = await connectionManager.getConnection(connection_id);
      const dbType = connection ? connection.db_type : 'postgres';

      logger.info(`AI optimize-query called with query: '${query}', dbType: ${dbType}`);
      const assistant = getQueryAssistant();
      if (!assistant) {
        return { success: false, error: 'AI not configured' };
      }

      return await assistant.optimizeQuery(query, execution_plan, dbType, schema_context);
    } catch (error) {
      logger.error('AI optimize-query error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:fix-query', async (event, args) => {
    try {
      const { query, error_message, connection_id, schema_context } = args;
      const connection = await connectionManager.getConnection(connection_id);
      const dbType = connection ? connection.db_type : 'postgres';

      logger.info(`AI fix-query called with query: '${query}', error: '${error_message}', dbType: ${dbType}`);
      const assistant = getQueryAssistant();
      if (!assistant) {
        return { success: false, error: 'AI not configured' };
      }

      return await assistant.fixQueryError(query, error_message, dbType, schema_context);
    } catch (error) {
      logger.error('AI fix-query error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:suggest-completion', async (event, partialQuery, cursorPosition, schemaContext, dbType) => {
    try {
      logger.info(`AI suggest-completion called with query: '${partialQuery}', position: ${cursorPosition}, dbType: ${dbType}`);
      const assistant = getQueryAssistant();
      if (!assistant) {
        return { success: false, error: 'AI not configured' };
      }

      return await assistant.suggestCompletion(partialQuery, cursorPosition, schemaContext, dbType);
    } catch (error) {
      logger.error('AI suggest-completion error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:analyze-table', async (event, arg1, arg2, arg3) => {
    try {
      let connectionId = null;
      let tableName = arg1;
      let columns = arg2 || [];
      let dbType = arg3;

      // Support object payload shape: { connection_id, table_name, columns, db_type }
      if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1)) {
        connectionId = arg1.connection_id || arg1.connectionId || null;
        tableName = arg1.table_name || arg1.tableName;
        columns = arg1.columns || [];
        dbType = arg1.db_type || arg1.dbType || arg3;
      }

      // Derive DB type from connection when available
      if (!dbType && connectionId) {
        const connection = await connectionManager.getConnection(connectionId);
        dbType = connection ? connection.db_type : dbType;
      }

      const resolvedDbType = dbType || 'postgres';

      logger.info(`AI analyze-table called with table: '${tableName}', dbType: ${resolvedDbType}`);
      const analyzer = getSchemaAnalyzer();
      if (!analyzer) {
        return { success: false, error: 'AI not configured' };
      }

      return await analyzer.analyzeTable(tableName, columns, resolvedDbType);
    } catch (error) {
      logger.error('AI analyze-table error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:suggest-indexes', async (event, tableName, columns, queryPatterns, dbType) => {
    try {
      logger.info(`AI suggest-indexes called with table: '${tableName}', dbType: ${dbType}`);
      const analyzer = getSchemaAnalyzer();
      if (!analyzer) {
        return { success: false, error: 'AI not configured' };
      }

      return await analyzer.suggestIndexes(tableName, columns, queryPatterns, dbType);
    } catch (error) {
      logger.error('AI suggest-indexes error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:analyze-relationships', async (event, tables, dbType) => {
    try {
      logger.info(`AI analyze-relationships called with ${tables ? Object.keys(tables).length : 0} tables, dbType: ${dbType}`);
      const analyzer = getSchemaAnalyzer();
      if (!analyzer) {
        return { success: false, error: 'AI not configured' };
      }

      return await analyzer.analyzeRelationships(tables, dbType);
    } catch (error) {
      logger.error('AI analyze-relationships error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:generate-common-queries', async (event, tableName, columns, dbType) => {
    try {
      logger.info(`AI generate-common-queries called with table: '${tableName}', dbType: ${dbType}`);
      const analyzer = getSchemaAnalyzer();
      if (!analyzer) {
        return { success: false, error: 'AI not configured' };
      }

      return await analyzer.generateCommonQueries(tableName, columns, dbType);
    } catch (error) {
      logger.error('AI generate-common-queries error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:generate-query', async (event, args) => {
    try {
      const { natural_language, connection_id, schema_context } = args;
      const prompt = natural_language;

      const connection = await connectionManager.getConnection(connection_id);
      const dbType = connection ? connection.db_type : 'postgres';

      logger.info(`AI generate-query called with prompt: '${prompt}', dbType: ${dbType}`);
      logger.info(`Schema context type: ${typeof schema_context}, keys: ${schema_context ? Object.keys(schema_context) : 'null'}`);

      const assistant = getQueryAssistant();
      if (!assistant) {
        return { success: false, error: 'AI not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env' };
      }

      if (!prompt || prompt.trim() === '') {
        return { success: false, error: 'Please provide a query description' };
      }

      return await assistant.generateFromNaturalLanguage(prompt, schema_context, dbType);
    } catch (error) {
      logger.error('AI generate-query error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerAIHandlers };
