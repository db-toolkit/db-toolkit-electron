/**
 * PostgreSQL backup operations.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const { compressFile } = require('./compression');

const execAsync = promisify(exec);

async function commandExists(command) {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

async function backupPostgreSQL(backup, config, tables) {
  if (await commandExists('pg_dump')) {
    await backupPostgreSQLPgDump(backup, config, tables);
  } else {
    await backupPostgreSQLNative(backup, config, tables);
  }
}

async function backupPostgreSQLPgDump(backup, config, tables) {
  const outputFile = backup.file_path.replace('.gz', '');
  let cmd = `PGPASSWORD="${config.password}" pg_dump -h ${config.host} -p ${config.port || 5432} -U ${config.username} -d ${config.database} -F p -f ${outputFile}`;
  
  if (backup.backup_type === 'schema_only') {
    cmd += ' --schema-only';
  } else if (backup.backup_type === 'data_only') {
    cmd += ' --data-only';
  } else if (backup.backup_type === 'tables' && tables) {
    tables.forEach(t => cmd += ` -t ${t}`);
  }
  
  await execAsync(cmd);
}

async function backupPostgreSQLNative(backup, config, tables) {
  const { Client } = require('pg');
  const outputFile = backup.file_path.replace('.gz', '');
  
  const client = new Client({
    host: config.host,
    port: config.port || 5432,
    user: config.username,
    password: config.password,
    database: config.database
  });
  
  await client.connect();
  
  try {
    let content = `-- PostgreSQL Backup\n-- Database: ${config.database}\n\n`;
    
    let tableList = tables;
    if (!tableList) {
      const result = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
      tableList = result.rows.map(r => r.tablename);
    }
    
    for (const table of tableList) {
      if (backup.backup_type !== 'data_only') {
        const cols = await client.query(`
          SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [table]);
        
        if (cols.rows.length > 0) {
          content += `\n-- Table: ${table}\n`;
          content += `DROP TABLE IF EXISTS "${table}";\n`;
          content += `CREATE TABLE "${table}" (\n`;
          
          const colDefs = cols.rows.map(col => {
            let def = `  "${col.column_name}" ${col.data_type}`;
            if (col.character_maximum_length) def += `(${col.character_maximum_length})`;
            if (col.is_nullable === 'NO') def += ' NOT NULL';
            if (col.column_default) def += ` DEFAULT ${col.column_default}`;
            return def;
          });
          
          content += colDefs.join(',\n');
          content += '\n);\n\n';
        }
      }
      
      if (backup.backup_type !== 'schema_only') {
        const data = await client.query(`SELECT * FROM "${table}"`);
        if (data.rows.length > 0) {
          content += `-- Data for table: ${table}\n`;
          const columns = Object.keys(data.rows[0]);
          
          for (const row of data.rows) {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              return String(val);
            });
            
            const cols = columns.map(c => `"${c}"`).join(', ');
            const vals = values.join(', ');
            content += `INSERT INTO "${table}" (${cols}) VALUES (${vals});\n`;
          }
          content += '\n';
        }
      }
    }
    
    await fs.writeFile(outputFile, content);
  } finally {
    await client.end();
  }
}

async function restorePostgreSQL(filePath, config) {
  const cmd = `PGPASSWORD="${config.password}" psql -h ${config.host} -p ${config.port || 5432} -U ${config.username} -d ${config.database} -f ${filePath}`;
  await execAsync(cmd);
}

module.exports = { backupPostgreSQL, restorePostgreSQL };
