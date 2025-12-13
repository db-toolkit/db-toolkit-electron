/**
 * Hook for real-time analytics via IPC
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";

const ipc = {
  invoke: (channel, ...args) =>
    window.electron.ipcRenderer.invoke(channel, ...args),
};

export function useAnalytics(connectionId) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [connectionLost, setConnectionLost] = useState(false);
  const intervalRef = useRef(null);
  const healthCheckRef = useRef(null);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchAnalytics = async () => {
    if (!connectionId) {
      setLoading(false);
      return;
    }

    try {
      console.log(
        "[Analytics] Fetching analytics for connectionId:",
        connectionId,
      );
      const result = await ipc.invoke("analytics:get", connectionId);
      console.log("[Analytics] Result:", result);

      if (!result.success) {
        console.error("[Analytics] Fetch failed:", result.error);
        if (
          result.error?.includes("Connection not found") ||
          result.error?.includes("Connection not active")
        ) {
          console.error("[Analytics] Connection lost detected, redirecting...");
          setConnectionLost(true);
          toast.error(
            "Database connection lost. Redirecting to connections...",
          );
          setTimeout(() => navigate("/connections"), 2000);
          return;
        }
        toast.error(result.error || "Failed to fetch analytics");
        setLoading(false);
        return;
      }

      console.log(
        "[Analytics] Fetch successful, active connections:",
        result.active_connections,
      );

      setAnalytics(result);
      setHistory((prev) => [
        ...(prev || []).slice(-19),
        {
          timestamp: new Date(),
          connections: result?.active_connections || 0,
        },
      ]);
      setLoading(false);
      setConnectionLost(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to fetch analytics");
    }
  };

  // Check connection health periodically
  const checkConnectionHealth = async () => {
    if (!connectionId) return;

    try {
      console.log("[Analytics] Checking connection health for:", connectionId);
      const health = await ipc.invoke("connections:checkHealth", connectionId);
      console.log("[Analytics] Health check result:", health);

      if (!health.active) {
        console.error(
          "[Analytics] Health check failed, redirecting. Error:",
          health.error,
        );
        setConnectionLost(true);
        toast.error("Database connection lost. Redirecting...");
        setTimeout(() => navigate("/connections"), 2000);

        // Clear intervals
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (healthCheckRef.current) {
          clearInterval(healthCheckRef.current);
        }
      } else {
        console.log("[Analytics] Health check passed");
      }
    } catch (error) {
      console.error("[Analytics] Health check exception:", error);
    }
  };

  useEffect(() => {
    if (!connectionId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    console.log(
      "[Analytics] Setting up analytics polling for connectionId:",
      connectionId,
    );
    fetchAnalytics();

    // Set up polling for real-time updates (every 5 seconds)
    intervalRef.current = setInterval(fetchAnalytics, 5000);

    // Set up health checks (every 30 seconds)
    healthCheckRef.current = setInterval(checkConnectionHealth, 30000);
    console.log("[Analytics] Polling and health checks configured");

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
      }
    };
  }, [connectionId]);

  const killQuery = async (pid) => {
    try {
      const result = await ipc.invoke(
        "analytics:kill-query",
        connectionId,
        pid,
      );

      if (result.success) {
        toast.success("Query terminated");
      } else {
        toast.error(result.error || "Failed to kill query");
      }
    } catch (err) {
      toast.error("Failed to kill query");
    }
  };

  const getQueryPlan = async (query) => {
    try {
      const result = await ipc.invoke(
        "analytics:query-plan",
        connectionId,
        query,
      );
      return result;
    } catch (err) {
      toast.error("Failed to get query plan");
      return null;
    }
  };

  const fetchHistoricalData = async (hours = 3) => {
    try {
      const result = await ipc.invoke(
        "analytics:historical",
        connectionId,
        hours,
      );
      if (result.success) {
        setHistory(result.history);
      }
    } catch (err) {
      // Silent fail
    }
  };

  const getSlowQueries = async (hours = 24) => {
    try {
      const result = await ipc.invoke(
        "analytics:slow-queries",
        connectionId,
        hours,
      );
      return result.data || [];
    } catch (err) {
      return [];
    }
  };

  const getTableStats = async () => {
    try {
      const result = await ipc.invoke("analytics:table-stats", connectionId);
      return result.data || [];
    } catch (err) {
      return [];
    }
  };

  const getPoolStats = async () => {
    try {
      const result = await ipc.invoke("analytics:get", connectionId);
      return result?.pool_stats || null;
    } catch (err) {
      return null;
    }
  };

  const exportPDF = async () => {
    try {
      const result = await ipc.invoke("analytics:export-pdf", connectionId);
      if (result.success) {
        toast.success(`PDF exported to Downloads folder`);
      } else {
        toast.error(result.error || "Failed to export PDF");
      }
    } catch (err) {
      toast.error("Failed to export PDF");
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
    exportPDF,
  };
}
