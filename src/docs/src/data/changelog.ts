export const changelogVersions = [
  {
    version: "0.1.0-beta",
    date: "2025-12-10",
    sections: [
      {
        heading: "Beta Release",
        content: `Beta release of DB Toolkit - a modern, cross-platform database management application.`
      },
      {
        heading: "Features",
        content: `- Multi-Database Support - PostgreSQL, MySQL, SQLite, MongoDB
- Connection Management - Save, test, and manage multiple database connections
- Schema Explorer - Visual tree browser for databases, schemas, tables, and columns with ER diagram visualization
- Query Editor - Monaco-based editor with syntax highlighting, auto-complete, and formatting
- Visual Query Builder - Build SQL queries visually without writing code
- Multiple Query Tabs - Work on multiple queries simultaneously with auto-save
- Query History - Track and re-run previous queries
- Data Explorer - Inline editing, insert/delete rows, pagination, sorting, and filtering
- AI Query Assistant - Generate, optimize, and explain SQL queries with AI
- ER Diagram - Visualize database relationships and schema structure
- WorkSpaces - Multiple isolated workspace tabs for working with different databases simultaneously
- Backup & Restore - Automated backups with scheduling, retention policies, and restore capabilities
- Database Analytics - Visual insights, query performance analysis, and database statistics
- Auto-Updater - Automatic updates from GitHub releases
- Cross-Platform - Available for macOS (Intel), Windows, and Linux (deb/rpm)`
      },
      {
        heading: "Tech Stack",
        content: `- Frontend: React 18, Tailwind CSS, Monaco Editor, Framer Motion, Vite
- Backend: Node.js, Electron IPC, SQLite3, PostgreSQL, MySQL, MongoDB drivers
- Desktop: Electron, Cross-platform (macOS, Windows, Linux)`
      }
    ]
  }
];

export const changelogData = {
  title: "Changelog",
  sections: changelogVersions.flatMap(v => 
    v.sections.map(s => ({ heading: `[${v.version}] - ${v.date}`, content: `**${s.heading}**\n${s.content}` }))
  )
};
