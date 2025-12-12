/**
 * Schema Analyzer for DBAssist AI functionality.
 */

const { CloudflareAIClient } = require('./cloudflare-client');
const { SCHEMA_ANALYSIS_PROMPT, SYSTEM_PROMPT } = require('./prompts');

class SchemaAnalyzer {
  constructor(accountId, apiToken, model = '@cf/meta/llama-3.1-70b-instruct', temperature = 0.7, maxTokens = 2048) {
    if (!accountId || !apiToken) {
      throw new Error('Cloudflare credentials not configured');
    }

    this.client = new CloudflareAIClient(accountId, apiToken);
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
  }

  async analyzeTable(tableName, columns, dbType = 'postgresql') {
    try {
      let schemaInfo = `Table: ${tableName}\n`;
      schemaInfo += 'Columns:\n';
      for (const col of columns) {
        schemaInfo += `  - ${col.name} (${col.type || 'unknown'})\n`;
      }

      const prompt = SCHEMA_ANALYSIS_PROMPT
        .replace('{db_type}', dbType)
        .replace('{schema_info}', schemaInfo);

      const response = await this.client.generate(
        prompt,
        this.model,
        this.maxTokens,
        this.temperature,
        SYSTEM_PROMPT
      );

      return {
        success: true,
        table_name: tableName,
        summary: response,
        purpose: 'Data storage and retrieval',
        suggestions: [],
        common_queries: [],
        index_recommendations: [],
        relationship_suggestions: []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        table_name: tableName,
        summary: '',
        suggestions: []
      };
    }
  }

  async suggestIndexes(tableName, columns, queryPatterns = null, dbType = 'postgresql') {
    try {
      const suggestions = [];

      for (const column of columns) {
        const colName = column.name || '';
        const colType = (column.type || '').toLowerCase();

        if (colName.toLowerCase().includes('id') && colName !== 'id') {
          suggestions.push({
            type: 'btree',
            columns: [colName],
            reason: `Foreign key column ${colName} would benefit from an index`
          });
        } else if (colType.includes('timestamp') || colType.includes('date') || colType.includes('datetime')) {
          suggestions.push({
            type: 'btree',
            columns: [colName],
            reason: `Date/time column ${colName} commonly used in WHERE clauses`
          });
        } else if (colName.toLowerCase().includes('email')) {
          suggestions.push({
            type: 'btree',
            columns: [colName],
            reason: `Email column ${colName} likely used for lookups`
          });
        }
      }

      return {
        success: true,
        table_name: tableName,
        index_suggestions: suggestions,
        performance_impact: 'medium'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        index_suggestions: []
      };
    }
  }

  async analyzeRelationships(tables, dbType = 'postgresql') {
    try {
      const relationships = [];
      const tableNames = Object.keys(tables);

      for (const [tableName, columns] of Object.entries(tables)) {
        for (const column of columns) {
          const colName = (column.name || '').toLowerCase();

          if (colName.endsWith('_id') && colName !== 'id') {
            const referencedTable = colName.slice(0, -3);

            for (const otherTable of tableNames) {
              if (otherTable.toLowerCase() === referencedTable ||
                otherTable.toLowerCase() === referencedTable + 's') {
                relationships.push({
                  from_table: tableName,
                  from_column: column.name,
                  to_table: otherTable,
                  to_column: 'id',
                  relationship_type: 'many_to_one',
                  confidence: 'medium'
                });
              }
            }
          }
        }
      }

      return {
        success: true,
        relationships,
        total_suggestions: relationships.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        relationships: []
      };
    }
  }

  async analyzeSchema(schemaName, tables, dbType = 'postgresql') {
    try {
      const tableNames = Object.keys(tables);
      const tableCount = tableNames.length;

      if (tableCount === 0) {
        return {
          success: false,
          error: 'No tables found in schema',
          summary: '',
          design_patterns: [],
          relationships: [],
          optimization_suggestions: []
        };
      }

      // Analyze relationships across all tables
      const relationshipAnalysis = await this.analyzeRelationships(tables, dbType);
      const relationships = relationshipAnalysis.relationships || [];

      // Generate summary
      const summary = `Schema "${schemaName}" contains ${tableCount} table${tableCount !== 1 ? 's' : ''}. ` +
        `Detected ${relationships.length} relationship${relationships.length !== 1 ? 's' : ''} between tables.`;

      // Identify design patterns
      const design_patterns = [];

      // Check for common patterns
      const hasUserTable = tableNames.some(t => t.toLowerCase().includes('user'));
      const hasAuditFields = Object.values(tables).some(cols =>
        cols.some(c => ['created_at', 'updated_at', 'deleted_at'].includes(c.name?.toLowerCase()))
      );
      const hasJunctionTables = tableNames.some(t => t.includes('_'));

      if (hasUserTable) {
        design_patterns.push('User management pattern detected');
      }
      if (hasAuditFields) {
        design_patterns.push('Audit trail pattern with timestamp tracking');
      }
      if (hasJunctionTables) {
        design_patterns.push('Many-to-many relationships using junction tables');
      }
      if (relationships.length > tableCount) {
        design_patterns.push('Highly normalized schema with multiple relationships');
      }

      // Format relationships for display
      const formattedRelationships = relationships.map(rel =>
        `${rel.from_table}.${rel.from_column} → ${rel.to_table}.${rel.to_column}`
      );

      // Generate optimization suggestions
      const optimization_suggestions = [];

      // Check for missing indexes on foreign keys
      const foreignKeyColumns = relationships.map(r => ({
        table: r.from_table,
        column: r.from_column
      }));

      if (foreignKeyColumns.length > 0) {
        optimization_suggestions.push(
          `Consider adding indexes on foreign key columns for better join performance`
        );
      }

      // Check for tables without primary keys
      const tablesWithoutPK = Object.entries(tables).filter(([name, cols]) =>
        !cols.some(c => c.primary_key || c.name === 'id')
      );

      if (tablesWithoutPK.length > 0) {
        optimization_suggestions.push(
          `${tablesWithoutPK.length} table(s) may be missing primary keys: ${tablesWithoutPK.map(([name]) => name).join(', ')}`
        );
      }

      // Check for large tables without partitioning
      if (tableCount > 20) {
        optimization_suggestions.push(
          'Large schema detected - consider table partitioning for frequently accessed tables'
        );
      }

      return {
        success: true,
        schema_name: schemaName,
        summary,
        design_patterns,
        relationships: formattedRelationships.slice(0, 10), // Limit to 10 for display
        optimization_suggestions,
        table_count: tableCount,
        relationship_count: relationships.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        summary: '',
        design_patterns: [],
        relationships: [],
        optimization_suggestions: []
      };
    }
  }

  async generateCommonQueries(tableName, columns, dbType = 'postgresql') {
    try {
      const queries = [];

      queries.push({
        name: 'Select All Records',
        query: `SELECT * FROM ${tableName} LIMIT 10;`,
        description: 'Retrieve first 10 records from the table'
      });

      queries.push({
        name: 'Count Records',
        query: `SELECT COUNT(*) FROM ${tableName};`,
        description: 'Count total number of records'
      });

      for (const column of columns) {
        const colName = column.name || '';
        const colType = (column.type || '').toLowerCase();

        if (colType.includes('timestamp') || colType.includes('date')) {
          queries.push({
            name: `Recent Records by ${colName}`,
            query: `SELECT * FROM ${tableName} WHERE ${colName} >= NOW() - INTERVAL '7 days' ORDER BY ${colName} DESC;`,
            description: `Find records from the last 7 days based on ${colName}`
          });
        } else if (colName.toLowerCase().includes('email')) {
          queries.push({
            name: `Find by ${colName}`,
            query: `SELECT * FROM ${tableName} WHERE ${colName} = 'example@email.com';`,
            description: `Find records by ${colName}`
          });
        }
      }

      return {
        success: true,
        table_name: tableName,
        queries: queries.slice(0, 5),
        total_generated: queries.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        queries: []
      };
    }
  }
}

let _schemaAnalyzer = null;

function getSchemaAnalyzer() {
  if (_schemaAnalyzer === null) {
    try {
      const { logger } = require('../../utils/logger');
      const { app } = require('electron');
      const path = require('path');

      // Load .env from correct location
      try {
        const dotenv = require('dotenv');
        const envPath = app.isPackaged
          ? path.join(process.resourcesPath, '.env')
          : path.join(__dirname, '../../../../../../.env');

        dotenv.config({ path: envPath });
        logger.info(`[Schema Analyzer] Loading .env from: ${envPath}`);
      } catch (envError) {
        logger.warn('[Schema Analyzer] Failed to load .env, using process env:', envError.message);
      }

      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;

      logger.info(`[Schema Analyzer] AI Config check - AccountID: ${accountId ? 'present' : 'missing'}, Token: ${apiToken ? 'present' : 'missing'}`);

      if (!accountId || !apiToken) {
        logger.warn('[Schema Analyzer] Cloudflare AI credentials not configured');
        return null;
      }

      _schemaAnalyzer = new SchemaAnalyzer(accountId, apiToken);
      logger.info('[Schema Analyzer] Schema analyzer initialized successfully');
    } catch (error) {
      const { logger } = require('../../utils/logger');
      logger.error('[Schema Analyzer] Failed to initialize schema analyzer:', error);
      return null;
    }
  }
  return _schemaAnalyzer;
}

module.exports = { SchemaAnalyzer, getSchemaAnalyzer };
```
