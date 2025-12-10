/**
 * Query Assistant for DBAssist AI functionality.
 */

const { CloudflareAIClient } = require('./cloudflare-client');
const {
  NL_TO_SQL_PROMPT,
  QUERY_EXPLANATION_PROMPT,
  QUERY_OPTIMIZATION_PROMPT,
  QUERY_ERROR_FIX_PROMPT,
  SYSTEM_PROMPT
} = require('./prompts');

class QueryAssistant {
  constructor(accountId, apiToken, model = '@cf/meta/llama-3.1-70b-instruct', temperature = 0.7, maxTokens = 2048) {
    if (!accountId || !apiToken) {
      throw new Error('Cloudflare credentials not configured');
    }
    
    this.client = new CloudflareAIClient(accountId, apiToken);
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
  }

  async generateFromNaturalLanguage(naturalLanguage, schemaContext, dbType = 'postgresql') {
    try {
      const schemaStr = this._formatSchema(schemaContext);
      
      const prompt = NL_TO_SQL_PROMPT
        .replace('{db_type}', dbType)
        .replace('{schema_context}', schemaStr)
        .replace('{user_request}', naturalLanguage);
      
      const response = await this.client.generate(
        prompt,
        this.model,
        this.maxTokens,
        this.temperature,
        SYSTEM_PROMPT
      );
      
      const sql = this._extractSQL(response);
      
      return {
        success: true,
        sql,
        explanation: 'Query generated from natural language',
        confidence: 'high'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        sql: '',
        explanation: ''
      };
    }
  }

  async optimizeQuery(query, executionPlan = null, dbType = 'postgresql', schemaContext = null) {
    try {
      const schemaStr = schemaContext ? this._formatSchema(schemaContext) : 'N/A';
      const planStr = executionPlan ? JSON.stringify(executionPlan) : 'N/A';
      
      const prompt = QUERY_OPTIMIZATION_PROMPT
        .replace('{db_type}', dbType)
        .replace('{schema_context}', schemaStr)
        .replace('{query}', query)
        .replace('{execution_plan}', planStr);
      
      const response = await this.client.generate(
        prompt,
        this.model,
        this.maxTokens,
        this.temperature,
        SYSTEM_PROMPT
      );
      
      return {
        success: true,
        suggestions: [response],
        optimized_query: this._extractSQL(response),
        performance_assessment: 'Analyzed',
        improvements: []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestions: []
      };
    }
  }

  async explainQuery(query, dbType = 'postgresql', schemaContext = null) {
    try {
      const schemaStr = schemaContext ? this._formatSchema(schemaContext) : 'N/A';
      
      const prompt = QUERY_EXPLANATION_PROMPT
        .replace('{db_type}', dbType)
        .replace('{schema_context}', schemaStr)
        .replace('{query}', query);
      
      const response = await this.client.generate(
        prompt,
        this.model,
        this.maxTokens,
        this.temperature,
        SYSTEM_PROMPT
      );
      
      return {
        success: true,
        explanation: response,
        complexity: 'medium'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        explanation: ''
      };
    }
  }

  async fixQueryError(query, errorMessage, dbType = 'postgresql', schemaContext = null) {
    try {
      const schemaStr = schemaContext ? this._formatSchema(schemaContext) : 'N/A';
      
      const prompt = QUERY_ERROR_FIX_PROMPT
        .replace('{db_type}', dbType)
        .replace('{schema_context}', schemaStr)
        .replace('{query}', query)
        .replace('{error_message}', errorMessage);
      
      const response = await this.client.generate(
        prompt,
        this.model,
        this.maxTokens,
        this.temperature,
        SYSTEM_PROMPT
      );
      
      return {
        success: true,
        explanation: response,
        fixed_query: this._extractSQL(response),
        error_type: 'syntax'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        explanation: '',
        fixed_query: ''
      };
    }
  }

  async suggestCompletion(partialQuery, cursorPosition, schemaContext, dbType = 'postgresql') {
    try {
      return {
        success: true,
        suggestions: [
          { text: 'SELECT * FROM ', type: 'keyword' },
          { text: 'WHERE ', type: 'keyword' },
          { text: 'ORDER BY ', type: 'keyword' }
        ],
        context: 'basic'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestions: []
      };
    }
  }

  _formatSchema(schemaContext) {
    if (!schemaContext) {
      return 'No schema available';
    }
    
    const formatted = [];
    const maxTables = 20;
    
    const entries = Object.entries(schemaContext);
    for (let idx = 0; idx < entries.length; idx++) {
      if (idx >= maxTables) {
        formatted.push(`... and ${entries.length - maxTables} more tables`);
        break;
      }
      
      const [tableName, tableInfo] = entries[idx];
      
      if (tableInfo && tableInfo.columns) {
        const cols = tableInfo.columns.slice(0, 10);
        const colStr = cols.map(c => `${c.name} (${c.type || 'unknown'})`).join(', ');
        const extra = tableInfo.columns.length > 10 ? ` ... +${tableInfo.columns.length - 10} more` : '';
        formatted.push(`${tableName}: ${colStr}${extra}`);
      }
    }
    
    return formatted.length > 0 ? formatted.join('\n') : String(schemaContext);
  }

  _extractSQL(response) {
    if (response.includes('```sql')) {
      const start = response.indexOf('```sql') + 6;
      const end = response.indexOf('```', start);
      return response.slice(start, end).trim();
    } else if (response.includes('```')) {
      const start = response.indexOf('```') + 3;
      const end = response.indexOf('```', start);
      return response.slice(start, end).trim();
    }
    
    const lines = response.split('\n');
    const sqlLines = [];
    let inSQL = false;
    
    for (const line of lines) {
      const lineUpper = line.trim().toUpperCase();
      if (lineUpper.startsWith('SELECT') || lineUpper.startsWith('INSERT') || 
          lineUpper.startsWith('UPDATE') || lineUpper.startsWith('DELETE') || 
          lineUpper.startsWith('WITH') || lineUpper.startsWith('CREATE') || 
          lineUpper.startsWith('ALTER') || lineUpper.startsWith('DROP')) {
        inSQL = true;
      }
      if (inSQL) {
        sqlLines.push(line);
        if (line.trim().endsWith(';')) {
          break;
        }
      }
    }
    
    return sqlLines.length > 0 ? sqlLines.join('\n').trim() : response.trim();
  }
}

let _queryAssistant = null;

function getQueryAssistant() {
  if (_queryAssistant === null) {
    try {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;
      
      if (!accountId || !apiToken) {
        return null;
      }
      
      _queryAssistant = new QueryAssistant(accountId, apiToken);
    } catch (error) {
      return null;
    }
  }
  return _queryAssistant;
}

module.exports = { QueryAssistant, getQueryAssistant };
