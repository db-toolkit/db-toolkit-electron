import { useEffect, useRef } from 'react';
import { WS_ENDPOINTS } from '../services/websocket';
import { useNotifications } from '../contexts/NotificationContext';

export function useBackupWebSocket(onUpdate) {
  const wsRef = useRef(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    const ws = new WebSocket(WS_ENDPOINTS.BACKUPS);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'backup_update') {
        onUpdate({ ...data, progress: data.data?.progress });
        
        if (data.status === 'completed') {
          addNotification({
            type: 'success',
            title: 'Backup Complete',
            message: `Backup for ${data.data?.connection_name || 'database'} completed successfully`,
            action: { label: 'View', path: '/backups' }
          });
          
          // Platform notification with sound
          if (Notification.permission === 'granted') {
            new Notification('Backup Complete', {
              body: `Backup for ${data.connection_name || 'database'} completed successfully`,
              icon: '/icon.png',
              tag: 'backup-complete',
              requireInteraction: false,
              silent: false
            });
          }
        } else if (data.status === 'failed') {
          addNotification({
            type: 'error',
            title: 'Backup Failed',
            message: data.error || 'Backup operation failed',
            action: { label: 'View', path: '/backups' }
          });
          
          // Platform notification with sound
          if (Notification.permission === 'granted') {
            new Notification('Backup Failed', {
              body: data.error || 'Backup operation failed',
              icon: '/icon.png',
              tag: 'backup-failed',
              requireInteraction: false,
              silent: false
            });
          }
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [onUpdate, addNotification]);

  return wsRef;
}
