/**
 * Backup metadata storage.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const STORAGE_DIR = path.join(os.homedir(), '.db-toolkit', 'backups');
const METADATA_FILE = path.join(STORAGE_DIR, 'backups.json');

async function ensureStorage() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  try {
    await fs.access(METADATA_FILE);
  } catch {
    await fs.writeFile(METADATA_FILE, JSON.stringify({ backups: [], schedules: [] }));
  }
}

async function readMetadata() {
  await ensureStorage();
  const data = await fs.readFile(METADATA_FILE, 'utf8');
  
  try {
    return JSON.parse(data);
  } catch (error) {
    // JSON parse error - file is corrupted
    console.error('Corrupted backups.json detected:', error.message);
    
    // Save corrupted file for recovery
    const corruptedPath = `${METADATA_FILE}.corrupted.${Date.now()}`;
    await fs.writeFile(corruptedPath, data, 'utf8');
    console.log(`Corrupted file saved to: ${corruptedPath}`);
    
    // Try to repair by finding valid JSON end
    try {
      // Find the last valid closing brace
      const lastBrace = data.lastIndexOf('}');
      if (lastBrace > 0) {
        const repairedData = data.substring(0, lastBrace + 1);
        const parsed = JSON.parse(repairedData);
        
        // Save repaired version
        await writeMetadata(parsed);
        console.log('Successfully repaired backups.json');
        return parsed;
      }
    } catch (repairError) {
      console.error('Failed to repair backups.json:', repairError.message);
    }
    
    // If repair fails, return empty structure
    console.warn('Returning empty backup structure');
    return { backups: [], schedules: [] };
  }
}

async function writeMetadata(data) {
  // Write to temp file first, then rename (atomic operation)
  const tempFile = `${METADATA_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tempFile, METADATA_FILE);
}

async function addBackup(connectionId, name, backupType, filePath, tables = null, compressed = false, scheduleId = null) {
  const data = await readMetadata();
  const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const backup = {
    id: backupId,
    connection_id: connectionId,
    name,
    backup_type: backupType,
    file_path: filePath,
    status: 'pending',
    tables,
    compressed,
    schedule_id: scheduleId,
    created_at: new Date().toISOString(),
    file_size: 0,
    verified: false
  };
  
  data.backups.push(backup);
  await writeMetadata(data);
  return backup;
}

async function getBackup(backupId) {
  const data = await readMetadata();
  return data.backups.find(b => b.id === backupId);
}

async function getAllBackups(connectionId = null) {
  const data = await readMetadata();
  let backups = data.backups;
  if (connectionId) {
    backups = backups.filter(b => b.connection_id === connectionId);
  }
  return backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function updateBackup(backupId, updates) {
  const data = await readMetadata();
  const index = data.backups.findIndex(b => b.id === backupId);
  if (index !== -1) {
    data.backups[index] = { ...data.backups[index], ...updates };
    await writeMetadata(data);
    return data.backups[index];
  }
  return null;
}

async function deleteBackup(backupId) {
  const data = await readMetadata();
  const originalLen = data.backups.length;
  data.backups = data.backups.filter(b => b.id !== backupId);
  if (data.backups.length < originalLen) {
    await writeMetadata(data);
    return true;
  }
  return false;
}

async function addSchedule(schedule) {
  const data = await readMetadata();
  if (!data.schedules) data.schedules = [];
  data.schedules.push(schedule);
  await writeMetadata(data);
  return schedule;
}

async function getSchedule(scheduleId) {
  const data = await readMetadata();
  return (data.schedules || []).find(s => s.id === scheduleId);
}

async function getAllSchedules() {
  const data = await readMetadata();
  return data.schedules || [];
}

async function updateSchedule(scheduleId, updates) {
  const data = await readMetadata();
  if (!data.schedules) return null;
  const index = data.schedules.findIndex(s => s.id === scheduleId);
  if (index !== -1) {
    data.schedules[index] = { ...data.schedules[index], ...updates };
    await writeMetadata(data);
    return data.schedules[index];
  }
  return null;
}

async function deleteSchedule(scheduleId) {
  const data = await readMetadata();
  if (!data.schedules) return false;
  const originalLen = data.schedules.length;
  data.schedules = data.schedules.filter(s => s.id !== scheduleId);
  if (data.schedules.length < originalLen) {
    await writeMetadata(data);
    return true;
  }
  return false;
}

module.exports = {
  addBackup,
  getBackup,
  getAllBackups,
  updateBackup,
  deleteBackup,
  addSchedule,
  getSchedule,
  getAllSchedules,
  updateSchedule,
  deleteSchedule,
  STORAGE_DIR
};
