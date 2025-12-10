import { useState, useEffect, useCallback } from 'react';
const ipc = {
  invoke: (channel, ...args) => window.electron.ipcRenderer.invoke(channel, ...args)
};

export function useBackups(connectionId = null) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBackups = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = connectionId ? { connection_id: connectionId } : {};
      const result = await ipc.invoke('backup:get-all', params);
      setBackups(result.backups);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [connectionId]);

  const createBackup = useCallback(async (data) => {
    try {
      const result = await ipc.invoke('backup:create', data);
      await fetchBackups();
      return result.backup;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchBackups]);

  const restoreBackup = useCallback(async (backupId, targetConnectionId = null, tables = null) => {
    try {
      await ipc.invoke('backup:restore', backupId, {
        target_connection_id: targetConnectionId,
        tables,
      });
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const downloadBackup = useCallback(async (backupId, filename) => {
    try {
      const result = await ipc.invoke('backup:download', backupId);
      if (result.success) {
        // File should be saved by the backend
        return true;
      }
      throw new Error(result.error || 'Download failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteBackup = useCallback(async (backupId) => {
    try {
      await ipc.invoke('backup:delete', backupId);
      await fetchBackups();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchBackups]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  return {
    backups,
    loading,
    error,
    fetchBackups,
    createBackup,
    restoreBackup,
    downloadBackup,
    deleteBackup,
  };
}
