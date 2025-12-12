/**
 * MongoDB backup operations.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

async function commandExists(command) {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

async function backupMongoDB(backup, config, tables) {
  if (await commandExists('mongodump')) {
    await backupMongoDBDump(backup, config, tables);
  } else {
    await backupMongoDBNative(backup, config, tables);
  }
}

async function backupMongoDBDump(backup, config, tables) {
  const outputDir = backup.file_path.replace('.sql.gz', '').replace('.sql', '');
  
  let cmd = `mongodump --host ${config.host} --port ${config.port || 27017} --db ${config.database} --out ${outputDir}`;
  
  if (config.username) cmd += ` --username ${config.username}`;
  if (config.password) cmd += ` --password ${config.password}`;
  
  if (backup.backup_type === 'tables' && tables) {
    for (const table of tables) {
      cmd += ` --collection ${table}`;
    }
  }
  
  await execAsync(cmd);
  
  if (backup.compressed) {
    await compressDirectory(outputDir, backup.file_path);
    await fs.rm(outputDir, { recursive: true });
  }
}

async function backupMongoDBNative(backup, config, tables) {
  const { MongoClient } = require('mongodb');
  const { backupNotifier } = require('../../ws/backup-notifier');
  const outputFile = backup.file_path.replace('.gz', '').replace('.sql', '.json');
  
  const uri = `mongodb://${config.username}:${config.password}@${config.host}:${config.port || 27017}`;
  const client = new MongoClient(uri);
  
  await client.connect();
  
  try {
    const db = client.db(config.database);
    let content = { database: config.database, collections: {} };
    
    let collectionList = tables;
    if (!collectionList) {
      const collections = await db.listCollections().toArray();
      collectionList = collections.map(c => c.name);
    }
    
    const totalCollections = collectionList.length;
    let processedCollections = 0;
    
    for (const collName of collectionList) {
      processedCollections++;
      const progress = Math.floor((processedCollections / totalCollections) * 70) + 10;
      await backupNotifier.notifyBackupUpdate(backup.id, 'in_progress', { 
        connection_name: config.name, 
        progress 
      });
      const collection = db.collection(collName);
      const documents = await collection.find().toArray();
      
      content.collections[collName] = documents.map(doc => {
        if (doc._id) doc._id = doc._id.toString();
        return doc;
      });
    }
    
    await backupNotifier.notifyBackupUpdate(backup.id, 'in_progress', { 
      connection_name: config.name, 
      progress: 80 
    });
    
    await fs.writeFile(outputFile, JSON.stringify(content, null, 2));
  } finally {
    await client.close();
  }
}

async function compressDirectory(dirPath, outputPath) {
  const archiver = require('archiver');
  const output = require('fs').createWriteStream(outputPath);
  const archive = archiver('tar', { gzip: true });
  
  return new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(dirPath, path.basename(dirPath));
    archive.finalize();
  });
}

async function restoreMongoDB(filePath, config) {
  let cmd = `mongorestore --host ${config.host} --port ${config.port || 27017} --db ${config.database} ${filePath}`;
  
  if (config.username) cmd += ` --username ${config.username}`;
  if (config.password) cmd += ` --password ${config.password}`;
  
  await execAsync(cmd);
}

module.exports = { backupMongoDB, restoreMongoDB };
