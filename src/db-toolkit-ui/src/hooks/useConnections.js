import { useState, useEffect, useCallback } from 'react';
import { connectionsAPI } from '../services/api';

export function useConnections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await connectionsAPI.getAll();
      setConnections(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createConnection = useCallback(async (data) => {
    try {
      const response = await connectionsAPI.create(data);
      setConnections((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateConnection = useCallback(async (id, data) => {
    try {
      const response = await connectionsAPI.update(id, data);
      setConnections((prev) => prev.map(conn => conn.id === id ? response.data : conn));
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteConnection = useCallback(async (id) => {
    try {
      await connectionsAPI.delete(id);
      setConnections((prev) => prev.filter((conn) => conn.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const testConnection = useCallback(async (id) => {
    try {
      const response = await connectionsAPI.test(id);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const connectToDatabase = useCallback(async (id) => {
    try {
      const response = await connectionsAPI.connect(id);
      return response.data;
    } catch (err) {
      const error = new Error(err.response?.data?.detail || 'Failed to connect. Please check your credentials and database server.');
      error.response = err.response;
      throw error;
    }
  }, []);

  const disconnectFromDatabase = useCallback(async (id) => {
    try {
      const response = await connectionsAPI.disconnect(id);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return {
    connections,
    loading,
    error,
    fetchConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
    connectToDatabase,
    disconnectFromDatabase,
  };
}
