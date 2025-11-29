# Changelog

All notable changes to DB Toolkit will be documented in this file. Only the last two version changes are documented here. For complete changelog, visit [Documentation](https://docs-dbtoolkit.vercel.app).

## [0.5.2] - 2025-01-24

### Added
- **Backend Bundling with PyInstaller** - FastAPI backend now bundled with Electron app (no Python installation required)
- **Application Logging System** - File-based logging with rotation (10MB max, 5 files) to `~/.db-toolkit/logs/`
- **Health Check Endpoint** - Comprehensive health check with system metrics (CPU, memory, disk, active connections)
- **Platform Notifications** - Sound notifications for backup completion/failure events
- **Unsaved Changes Warning** - Dialog in connection modal to prevent accidental data loss
- **Auto-save Draft** - New connections auto-saved as draft with recovery on reopen
- **Direct Download** - Download buttons now trigger direct file download instead of redirect

### Fixed
- **Backup Progress Bar** - Now updates in real-time via WebSocket (0%, 25%, 75%, 85%, 100%) instead of stuck at 50%
- **Analytics Connection Errors** - Removed operation locks from PostgreSQL and MySQL connectors
- **Duplicate Connection Creation** - Test Connection button no longer saves to database before testing
- **Backup Schedules Count** - Dashboard now correctly fetches count from API instead of showing 0
- **Backup Notifications** - Added connection_name to WebSocket data for proper notification display
- **Connection Modal Data Loss** - Prevents data loss when modal accidentally closed

### Changed
- **Release Workflow** - Updated CI/CD to build backend with PyInstaller for all platforms

## [0.5.1] - 2025-01-23

### Added
- Schema Explorer AI with schema-level and table-level analysis
- Per-tab AI chat history in Query Editor (10 message limit)
- IndexedDB caching system for AI analysis results (24-hour expiration)
- Password visibility toggle in connection modal
- Connection active status indicator (green dot for last 10 minutes)
- Terminal maximize/minimize functionality
- Terminal light/dark mode support

### Fixed
- Terminal height resizing and content display issues
- Terminal WebSocket disconnect errors
- Infinite re-render in useConnections hook
- Query page auto-reconnect on load
- CSV export with custom delimiters and headers

### Changed
- Migrated query tabs, schema cache, and table info from localStorage to IndexedDB
- Removed query explain analyzer (replaced by AI Assistant)