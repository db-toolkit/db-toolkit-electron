/**
 * Hook for real-time analytics via WebSocket
 */
import { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { WS_ENDPOINTS } from '../services/websocket';
import api from '../services/api';

export function useAnalytics(connectionId) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10;
  const toast = useToast();

  const connect = () => {
    if (!connectionId) return;

    setLoading(true);
    const ws = new WebSocket(WS_ENDPOINTS.ANALYTICS);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ connection_id: connectionId }));
      retryCountRef.current = 0;
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      if (data.success) {
        setAnalytics(data);
        setHistory(prev => [...prev.slice(-19), {
          timestamp: new Date(),
          cpu: data.system_stats.cpu_usage,
          memory: data.system_stats.memory_usage,
          connections: data.active_connections
        }]);
        setLoading(false);
      }
    };

    ws.onerror = () => {
      setLoading(false);
    };

    ws.onclose = () => {
      setLoading(false);
      
      if (retryCountRef.current < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        retryCountRef.current++;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [connectionId]);

  const killQuery = async (pid) => {
    try {
      const response = await api.post(`/analytics/connections/${connectionId}/kill`, { pid });
      
      if (response.data.success) {
        toast.success('Query terminated');
      } else {
        toast.error(response.data.error || 'Failed to kill query');
      }
    } catch (err) {
      toast.error('Failed to kill query');
    }
  };

  return { analytics, loading, history, killQuery };
}
