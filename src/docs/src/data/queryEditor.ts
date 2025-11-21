export const queryEditorData = {
  title: "Query Editor",
  sections: [
    {
      heading: "Features",
      content: `- **Syntax Highlighting** - SQL syntax highlighting
- **Auto-Complete** - Press Ctrl+Space for suggestions
- **Multiple Tabs** - Work on multiple queries
- **Query History** - Track previous queries
- **Format SQL** - Press Ctrl/Cmd+Shift+F`
    },
    {
      heading: "Query Execution",
      content: `Press **Ctrl/Cmd + Enter** or click **"Run"**

Results show:
- Column headers
- Row data
- Execution time
- Row count`
    },
    {
      heading: "DBAssist - AI Assistant",
      content: `AI-powered query assistance with Google Gemini:

**Features:**
- **Generate SQL** - Describe what you want in natural language
- **Optimize Queries** - Get performance improvement suggestions
- **Explain Queries** - Understand what your SQL does
- **Fix Errors** - Automatically fix query errors
- **Per-Tab Chat** - Each query tab has its own AI conversation (10 message limit)

**How to Use:**
1. Click **"AI Assistant"** button in Query Editor
2. Choose a tab:
   - **Chat** - View conversation history for this query tab
   - **Generate** - Describe query in plain English
   - **Optimize** - Analyze and improve current query
   - **Explain** - Get detailed explanation of query
3. AI responses are saved per tab and persist across sessions

**Example Prompts:**
- "Show all users created in the last 30 days"
- "Find top 10 customers by total sales"
- "List products with stock below 10 units"
`
    },
    {
      heading: "Keyboard Shortcuts",
      content: `- **Ctrl/Cmd + Enter** - Execute query
- **Ctrl/Cmd + Shift + F** - Format SQL
- **Ctrl/Cmd + /** - Toggle comment
- **Ctrl + Space** - Auto-complete
- **Ctrl/Cmd + Z** - Undo
- **Ctrl/Cmd + F** - Find`
    }
  ]
};
