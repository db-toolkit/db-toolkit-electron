export const changelogData = {
  title: "Changelog",
  sections: [
    {
      heading: "[0.3.0] - 2025-01-19",
      content: `**Added**
- Command Palette - Quick navigation with Ctrl+K (search connections, queries, docs, actions)
- Database Migrations - Integrated migrator-cli with project-based migrations
- Migration Panel - Execute migration commands with real-time WebSocket output
- Migration Settings - Manage migration projects with folder selection and connection linking
- Welcome Dashboard - Landing page with stats cards, quick actions, recent activity, and getting started guide
- Notification Center - Bell icon with unread badge, notifications for backups, queries, connections, and CSV operations
- Onboarding Tour - Step-by-step guide for first-time users
- Splash Screen - Loading screen with spinning icon on app startup
- Documentation Expansion - Added Features and Troubleshooting sections with full-width tabs

**Improved**
- WebSocket Service - Centralized WebSocket endpoints for backups, terminal, and migrator
- Migration Execution - Asyncio subprocess with non-blocking execution and 10s timeout
- Terminal UX - Fixed scroll-to-bottom, added drag-to-resize for terminal height
- Dashboard Navigation - Changed "Dashboard" to "Overview" in sidebar
- Notification Integration - Added notifications for backup success/failure, query errors, connection status, CSV import/export`
    },
    {
      heading: "[0.2.0] - 2025-01-19",
      content: `**Added**
- Backup & Restore System - Automated and manual backups with scheduling
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
- Auto-connect - Automatic connection when browsing data if not connected

**Improved**
- Connection Modal - Auto-updates port when database type changes
- Data Explorer - Enhanced pagination info ("Showing 1-100 of 500 rows")
- Schema Tree - Added search bar for filtering tables
- Dark Mode - Fixed label colors in connection modal
- Performance - Reduced re-renders with React.memo and caching`
    },
    {
      heading: "[0.1.0] - 2025-01-19",
      content: `**Initial Release**
- Multi-database support (PostgreSQL, MySQL, SQLite, MongoDB)
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
};
