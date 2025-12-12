# Changelog

All notable changes to DB Toolkit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Workspaces** - Multiple isolated workspace tabs for working with different databases simultaneously
  - Up to 20 configurable workspace tabs (default 10)
  - Each workspace maintains isolated state (connection, queries, active page)
  - Custom workspace names and colors (17 color options)
  - Keyboard shortcuts: Cmd/Ctrl+T (new), Cmd/Ctrl+W (close), Cmd/Ctrl+1-9 (switch)
  - Right-click context menu (Rename, Change Color, Close, Close Others, Close All)
  - Unsaved changes tracking with visual indicator
  - Workspace settings in Settings modal (enable/disable, max workspaces slider)
  - Persistent state across app restarts
  - Custom frameless titlebar with integrated workspace tabs (Wave Terminal style)

## [0.1.0-beta] - 2025-12-10

Beta release of DB Toolkit - a modern, cross-platform database management application.

### Features
- **Multi-Database Support** - PostgreSQL, MySQL, SQLite, MongoDB
- **Connection Management** - Save, test, and manage multiple database connections
- **Schema Explorer** - Visual tree browser for databases, schemas, tables, and columns with ER diagram visualization
- **Query Editor** - Monaco-based editor with syntax highlighting, auto-complete, and formatting
- **Visual Query Builder** - Build SQL queries visually without writing code
- **Multiple Query Tabs** - Work on multiple queries simultaneously with auto-save
- **Query History** - Track and re-run previous queries
- **Data Explorer** - Inline editing, insert/delete rows, pagination, sorting, and filtering
- **AI Query Assistant** - Generate, optimize, and explain SQL queries with AI
- **ER Diagram** - Visualize database relationships and schema structure
- **Backup & Restore** - Automated backups with scheduling, retention policies, and restore capabilities
- **Database Analytics** - Visual insights, query performance analysis, and database statistics
- **Auto-Updater** - Automatic updates from GitHub releases
- **Cross-Platform** - Available for macOS (Intel), Windows, and Linux (deb/rpm)

### Tech Stack
- Frontend: React 18, Tailwind CSS, Monaco Editor, Framer Motion, Vite
- Backend: Node.js, Electron IPC, SQLite3, PostgreSQL, MySQL, MongoDB drivers
- Desktop: Electron, Cross-platform (macOS, Windows, Linux)