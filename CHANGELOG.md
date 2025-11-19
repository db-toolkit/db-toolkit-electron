# Changelog

All notable changes to DB Toolkit will be documented in this file.

## [2.0.0] - 2025-01-XX

### Added
- **Backup & Restore System** - Automated and manual backups with scheduling
- **Backup Scheduling** - Daily, weekly, and monthly backup schedules
- **Retention Policies** - Automatic cleanup of old backups based on age
- **Backup Verification** - Validate backup integrity after creation
- **MongoDB Backup Support** - Native mongodump/mongorestore integration
- **Native Python Backups** - Fallback backup using asyncpg, aiomysql, and motor
- **WebSocket Real-time Updates** - Live backup status updates without polling
- **Browser Notifications** - Desktop notifications for backup completion/failure
- **Responsive Design** - Mobile-friendly sidebar with hamburger menu (<768px)
- **Smooth Animations** - Framer Motion transitions for modals, toasts, and pages
- **Smart Caching** - LocalStorage caching with TTL for schema, tables, and connections
- **Debounced Search** - Search functionality across connections, backups, and schema tree
- **Tooltips** - Helpful hints throughout the interface
- **Progress Bars** - Visual indicators for backup progress and long operations
- **Breadcrumb Navigation** - Track location in data explorer
- **Auto-connect** - Automatic connection when browsing data if not connected

### Improved
- **Connection Modal** - Auto-updates port when database type changes
- **Data Explorer** - Enhanced pagination info ("Showing 1-100 of 500 rows")
- **Schema Tree** - Added search bar for filtering tables
- **Dark Mode** - Fixed label colors in connection modal
- **Table Details** - Changed "Sample Data" label to "Data"
- **Performance** - Reduced re-renders with React.memo and caching

### Technical
- Replaced polling with WebSocket connections for real-time updates
- Implemented connection-specific cache namespaces
- Added Framer Motion animation variants
- Created reusable UI components (Tooltip, ProgressBar, Breadcrumbs)
- Implemented debounce utility and useDebounce hook

## [1.0.0] - 2025-11-19

### Initial Release
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
- Built with Python FastAPI backend and Electron + React frontend
- Secure credential storage and parameterized queries
