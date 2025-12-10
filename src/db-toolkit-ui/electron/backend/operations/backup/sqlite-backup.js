/**
 * SQLite backup operations.
 */

const fs = require('fs').promises;
const { compressFile } = require('./compression');

async function backupSQLite(backup, config) {
  const outputFile = backup.file_path.replace('.gz', '');
  await fs.copyFile(config.database, outputFile);
}

async function restoreSQLite(filePath, config) {
  await fs.copyFile(filePath, config.database);
}

module.exports = { backupSQLite, restoreSQLite };
