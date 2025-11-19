# DB Toolkit

A modern, cross-platform desktop database management application built with **Electron + React** frontend and **Python FastAPI** backend.

![DB Toolkit](https://img.shields.io/badge/version-2.0.0-blue) ![Python](https://img.shields.io/badge/python-3.11+-green) ![Node](https://img.shields.io/badge/node-18+-green)

## Features

- **Multi-Database Support** - PostgreSQL, MySQL, SQLite, MongoDB
- **Schema Explorer** - Visual browser for databases, schemas, tables, and columns
- **SQL Editor** - Syntax highlighting, auto-complete, and query history with CodeMirror
- **Data Management** - Inline editing, insert/delete rows, CSV import/export
- **Dark Mode** - Automatic OS theme detection with manual toggle
- **Session Persistence** - Auto-restore previous connections on startup

## Tech Stack

**Backend:** FastAPI, SQLAlchemy, AsyncPG, AIOMySQL, Motor, UV
**Frontend:** Electron, React 18, Tailwind CSS, CodeMirror 6, Vite

## Project Structure

```
db-toolkit/
├── src/
│   ├── db_toolkit/              # Python backend
│   │   ├── connectors/          # Database connectors
│   │   ├── core/                # Models, routes, schemas
│   │   ├── operations/          # Business logic
│   │   └── main.py              # FastAPI entry point
│   └── db-toolkit-ui/           # Electron + React frontend
│       ├── electron/main.js     # Electron main process
│       └── src/                 # React components, hooks, pages
├── pyproject.toml
└── README.md
```

## Usage

1. **Create Connection** - Click "New Connection", enter details, save
2. **Connect** - Click "Connect" on connection card (green dot = active)
3. **Browse Schema** - Expand schemas/tables, view columns and indexes
4. **Execute Queries** - Use SQL editor with Ctrl+Enter, export results to CSV
5. **Edit Data** - Double-click cells to edit, insert/delete rows

## Keyboard Shortcuts

- `Ctrl/Cmd + Enter` - Execute query
- `Ctrl/Cmd + K` - Toggle dark mode
- `Escape` - Close modals

## Troubleshooting

**Backend won't start:** Check Python 3.11+, port 8000 availability, UV dependencies
**Frontend won't connect:** Ensure backend running on port 8000
**Database connection fails:** Verify credentials, network, database server status

## License

MIT License



---

**Built with ❤️ using Python, React, and Electron**