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
  - Slow query log (persistent, 24h retention)
  - Connection pool statistics (avg, peak, min, current)
  - Table-level statistics (size, rows, indexes, top 20)
  - PDF export for analytics reports
- Documentation for Connections, Data Explorer, Analytics, and Backups features


### Fixed
- Database URL parsing for async protocols and SQLite format
- URL field auto-clears on checkbox toggle, auto-populates fields for editing
- Create Connection button navigation without page refresh
- Charts dark/light mode compatibility
- Connection management performance - reuse connections instead of creating new ones (5-10x faster queries)

### Removed
