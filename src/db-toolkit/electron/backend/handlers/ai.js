/**
 * IPC handlers for AI operations.
 */

const { ipcMain } = require('electron');
const { getQueryAssistant } = require('../operations/ai/query-assistant');
const { getSchemaAnalyzer } = require('../operations/ai/schema-analyzer');

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

  ipcMain.handle('ai:explain-query', async (event, query, dbType, schemaContext) => {
    try {
      logger.info(`AI explain-query called with query: '${query}', dbType: ${dbType}`);
      const assistant = getQueryAssistant();
      if (!assistant) {
        return { success: false, error: 'AI not configured' };
      }
      
      return await assistant.explainQuery(query, dbType, schemaContext);
    } catch (error) {
      logger.error('AI explain-query error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:optimize-query', async (event, query, executionPlan, dbType, schemaContext) => {
    try {
      logger.info(`AI optimize-query called with query: '${query}', dbType: ${dbType}`);
      const assistant = getQueryAssistant();
      if (!assistant) {
        return { success: false, error: 'AI not configured' };
      }
      
      return await assistant.optimizeQuery(query, executionPlan, dbType, schemaContext);
    } catch (error) {
      logger.error('AI optimize-query error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:fix-query', async (event, query, errorMessage, dbType, schemaContext) => {
    try {
      logger.info(`AI fix-query called with query: '${query}', error: '${errorMessage}', dbType: ${dbType}`);
      const assistant = getQueryAssistant();
      if (!assistant) {
        return { success: false, error: 'AI not configured' };
      }
      
      return await assistant.fixQueryError(query, errorMessage, dbType, schemaContext);
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

  ipcMain.handle('ai:analyze-table', async (event, tableName, columns, dbType) => {
    try {
      logger.info(`AI analyze-table called with table: '${tableName}', dbType: ${dbType}`);
      const analyzer = getSchemaAnalyzer();
      if (!analyzer) {
        return { success: false, error: 'AI not configured' };
      }
      
      return await analyzer.analyzeTable(tableName, columns, dbType);
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

  ipcMain.handle('ai:generate-query', async (event, prompt, schemaContext, dbType) => {
    try {
      logger.info(`AI generate-query called with prompt: '${prompt}', dbType: ${dbType}`);
      logger.info(`Schema context type: ${typeof schemaContext}, keys: ${schemaContext ? Object.keys(schemaContext) : 'null'}`);
      
      const assistant = getQueryAssistant();
      if (!assistant) {
        return { success: false, error: 'AI not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env' };
      }
      
      if (!prompt || prompt.trim() === '') {
        return { success: false, error: 'Please provide a query description' };
      }
      
      return await assistant.generateFromNaturalLanguage(prompt, schemaContext, dbType);
    } catch (error) {
      logger.error('AI generate-query error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerAIHandlers };
