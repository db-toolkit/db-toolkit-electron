# AI Integration Guide

## Overview
DB Toolkit integrates with Google Gemini AI to provide intelligent assistance across two main areas: Schema Explorer and Query Editor.

## Two AI Integration Points

### 1. Schema Explorer AI (LEFT SIDEBAR)
When user selects a table, AI panel shows:
- **Table Summary** - AI explains table purpose and structure
- **Index Suggestions** - Recommends missing indexes based on columns/types
- **Relationship Recommendations** - Suggests foreign key relationships
- **Data Quality Insights** - Proposes constraints and validations
- **Common Queries** - Generates typical queries for the selected table

### 2. Query Editor AI (MAIN EDITOR)
AI Assistant panel (right sidebar, collapsible):
- **Natural Language → SQL** - Convert plain English to SQL queries
- **Query Optimization** - Rewrite queries for better performance
- **Error Fixing** - Explain and fix syntax/logic errors
- **Query Explanation** - Plain English description of complex queries
- **Schema-Aware Auto-complete** - Intelligent suggestions based on current schema

## Setup

### API Key Configuration (Multiple Keys for Rate Limit Management)
1. Get multiple Google Gemini API keys from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add multiple keys to environment variables:
   ```bash
   GEMINI_API_KEY_1=your_first_api_key
   GEMINI_API_KEY_2=your_second_api_key
   GEMINI_API_KEY_3=your_third_api_key
   GEMINI_API_KEY_4=your_fourth_api_key
   GEMINI_API_KEY_5=your_fifth_api_key
   ```
3. The system will automatically rotate between keys to avoid rate limits
4. Restart the application

### Usage

#### Schema Explorer AI
1. Navigate to Schema Explorer (left sidebar)
2. Click on any table name
3. AI Insights panel appears showing table analysis
4. View suggestions for indexes, relationships, and common queries

#### Query Editor AI
1. Open Query Editor
2. Click "AI Assistant" button to toggle right sidebar panel
3. Type natural language query (e.g., "show users from last week")
4. Click "Generate Query" to convert to SQL
5. Use optimization suggestions and error fixing as needed

## API Integration

### Backend Implementation

#### Core AI Operations
```python
# operations/ai_assistant.py
import os
import google.generativeai as genai
from typing import List, Dict, Any
from db_toolkit.core.config import settings

class GeminiClient:
    def __init__(self):
        self.api_keys = self._load_api_keys()
        self.current_key_index = 0
        
    def _load_api_keys(self) -> List[str]:
        """Load all available Gemini API keys from environment."""
        keys = []
        for i in range(1, 6):  # Support up to 5 keys
            key = os.getenv(f'GEMINI_API_KEY_{i}')
            if key:
                keys.append(key)
        return keys
    
    def _get_next_key(self) -> str:
        """Rotate to next API key to distribute load."""
        if not self.api_keys:
            raise ValueError("No Gemini API keys configured")
        
        key = self.api_keys[self.current_key_index]
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        return key
    
    async def _make_request(self, prompt: str) -> str:
        """Make AI request with automatic key rotation."""
        for attempt in range(len(self.api_keys)):
            try:
                api_key = self._get_next_key()
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-pro')
                response = await model.generate_content_async(prompt)
                return response.text
            except Exception as e:
                if "quota" in str(e).lower() or "rate limit" in str(e).lower():
                    continue  # Try next key
                raise e
        raise Exception("All API keys have reached rate limits")
    
    async def generate_query(self, natural_language: str, schema_context: Dict) -> Dict[str, str]:
        """Convert natural language to SQL query."""
        prompt = f"""
        Convert this natural language request to SQL:
        Request: {natural_language}
        
        Available schema:
        {schema_context}
        
        Return SQL query and brief explanation.
        """
        response = await self._make_request(prompt)
        return {"sql": response, "explanation": "AI-generated query"}
    
    async def optimize_query(self, query: str, execution_plan: Dict) -> Dict[str, Any]:
        """Optimize SQL query and provide suggestions."""
        prompt = f"""
        Analyze and optimize this SQL query:
        Query: {query}
        Execution Plan: {execution_plan}
        
        Provide:
        1. Optimization suggestions
        2. Improved query (if possible)
        3. Performance implications
        """
        response = await self._make_request(prompt)
        return {"suggestions": [response], "optimized_query": query}
    
    async def explain_table(self, table_name: str, columns: List[Dict]) -> Dict[str, Any]:
        """Provide insights about a database table."""
        prompt = f"""
        Analyze this database table:
        Table: {table_name}
        Columns: {columns}
        
        Provide:
        1. Table purpose/summary
        2. Index suggestions
        3. Relationship recommendations
        4. Common queries for this table
        """
        response = await self._make_request(prompt)
        return {"summary": response, "suggestions": []}
    
    async def fix_error(self, query: str, error: str) -> Dict[str, str]:
        """Fix SQL query errors."""
        prompt = f"""
        Fix this SQL query error:
        Query: {query}
        Error: {error}
        
        Provide:
        1. Explanation of the error
        2. Corrected query
        """
        response = await self._make_request(prompt)
        return {"explanation": response, "fixed_query": query}

gemini_client = GeminiClient()
```

#### API Routes
```python
# core/routes/ai.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Any
from operations.ai_assistant import gemini_client

router = APIRouter(prefix="/api/ai", tags=["ai"])

class GenerateQueryRequest(BaseModel):
    natural_language: str
    schema_context: Dict

class OptimizeQueryRequest(BaseModel):
    query: str
    execution_plan: Dict

class ExplainTableRequest(BaseModel):
    table_name: str
    columns: List[Dict]

class FixErrorRequest(BaseModel):
    query: str
    error: str

@router.post("/generate-query")
async def generate_query(request: GenerateQueryRequest):
    try:
        result = await gemini_client.generate_query(
            request.natural_language, 
            request.schema_context
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize-query")
async def optimize_query(request: OptimizeQueryRequest):
    try:
        result = await gemini_client.optimize_query(
            request.query, 
            request.execution_plan
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/explain-table")
async def explain_table(request: ExplainTableRequest):
    try:
        result = await gemini_client.explain_table(
            request.table_name, 
            request.columns
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fix-error")
async def fix_error(request: FixErrorRequest):
    try:
        result = await gemini_client.fix_error(
            request.query, 
            request.error
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Frontend Implementation

#### AI Assistant Hook
```typescript
// hooks/useAiAssistant.js
import { useState } from 'react';
import { api } from '../lib/api';

export function useAiAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateQuery = async (naturalLanguage, schemaContext) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/ai/generate-query', {
        natural_language: naturalLanguage,
        schema_context: schemaContext
      });
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const optimizeQuery = async (query, executionPlan) => {
    setIsLoading(true);
    try {
      const response = await api.post('/ai/optimize-query', {
        query,
        execution_plan: executionPlan
      });
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const explainTable = async (tableName, columns) => {
    setIsLoading(true);
    try {
      const response = await api.post('/ai/explain-table', {
        table_name: tableName,
        columns
      });
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fixError = async (query, errorMessage) => {
    setIsLoading(true);
    try {
      const response = await api.post('/ai/fix-error', {
        query,
        error: errorMessage
      });
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateQuery,
    optimizeQuery,
    explainTable,
    fixError,
    isLoading,
    error
  };
}
```

#### AI Assistant Panel Component
```typescript
// components/ai/AiAssistantPanel.js
import React, { useState } from 'react';
import { useAiAssistant } from '../../hooks/useAiAssistant';

export function AiAssistantPanel({ isOpen, onClose, currentQuery, schema }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const { generateQuery, optimizeQuery, isLoading, error } = useAiAssistant();

  const handleGenerateQuery = async () => {
    if (!input.trim()) return;
    
    try {
      const response = await generateQuery(input, schema);
      setResult(response);
    } catch (err) {
      console.error('Failed to generate query:', err);
    }
  };

  const handleOptimizeQuery = async () => {
    if (!currentQuery) return;
    
    try {
      const response = await optimizeQuery(currentQuery, {});
      setResult(response);
    } catch (err) {
      console.error('Failed to optimize query:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-assistant-panel">
      <div className="panel-header">
        <h3>AI Assistant</h3>
        <button onClick={onClose}>×</button>
      </div>
      
      <div className="panel-content">
        <div className="query-generator">
          <label>💬 Ask AI:</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="show users from last week"
            disabled={isLoading}
          />
          <button onClick={handleGenerateQuery} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Query'}
          </button>
        </div>

        {currentQuery && (
          <div className="optimization-section">
            <h4>💡 Suggestions:</h4>
            <button onClick={handleOptimizeQuery} disabled={isLoading}>
              Optimize Current Query
            </button>
          </div>
        )}

        {result && (
          <div className="ai-result">
            <h4>Result:</h4>
            <pre>{result.sql || result.suggestions}</pre>
          </div>
        )}

        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### Table Insights Component
```typescript
// components/ai/TableInsights.js
import React, { useEffect, useState } from 'react';
import { useAiAssistant } from '../../hooks/useAiAssistant';

export function TableInsights({ tableName, columns, isVisible }) {
  const [insights, setInsights] = useState(null);
  const { explainTable, isLoading } = useAiAssistant();

  useEffect(() => {
    if (isVisible && tableName && columns) {
      loadInsights();
    }
  }, [tableName, columns, isVisible]);

  const loadInsights = async () => {
    try {
      const response = await explainTable(tableName, columns);
      setInsights(response);
    } catch (err) {
      console.error('Failed to load table insights:', err);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="table-insights">
      <div className="insights-header">
        <h4>📊 AI Insights</h4>
      </div>
      
      {isLoading ? (
        <div className="loading">Analyzing table...</div>
      ) : insights ? (
        <div className="insights-content">
          <div className="summary">
            <h5>Summary:</h5>
            <p>{insights.summary}</p>
          </div>
          
          {insights.suggestions?.length > 0 && (
            <div className="suggestions">
              <h5>💡 Suggestions:</h5>
              <ul>
                {insights.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="no-insights">Click on a table to see AI insights</div>
      )}
    </div>
  );
}
```

## Security

### API Key Protection
- Store API keys in environment variables only
- Never commit API keys to version control
- Use different keys for development and production
- Implement rate limiting to prevent API abuse

### Data Privacy
- Query data is sent to Google Gemini for analysis
- No sensitive data is stored by the AI service
- Users can disable AI features in settings

## Rate Limits & Key Rotation
- Google Gemini Free Tier: 15 requests per minute per API key
- **Key Rotation Strategy**: Use 5 API keys = 75 requests per minute total
- Automatic failover when a key hits rate limits
- **User Rate Limiting**: 10 requests per minute per user
- Client-side request queuing and throttling
- Show loading states during analysis
- Cache common queries to reduce API calls
- Track usage per key for optimal distribution

## Error Handling
- Graceful fallback when AI service is unavailable
- Clear error messages for API failures
- Retry logic with exponential backoff
- Offline mode support

## Configuration

### Settings
```typescript
interface AISettings {
  enabled: boolean;
  provider: 'gemini' | 'openai';
  maxTokens: number;
  temperature: number;
  requestTimeout: number;
  userRateLimit: number; // requests per minute per user
}
```

### Environment Variables
```bash
# Required - Multiple API keys for rotation
GEMINI_API_KEY_1=your_first_api_key
GEMINI_API_KEY_2=your_second_api_key
GEMINI_API_KEY_3=your_third_api_key
GEMINI_API_KEY_4=your_fourth_api_key
GEMINI_API_KEY_5=your_fifth_api_key

# Optional
AI_ENABLED=true
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.1
AI_REQUEST_TIMEOUT=30
```

## UI Layout Examples

### Query Editor Layout
```
┌─────────────────────────────────────────┐
│ Query Editor (Monaco)                   │
│                                         │
│ SELECT * FROM users                     │
│                                         │
├─────────────────────────────────────────┤
│ AI Assistant                      [×]   │
├─────────────────────────────────────────┤
│ 💬 Ask AI: "show users from last week" │
│ [Generate Query]                        │
│                                         │
│ 💡 Suggestions:                         │
│ • Add index on created_at              │
│ • Use WHERE instead of HAVING          │
└─────────────────────────────────────────┘
```

### Schema Explorer Layout
```
┌─────────────────┬───────────────────────┐
│ Tables          │ Table: users          │
│ ├─ users        │ ┌───────────────────┐ │
│ ├─ orders       │ │ AI Insights   [×] │ │
│ └─ products     │ ├───────────────────┤ │
│                 │ │ 📊 Summary:       │ │
│                 │ │ Stores user data  │ │
│                 │ │                   │ │
│                 │ │ 💡 Suggestions:   │ │
│                 │ │ • Add index on    │ │
│                 │ │   email           │ │
│                 │ │ • Consider adding │ │
│                 │ │   last_login      │ │
│                 │ └───────────────────┘ │
└─────────────────┴───────────────────────┘
```

## Implementation Priority

### Phase 1: Query Editor AI (Primary)
1. Natural language → SQL conversion
2. Error fixing and explanation
3. Query optimization suggestions
4. Right sidebar AI panel

### Phase 2: Schema Explorer AI (Secondary)
1. Table insights and summaries
2. Index recommendations
3. Relationship suggestions
4. Common query generation

## Technical Considerations

### Context Management
**Send to AI:**
- Current database schema (tables, columns, types)
- Current query (if any)
- Error messages (if any)
- Execution plan (if available)

**Never Send:**
- Actual data (privacy)
- Credentials or connection strings
- Sensitive information

### Privacy & Security
- Only send schema metadata, never actual data
- Add "AI-generated" badges on all AI responses
- Allow users to disable AI features
- Show disclaimer about data sent to external AI service

## Future Enhancements
- Support for multiple AI providers (OpenAI, Claude)
- Voice input for natural language queries
- Custom AI model training on user's schema patterns
- Automated performance monitoring with AI insights
- Query history analysis and pattern recognition