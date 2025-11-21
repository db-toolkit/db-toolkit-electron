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

### Changed
- Test Connection button no longer saves connection to database before testing

### Removed
- Duplicate notification logic from BackupsPage (now handled by WebSocket only)
