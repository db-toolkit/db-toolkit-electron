# Development Changes

This file tracks changes during development before they are added to CHANGELOG.md.

## Unreleased

### Added
- Database URL connection option with async protocol support (postgresql+asyncpg, mysql+aiomysql, mongodb+srv, sqlite:///)
- Database Analytics page with real-time monitoring (WebSocket, 5s updates)
  - Query monitoring: current, long-running (>30s), blocked queries with kill functionality
  - Query execution plan visualization and type classification (SELECT/INSERT/UPDATE/DELETE)
  - System metrics: CPU, memory, disk, connections, database size
  - Historical data storage (3 hours) with time range selector (1h/2h/3h)
- Documentation for Connections, Data Explorer, Analytics, and Backups features

### Changed

### Fixed
- Database URL parsing for async protocols and SQLite format
- URL field auto-clears on checkbox toggle, auto-populates fields for editing
- Create Connection button navigation without page refresh
- Charts dark/light mode compatibility


### Removed
