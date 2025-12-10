/**
 * Hook for real-time analytics via WebSocket
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { WS_ENDPOINTS } from '../services/websocket';
const ipc = {
  invoke: (channel, ...args) => window.electron.ipcRenderer.invoke(channel, ...args)
};

export function useAnalytics(connectionId) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [connectionLost, setConnectionLost] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const toast = useToast();
  const navigate = useNavigate();

  const connect = () => {
    if (!connectionId) {
      setLoading(false);
      return;
    }

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
        if (data.error.includes('Connection not found') || data.error.includes('Connection not active')) {
          setConnectionLost(true);
          toast.error('Database connection lost. Redirecting to connections...');
          setTimeout(() => navigate('/connections'), 2000);
          return;
        }
        // Ignore "operation in progress" errors during initial load
        if (data.error.includes('operation is in progress')) {
          return;
        }
        toast.error(data.error);
        setLoading(false);
        return;
      }

      if (data.success) {
        setAnalytics(data);
        setHistory(prev => [...prev.slice(-19), {
          timestamp: new Date(),
          connections: data.active_connections
        }]);
        setLoading(false);
        setConnectionLost(false);
      }
    };

    ws.onerror = () => {
      setLoading(false);
    };

    ws.onclose = (event) => {
      setLoading(false);
      
      // Don't reconnect if connection was lost or component unmounted
      if (connectionLost || event.code === 1000) {
        return;
      }
      
      if (retryCountRef.current < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
        retryCountRef.current++;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        toast.error('Connection lost. Redirecting to connections...');
        setTimeout(() => navigate('/connections'), 2000);
      }
    };
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, [connectionId]);

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Page unload');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const killQuery = async (pid) => {
    try {
      const result = await ipc.invoke('analytics:kill-query', connectionId, pid);
      
      if (result.success) {
        toast.success('Query terminated');
      } else {
        toast.error(result.error || 'Failed to kill query');
      }
    } catch (err) {
      toast.error('Failed to kill query');
    }
  };

  const getQueryPlan = async (query) => {
    try {
      const result = await ipc.invoke('analytics:get-query-plan', connectionId, query);
      return result;
    } catch (err) {
      toast.error('Failed to get query plan');
      return null;
    }
  };

  const fetchHistoricalData = async (hours = 3) => {
    try {
      const result = await ipc.invoke('analytics:get-history', connectionId, hours);
      if (result.success) {
        setHistory(result.history);
      }
    } catch (err) {
      // Silent fail
    }
  };

  const getSlowQueries = async (hours = 24) => {
    try {
      const result = await ipc.invoke('analytics:get-slow-queries', connectionId, hours);
      return result.slow_queries || [];
    } catch (err) {
      return [];
    }
  };

  const getTableStats = async () => {
    try {
      const result = await ipc.invoke('analytics:get-table-stats', connectionId);
      return result.table_stats || [];
    } catch (err) {
      return [];
    }
  };

  const getPoolStats = async () => {
    try {
      const result = await ipc.invoke('analytics:get-pool-stats', connectionId);
      return result.pool_stats || null;
    } catch (err) {
      return null;
    }
  };

  const exportPDF = async () => {
    try {
      const result = await ipc.invoke('analytics:export-pdf', connectionId);
      if (result.success) {
        toast.success('PDF exported successfully');
      } else {
        toast.error('Failed to export PDF');
      }
    } catch (err) {
      toast.error('Failed to export PDF');
    }
  };

  return { 
    analytics, 
    loading, 
    history,
    connectionLost,
    killQuery, 
    getQueryPlan, 
    fetchHistoricalData,
    getSlowQueries,
    getTableStats,
    getPoolStats,
    exportPDF
  };
}
