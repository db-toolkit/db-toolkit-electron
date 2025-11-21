export const schemaExplorerData = {
  title: "Schema Explorer",
  sections: [
    {
      heading: "Overview",
      content: `Visual tree browser to navigate databases, schemas, tables, columns, and relationships in the left sidebar.`
    },
    {
      heading: "Tree Structure",
      content: `📁 Database
  📁 Schemas
    📁 Tables
      📄 Columns
      🔑 Indexes
      🔗 Constraints`
    },
    {
      heading: "Table Details",
      content: `Click a table to view:

**Columns**
- Column name
- Data type
- Nullable (YES/NO)
- Default value
- Primary key indicator

**Indexes**
- Index name
- Columns included
- Index type

**Constraints**
- Primary keys
- Foreign keys
- Unique constraints`
    },
    {
      heading: "Context Menu",
      content: `Right-click a table for:
- **Browse Data** - View table contents
- **Copy Table Name** - Copy to clipboard
- **Refresh** - Reload metadata
- **Export Schema** - Export structure`
    },
    {
      heading: "Search & Filter",
      content: `Use search box to find tables, schemas, and columns quickly. Search is debounced (300ms) for performance.`
    },
    {
      heading: "AI-Powered Analysis",
      content: `**Schema-Level Analysis**
- Click **"Analyze with AI"** button in header
- View full schema insights in sidebar panel
- See design patterns, relationships, and optimization suggestions
- Results cached for 24 hours in IndexedDB

**Table-Level Analysis**
- Click **"Analyze with AI"** button on any table
- Get table-specific insights inline
- View index suggestions, common queries, and potential issues
- Each table analysis cached separately

**Features:**
- Automatic caching (24-hour expiration)
- Refresh button to force re-analysis
- Powered by Google Gemini AI`
    }
  ]
};
