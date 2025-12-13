/**
 * Alerts Panel Component
 * Shows active alerts, alert history, and configurable thresholds
 */
import { useState, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Settings,
  TrendingUp,
  Clock,
  X,
} from "lucide-react";

export function AlertsPanel({ analytics, onDismissAlert }) {
  const [alerts, setAlerts] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [thresholds, setThresholds] = useState({
    maxConnections: 100, // Warning when active connections exceed this count
    longRunningQueryDuration: 300, // Queries running longer than this (seconds) - 5 minutes
    slowQueryThreshold: 5, // Query execution time threshold (seconds)
    failedQueryRate: 5, // Failed queries per minute
    lockWaitTime: 1, // Lock wait time in seconds
    connectionPoolUsage: 80, // Connection pool usage percentage
    idleConnectionsMax: 50, // Maximum idle connections allowed
  });

  // Check for alerts based on current analytics
  useEffect(() => {
    if (!analytics) return;

    const newAlerts = [];
    const timestamp = new Date().toISOString();

    // Connection count alert
    if (analytics.active_connections) {
      const connectionUsage = (analytics.active_connections / 100) * 100; // Assuming max 100 connections
      if (connectionUsage > thresholds.maxConnections) {
        newAlerts.push({
          id: `conn-${timestamp}`,
          severity: "warning",
          title: "High Connection Usage",
          message: `Connection count is at ${analytics.active_connections} (${connectionUsage.toFixed(0)}% of limit)`,
          timestamp,
          value: analytics.active_connections,
          threshold: thresholds.maxConnections,
        });
      }
    }

    // Long-running queries alert
    if (
      analytics.long_running_queries &&
      analytics.long_running_queries.length > 0
    ) {
      const criticalQueries = analytics.long_running_queries.filter(
        (q) => q.duration > thresholds.longRunningQueryDuration,
      );
      if (criticalQueries.length > 0) {
        newAlerts.push({
          id: `longrun-${timestamp}`,
          severity: "error",
          title: "Long-Running Queries Detected",
          message: `${criticalQueries.length} query(ies) running longer than ${thresholds.longRunningQueryDuration}s`,
          timestamp,
          value: criticalQueries.length,
          details: criticalQueries.slice(0, 3),
        });
      }
    }

    // Blocked queries alert
    if (
      analytics.blocked_queries &&
      analytics.blocked_queries.length > thresholds.blockedQueriesMax
    ) {
      newAlerts.push({
        id: `blocked-${timestamp}`,
        severity: "error",
        title: "High Number of Blocked Queries",
        message: `${analytics.blocked_queries.length} queries are currently blocked`,
        timestamp,
        value: analytics.blocked_queries.length,
        threshold: thresholds.blockedQueriesMax,
      });
    }

    // Idle connections alert
    if (
      analytics.idle_connections &&
      analytics.idle_connections > thresholds.idleConnectionsMax
    ) {
      newAlerts.push({
        id: `idle-${timestamp}`,
        severity: "warning",
        title: "High Idle Connection Count",
        message: `${analytics.idle_connections} idle connections detected`,
        timestamp,
        value: analytics.idle_connections,
        threshold: thresholds.idleConnectionsMax,
      });
    }

    // Database size alert (if approaching limit)
    if (
      analytics.database_size &&
      analytics.database_size > 10 * 1024 * 1024 * 1024
    ) {
      // 10GB
      newAlerts.push({
        id: `size-${timestamp}`,
        severity: "info",
        title: "Large Database Size",
        message: `Database size is ${(analytics.database_size / 1024 / 1024 / 1024).toFixed(2)}GB`,
        timestamp,
        value: analytics.database_size,
      });
    }

    // Update alerts (only add new ones, keep dismissed ones out)
    setAlerts((prev) => {
      const dismissedIds = prev.filter((a) => a.dismissed).map((a) => a.id);
      const filtered = newAlerts.filter((a) => !dismissedIds.includes(a.id));
      return [...prev.filter((a) => a.dismissed), ...filtered];
    });
  }, [analytics, thresholds]);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="text-red-500" size={20} />;
      case "warning":
        return <AlertTriangle className="text-orange-500" size={20} />;
      case "info":
        return <Bell className="text-blue-500" size={20} />;
      case "success":
        return <CheckCircle className="text-green-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "warning":
        return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      default:
        return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800";
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const handleDismiss = (alertId) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a)),
    );
    if (onDismissAlert) {
      onDismissAlert(alertId);
    }
  };

  const activeAlerts = alerts.filter((a) => !a.dismissed);
  const dismissedAlerts = alerts.filter((a) => a.dismissed);

  const handleThresholdChange = (key, value) => {
    setThresholds((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="text-purple-600 dark:text-purple-400" size={24} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Alerts & Notifications
          </h2>
          {activeAlerts.length > 0 && (
            <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-red-500 rounded-full">
              {activeAlerts.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <Settings size={16} />
          <span>Configure Thresholds</span>
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Alert Thresholds
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Connections (count)
              </label>
              <input
                type="number"
                value={thresholds.maxConnections}
                onChange={(e) =>
                  handleThresholdChange("maxConnections", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Long-Running Query Duration (seconds)
              </label>
              <input
                type="number"
                value={thresholds.longRunningQueryDuration}
                onChange={(e) =>
                  handleThresholdChange(
                    "longRunningQueryDuration",
                    e.target.value,
                  )
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slow Query Threshold (seconds)
              </label>
              <input
                type="number"
                value={thresholds.slowQueryThreshold}
                onChange={(e) =>
                  handleThresholdChange("slowQueryThreshold", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Idle Connections
              </label>
              <input
                type="number"
                value={thresholds.idleConnectionsMax}
                onChange={(e) =>
                  handleThresholdChange("idleConnectionsMax", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Failed Query Rate (per minute)
              </label>
              <input
                type="number"
                value={thresholds.failedQueryRate}
                onChange={(e) =>
                  handleThresholdChange("failedQueryRate", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lock Wait Time (seconds)
              </label>
              <input
                type="number"
                value={thresholds.lockWaitTime}
                onChange={(e) =>
                  handleThresholdChange("lockWaitTime", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Connection Pool Usage (%)
              </label>
              <input
                type="number"
                value={thresholds.connectionPoolUsage}
                onChange={(e) =>
                  handleThresholdChange("connectionPoolUsage", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Active Alerts
          </h3>
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${getSeverityBg(alert.severity)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 mt-0.5">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {alert.title}
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {alert.message}
                    </p>
                    {alert.details && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <p className="font-medium mb-1">Affected queries:</p>
                        <ul className="space-y-1">
                          {alert.details.map((detail, idx) => (
                            <li key={idx} className="truncate font-mono">
                              • {detail.query} ({detail.duration}s)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <Clock size={12} />
                      <span>{formatTime(alert.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                  title="Dismiss"
                >
                  <X size={16} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
          <CheckCircle
            className="mx-auto text-green-500 mb-4"
            size={48}
            strokeWidth={1.5}
          />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            All Clear!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No active alerts at this time. Your database is running smoothly.
          </p>
        </div>
      )}

      {/* Alert History */}
      {dismissedAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Alert History (Dismissed)
          </h3>
          <div className="space-y-2">
            {dismissedAlerts.slice(-5).map((alert) => (
              <div
                key={alert.id}
                className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 opacity-60"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 opacity-50">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {alert.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {alert.message}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {formatTime(alert.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Critical
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {activeAlerts.filter((a) => a.severity === "error").length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Warnings
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {activeAlerts.filter((a) => a.severity === "warning").length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Info
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {activeAlerts.filter((a) => a.severity === "info").length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-500" size={16} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Total Today
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {alerts.length}
          </p>
        </div>
      </div>
    </div>
  );
}
