# Development Changes

This file tracks changes during development before they are added to CHANGELOG.md.

## Unreleased

### Added
- Platform notifications with sound for backup completion/failure events
- Unsaved changes warning dialog in connection modal
- Auto-save draft for new connections with recovery on reopen

### Fixed
- Duplicate connection creation when using Test Connection button
- Backup schedules count showing 0 on dashboard (now fetches from API)
- Backup completion notifications not appearing (added connection_name to WebSocket data)
- Connection modal data loss when accidentally closed
- Backup progress bar stuck at 50% - now updates in real-time via WebSocket (0%, 25%, 75%, 85%, 100%)

### Changed
- Test Connection button no longer saves connection to database before testing

### Removed
- Duplicate notification logic from BackupsPage (now handled by WebSocket only)
- Useless system stats (CPU, Memory, Disk) from analytics page - now shows only database metrics
- Analytics page 'Connection object has no attribute _query_lock' error
- Removed operation lock from connectors to fix analytics 'Connection object has no attribute connection' error
- Added comprehensive health check endpoint with system metrics
- Added application logging to ~/.db-toolkit/logs with rotation (10MB, 5 files)
- Fixed health check endpoint to use connection_manager
- Added comprehensive logging to all operations and error handlers
