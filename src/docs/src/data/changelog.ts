export const changelogVersions = [
  {
    version: "0.5.1",
    date: "2025-01-23",
    sections: [
      {
        heading: "Added",
        content: `- Schema Explorer AI with schema-level and table-level analysis
- Per-tab AI chat history in Query Editor (10 message limit)
- IndexedDB caching system for AI analysis results (24-hour expiration)
- Password visibility toggle in connection modal
- Connection active status indicator (green dot for last 10 minutes)
- Terminal maximize/minimize functionality
- Terminal light/dark mode support`
      },
      {
        heading: "Fixed",
        content: `- Terminal height resizing and content display issues
- Terminal WebSocket disconnect errors
- Infinite re-render in useConnections hook
- Query page auto-reconnect on load
- CSV export with custom delimiters and headers`
      },
      {
        heading: "Changed",
        content: `- Migrated query tabs, schema cache, and table info from localStorage to IndexedDB
- Removed query explain analyzer (replaced by AI Assistant)
- Updated documentation with DBAssist features`
      }
    ]
  },
  {
    version: "0.5.0",
    date: "2025-01-22",
    sections: [
      {
        heading: "Added",
        content: `- DBAssist AI Integration - Natural language to SQL conversion with Google Gemini API
- Query optimization suggestions and error fixing with AI
- Schema analysis and table insights with AI recommendations
- AI Assistant panel in Query Editor (right sidebar)
- Schema Explorer AI insights for table analysis
- Database Analytics Dashboard - Real-time monitoring with WebSocket updates (5s interval)
- Query monitoring: active, long-running (>30s), blocked queries with kill functionality
- Query execution plan visualization and type classification
- System metrics: CPU, memory, disk, connections, database size
- Historical data storage (3 hours) with time range selector
- Slow query log with 24h retention and PDF export for analytics reports
- Enhanced Connection Management - Database URL connection option with async protocol support
- Support for postgresql+asyncpg, mysql+aiomysql, mongodb+srv, sqlite:///
- Connection reuse optimization (5-10x faster queries)
- Performance Optimizations - Query result caching and schema cache optimization (3-5x faster repeated queries)
- Adaptive background task scheduling (50-70% CPU reduction)
- Frontend React.memo, virtualized lists, request deduplication (50% render reduction)
- Route-based code splitting with lazy loading (40-60% faster initial load)
- Comprehensive feature documentation for all major components`
      },
      {
        heading: "Fixed",
        content: `- Operation lock conflicts with timeouts and expiration (prevents "operation in progress" errors)
- Database URL parsing for async protocols and SQLite format
- Charts dark/light mode compatibility
- Connection management performance issues
- Frontend performance bottlenecks`
      }
    ]
  },
  {
    version: "0.4.1",
    date: "2025-01-21",
    sections: [
      {
        heading: "Fixed",
        content: `- White screen flash on backups page loading
- Overview tab not auto-selected on app startup in production
- HashRouter implementation for proper Electron routing
- Navigation issues in packaged application`
      }
    ]
  },
  {
    version: "0.4.0",
    date: "2025-01-20",
    sections: [
      {
        heading: "Added",
        content: `- Terminal Enhancements - Multiple tabs, modern theme, session persistence, auto-reconnection
- Database CLI Shortcuts - Quick buttons for psql, mysql, mongo
- Migration File Browser - View, edit, delete, rename migration files in resizable sidebar
- Clear Output Button - Reset migration command output
- Resizable Sidebar - Drag divider to adjust file browser width (250px-600px)`
      },
      {
        heading: "Improved",
        content: `- Terminal starts in home directory by default
- Terminal restores last working directory on reconnect
- Silent reconnection (no status messages)
- Migration documentation updated with new features
- Terminal documentation simplified and focused`
      }
    ]
  },
  {
    version: "0.3.0",
    date: "2025-01-19",
    sections: [
      {
        heading: "Added",
        content: `- Command Palette - Quick navigation with Ctrl+K (search connections, queries, docs, actions)
- Database Migrations - Integrated migrator-cli with project-based migrations
- Migration Panel - Execute migration commands with real-time WebSocket output
- Migration Settings - Manage migration projects with folder selection and connection linking
- Welcome Dashboard - Landing page with stats cards, quick actions, recent activity, and getting started guide
- Notification Center - Bell icon with unread badge, notifications for backups, queries, connections, and CSV operations
- Onboarding Tour - Step-by-step guide for first-time users
- Splash Screen - Loading screen with spinning icon on app startup
- Documentation Expansion - Added Features and Troubleshooting sections with full-width tabs`
      },
      {
        heading: "Improved",
        content: `- WebSocket Service - Centralized WebSocket endpoints for backups, terminal, and migrator
- Migration Execution - Asyncio subprocess with non-blocking execution and 10s timeout
- Terminal UX - Fixed scroll-to-bottom, added drag-to-resize for terminal height
- Dashboard Navigation - Changed "Dashboard" to "Overview" in sidebar
- Notification Integration - Added notifications for backup success/failure, query errors, connection status, CSV import/export`
      }
    ]
  },
  {
    version: "0.2.0",
    date: "2025-01-19",
    sections: [
      {
        heading: "Added",
        content: `- Backup & Restore System - Automated and manual backups with scheduling
- Backup Scheduling - Daily, weekly, and monthly backup schedules
- Retention Policies - Automatic cleanup of old backups based on age
- Backup Verification - Validate backup integrity after creation
- MongoDB Backup Support - Native mongodump/mongorestore integration
- Native Python Backups - Fallback backup using asyncpg, aiomysql, and motor
- WebSocket Real-time Updates - Live backup status updates without polling
- Notifications - Desktop notifications for backup completion/failure
- Smart Caching - LocalStorage caching with TTL for schema, tables, and connections
- Debounced Search - Search functionality across connections, backups, and schema tree
- Tooltips - Helpful hints throughout the interface
- Progress Bars - Visual indicators for backup progress and long operations
- Breadcrumb Navigation - Track location in data explorer
- Auto-connect - Automatic connection when browsing data if not connected`
      },
      {
        heading: "Improved",
        content: `- Connection Modal - Auto-updates port when database type changes
- Data Explorer - Enhanced pagination info ("Showing 1-100 of 500 rows")
- Schema Tree - Added search bar for filtering tables
- Dark Mode - Fixed label colors in connection modal
- Performance - Reduced re-renders with React.memo and caching`
      }
    ]
  },
  {
    version: "0.1.0",
    date: "2025-01-19",
    sections: [
      {
        heading: "Initial Release",
        content: `- Multi-database support (PostgreSQL, MySQL, SQLite, MongoDB)
- Connection management with test, edit, delete, and status indicators
- Advanced query editor with Monaco, syntax highlighting, autocomplete, and snippets
- AI-powered query analysis with Google Gemini (Explain Plan)
- Multiple query tabs with auto-save and execution history
- Data Explorer with pagination, sorting, filtering, and CSV/JSON export
- Schema browser with tree view of databases, tables, and columns
- Settings system (appearance, query defaults, editor preferences, connection defaults)
- Dark mode with system theme detection
- Session persistence (auto-restore connections)
- Query formatting (Ctrl+Shift+F) and error highlighting
- Cell preview for large text/blob fields
- Secure credential storage and parameterized queries`
      }
    ]
  }
];

export const changelogData = {
  title: "Changelog",
  sections: changelogVersions.flatMap(v => 
    v.sections.map(s => ({ heading: `[${v.version}] - ${v.date}`, content: `**${s.heading}**\n${s.content}` }))
  )
};
