import { useState, useCallback } from 'react';
import { queryAPI } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';
import { useRequestDeduplication } from './usePerformance';

export function useQuery(connectionId) {
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addNotification } = useNotifications();
  const { dedupedRequest } = useRequestDeduplication();

  const executeQuery = useCallback(async (query, limit = 1000, offset = 0, timeout = 30) => {
    if (!connectionId) return;
    
    const requestKey = `query_${connectionId}_${query}_${limit}_${offset}`;
    
    setLoading(true);
    setError(null);
    try {
      const response = await dedupedRequest(requestKey, () => 
        queryAPI.execute(connectionId, {
          query,
          limit,
          offset,
          timeout,
        })
      );
      setResult(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      addNotification({
        type: 'error',
        title: 'Query Failed',
        message: err.response?.data?.detail || err.message || 'Failed to execute query',
        action: { label: 'View', path: `/query/${connectionId}` }
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connectionId, addNotification, dedupedRequest]);

  const fetchHistory = useCallback(async () => {
    if (!connectionId) return;
    
    const requestKey = `history_${connectionId}`;
    
    try {
      const response = await dedupedRequest(requestKey, () => 
        queryAPI.getHistory(connectionId)
      );
      setHistory(response.data.history || []);
      return response.data.history;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [connectionId, dedupedRequest]);

  const clearHistory = useCallback(async () => {
    if (!connectionId) return;
    
    try {
      await queryAPI.clearHistory(connectionId);
      setHistory([]);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [connectionId]);

  return {
    result,
    history,
    loading,
    error,
    executeQuery,
    fetchHistory,
    clearHistory,
  };
}
