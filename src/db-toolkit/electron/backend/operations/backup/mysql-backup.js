/**
 * MySQL backup operations.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;

const execAsync = promisify(exec);

async function commandExists(command) {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

async function backupMySQL(backup, config, tables) {
  if (await commandExists('mysqldump')) {
    await backupMySQLDump(backup, config, tables);
  } else {
    await backupMySQLNative(backup, config, tables);
  }
}

async function backupMySQLDump(backup, config, tables) {
  const outputFile = backup.file_path.replace('.gz', '');
  let cmd = `mysqldump -h ${config.host} -P ${config.port || 3306} -u ${config.username}`;
  
  if (config.password) cmd += ` -p${config.password}`;
  
  if (backup.backup_type === 'schema_only') {
    cmd += ' --no-data';
  } else if (backup.backup_type === 'data_only') {
    cmd += ' --no-create-info';
  }
  
  cmd += ` ${config.database}`;
  
  if (backup.backup_type === 'tables' && tables) {
    cmd += ` ${tables.join(' ')}`;
  }
  
  cmd += ` > ${outputFile}`;
  
  await execAsync(cmd);
}

async function backupMySQLNative(backup, config, tables) {
  const mysql = require('mysql2/promise');
  const { backupNotifier } = require('../../ws/backup-notifier');
  const outputFile = backup.file_path.replace('.gz', '');
  
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port || 3306,
    user: config.username,
    password: config.password,
    database: config.database
  });
  
  try {
    let content = `-- MySQL Backup\n-- Database: ${config.database}\n\n`;
    
    let tableList = tables;
    if (!tableList) {
      const [rows] = await connection.query('SHOW TABLES');
      tableList = rows.map(r => Object.values(r)[0]);
    }
    
    const totalTables = tableList.length;
    let processedTables = 0;
    
    for (const table of tableList) {
      processedTables++;
      const progress = Math.floor((processedTables / totalTables) * 70) + 10;
      await backupNotifier.notifyBackupUpdate(backup.id, 'in_progress', { 
        connection_name: config.name, 
        progress 
      });
      if (backup.backup_type !== 'data_only') {
        const [createTable] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
        content += `\n-- Table: ${table}\n`;
        content += `DROP TABLE IF EXISTS \`${table}\`;\n`;
        content += `${createTable[0]['Create Table']};\n\n`;
      }
      
      if (backup.backup_type !== 'schema_only') {
        const [data] = await connection.query(`SELECT * FROM \`${table}\``);
        
        if (data.length > 0) {
          content += `-- Data for table: ${table}\n`;
          const columns = Object.keys(data[0]);
          
          for (const row of data) {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              return String(val);
            });
            
            const cols = columns.map(c => `\`${c}\``).join(', ');
            const vals = values.join(', ');
            content += `INSERT INTO \`${table}\` (${cols}) VALUES (${vals});\n`;
          }
          content += '\n';
        }
      }
    }
    
    await backupNotifier.notifyBackupUpdate(backup.id, 'in_progress', { 
      connection_name: config.name, 
      progress: 80 
    });
    
    await fs.writeFile(outputFile, content);
  } finally {
    await connection.end();
  }
}

async function restoreMySQL(filePath, config) {
  let cmd = `mysql -h ${config.host} -P ${config.port || 3306} -u ${config.username}`;
  if (config.password) cmd += ` -p${config.password}`;
  cmd += ` ${config.database} < ${filePath}`;
  
  await execAsync(cmd);
}

module.exports = { backupMySQL, restoreMySQL };
