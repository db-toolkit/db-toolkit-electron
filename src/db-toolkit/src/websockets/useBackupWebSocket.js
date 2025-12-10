import { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

export function useBackupWebSocket(onUpdate) {
  const { addNotification } = useNotifications();

  useEffect(() => {
    const handleBackupUpdate = (event, data) => {
      if (data.type === 'backup_update') {
        onUpdate({ ...data, progress: data.data?.progress });
        
        if (data.status === 'completed') {
          addNotification({
            type: 'success',
            title: 'Backup Complete',
            message: `Backup for ${data.data?.connection_name || 'database'} completed successfully`,
            action: { label: 'View', path: '/backups' }
          });
        } else if (data.status === 'failed') {
          addNotification({
            type: 'error',
            title: 'Backup Failed',
            message: data.data?.error || 'Backup operation failed',
            action: { label: 'View', path: '/backups' }
          });
        }
      }
    };

    window.electron.ipcRenderer.on('backup:update', handleBackupUpdate);

    return () => {
      window.electron.ipcRenderer.removeListener('backup:update', handleBackupUpdate);
    };
  }, [onUpdate, addNotification]);
}
