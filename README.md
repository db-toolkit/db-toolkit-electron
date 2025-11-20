# DB Toolkit

<div align="center">

![DB Toolkit](https://img.shields.io/badge/version-0.5.0-blue) ![Python](https://img.shields.io/badge/python-3.11+-green) ![Node](https://img.shields.io/badge/node-18+-green) ![License](https://img.shields.io/badge/license-MIT-green)

A modern, cross-platform desktop database management application built with **Electron + React** frontend and **Python FastAPI** backend.

</div>

## Features

### 🗄️ Database Management
- **Multi-Database Support** - PostgreSQL, MySQL, SQLite, MongoDB
- **Connection Management** - Save, test, edit, and delete connections with status indicators
- **Session Persistence** - Auto-restore previous connections on startup
- **Connection Profiles** - Store multiple database configurations

### 🔍 Schema Explorer
- **Visual Tree Browser** - Navigate databases, schemas, tables, and columns
- **Table Details** - View columns, data types, constraints, and indexes
- **Search & Filter** - Quickly find tables and schemas with debounced search
- **Real-time Updates** - Automatic schema refresh on changes

### ✏️ Query Editor
- **Monaco Editor** - Professional code editor with syntax highlighting
- **Auto-complete** - Intelligent SQL suggestions and snippets
- **Multiple Tabs** - Work on multiple queries simultaneously with auto-save
- **Query History** - Track and re-run previous queries
- **Query Formatting** - Format SQL with `Ctrl+Shift+F`
- **Error Highlighting** - Real-time syntax error detection
- **AI-Powered Analysis** - Explain query execution plans with Google Gemini

### 📊 Data Explorer
- **Inline Editing** - Double-click cells to edit data directly
- **Insert/Delete Rows** - Add or remove records with validation
- **Pagination** - Navigate large datasets efficiently
- **Sorting & Filtering** - Organize data with column-level controls
- **CSV/JSON Export** - Export query results and table data
- **CSV Import** - Bulk import data from CSV files
- **Cell Preview** - View large text/blob fields in modal
- **Breadcrumb Navigation** - Track your location in the database

### 💾 Backup & Restore
- **Automated Backups** - Schedule daily, weekly, or monthly backups
- **Manual Backups** - Create on-demand backups with compression
- **Retention Policies** - Automatic cleanup of old backups
- **Backup Verification** - Validate backup integrity
- **Native & External Tools** - Support for pg_dump, mysqldump, mongodump with Python fallback
- **Real-time Status** - WebSocket updates for backup progress
- **Notifications** - Get notified when backups complete

### ⚙️ Settings & Customization
- **Dark Mode** - Automatic OS theme detection with manual toggle
- **Query Defaults** - Configure row limits and timeout settings
- **Editor Preferences** - Customize font size, theme, and behavior
- **Connection Defaults** - Set default ports and connection parameters
- **Appearance Settings** - Personalize the UI to your preferences

## Tech Stack

**Backend:** FastAPI, SQLAlchemy, AsyncPG, AIOMySQL, Motor, WebSockets, UV  
**Frontend:** Electron, React 18, Tailwind CSS, Monaco Editor, Framer Motion, Vite

## Keyboard Shortcuts

- `Ctrl/Cmd + Enter` - Execute query
- `Ctrl/Cmd + Shift + F` - Format SQL
- `Ctrl/Cmd + K` - Toggle dark mode
- `Escape` - Close modals

## License

MIT License

---

**Built with ❤️ using Python, React, and Electron**