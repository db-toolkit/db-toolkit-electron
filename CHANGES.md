# Development Changes

This file tracks changes during development before they are added to CHANGELOG.md.

## Unreleased

### Added
- Database URL connection option - Add checkbox to use full database URL instead of individual fields in connection modal
  - Support for async protocols: postgresql+asyncpg, mysql+aiomysql, mongodb+srv
  - Support for SQLite file paths: sqlite:///path/to/db.sqlite
  - URL validation with specific error messages

### Changed

### Fixed
- Database URL parsing now handles async driver protocols correctly
- SQLite URL format (sqlite:///) now parsed correctly

### Removed
