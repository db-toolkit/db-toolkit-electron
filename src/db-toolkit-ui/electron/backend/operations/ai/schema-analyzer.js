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
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;
      
      if (!accountId || !apiToken) {
        return null;
      }
      
      _schemaAnalyzer = new SchemaAnalyzer(accountId, apiToken);
    } catch (error) {
      return null;
    }
  }
  return _schemaAnalyzer;
}

module.exports = { SchemaAnalyzer, getSchemaAnalyzer };
