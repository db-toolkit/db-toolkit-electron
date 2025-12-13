import { useState, useEffect, useCallback } from "react";
import { connectionsAPI } from "../services/api";
import { useNotifications } from "../contexts/NotificationContext";

export function useConnections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectedIds, setConnectedIds] = useState(new Set());
  const { addNotification } = useNotifications();

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
      setConnections((prev) =>
        prev.map((conn) => (conn.id === id ? response.data : conn)),
      );
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

  const connectToDatabase = useCallback(
    async (id, silent = false) => {
      try {
        const response = await connectionsAPI.connect(id);
        const result = response?.data || response; // Handle both formats

        if (result?.success) {
          setConnectedIds((prev) => new Set(prev).add(id));
          // Store connection timestamp
          localStorage.setItem(`connection_time_${id}`, Date.now().toString());

          // Update recent connections in menu
          if (window.electron?.updateRecentConnections) {
            const recent = connections
              .map((conn) => ({
                id: conn.id,
                name: conn.name,
                lastUsed:
                  conn.id === id
                    ? Date.now().toString()
                    : localStorage.getItem(`connection_time_${conn.id}`),
              }))
              .filter((conn) => conn.lastUsed)
              .sort((a, b) => parseInt(b.lastUsed) - parseInt(a.lastUsed))
              .slice(0, 5);
            window.electron.updateRecentConnections(recent);
          }
          if (!silent) {
            const conn = connections.find((c) => c.id === id);
            addNotification({
              type: "success",
              title: "Connected",
              message: `Successfully connected to ${conn?.name || "database"}`,
              action: { label: "View Schema", path: `/schema/${id}` },
            });
          }
          return result;
        } else {
          throw new Error(result?.message || "Connection failed");
        }
      } catch (err) {
        const conn = connections.find((c) => c.id === id);
        addNotification({
          type: "error",
          title: "Connection Failed",
          message:
            err.response?.data?.detail ||
            err.message ||
            "Failed to connect to database",
          action: { label: "View", path: "/connections" },
        });
        const error = new Error(
          err.response?.data?.detail ||
            err.message ||
            "Failed to connect. Please check your credentials and database server.",
        );
        error.response = err.response;
        throw error;
      }
    },
    [connections, addNotification],
  );

  const disconnectFromDatabase = useCallback(async (id) => {
    try {
      const response = await connectionsAPI.disconnect(id);
      setConnectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      // Remove connection timestamp
      localStorage.removeItem(`connection_time_${id}`);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Removed timestamp-based connection timeout check
  // connectedIds is now managed only through explicit connect/disconnect actions
  // This prevents false "connection lost" detections during long-running operations

  return {
    connections,
    loading,
    error,
    connectedIds,
    fetchConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
    connectToDatabase,
    disconnectFromDatabase,
  };
}
