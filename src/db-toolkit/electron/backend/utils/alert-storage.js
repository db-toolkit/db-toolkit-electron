/**
 * Alert storage management for database monitoring alerts.
 */

const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const crypto = require("crypto");

// Default thresholds for database metrics
const DEFAULT_THRESHOLDS = {
  maxConnections: 100, // Warning when active connections exceed this count
  longRunningQueryDuration: 300, // Queries running longer than this (seconds) - 5 minutes
  slowQueryThreshold: 5, // Query execution time threshold (seconds)
  failedQueryRate: 5, // Failed queries per minute
  lockWaitTime: 1, // Lock wait time in seconds
  connectionPoolUsage: 80, // Connection pool usage percentage
  idleConnectionsMax: 50, // Maximum idle connections allowed
};

const DEFAULT_CONFIG = {
  notifications_enabled: true,
  email_enabled: false,
  email_recipients: [],
  webhook_url: null,
  max_alerts_history: 1000,
  alert_cooldown_minutes: 5, // Don't re-alert for same metric within this time
  severity_levels: {
    info: true,
    warning: true,
    critical: true,
  },
};

class AlertStorage {
  constructor(storagePath = null) {
    this.storagePath =
      storagePath || path.join(os.homedir(), ".db-toolkit", "alerts.json");
  }

  async ensureStorageDir() {
    const dir = path.dirname(this.storagePath);
    await fs.mkdir(dir, { recursive: true });
  }

  /**
   * Read the entire alerts data structure
   */
  async readAlertsData() {
    try {
      await this.ensureStorageDir();
      const data = await fs.readFile(this.storagePath, "utf-8");
      const parsed = JSON.parse(data);

      return {
        thresholds: { ...DEFAULT_THRESHOLDS, ...(parsed.thresholds || {}) },
        alerts: parsed.alerts || [],
        config: { ...DEFAULT_CONFIG, ...(parsed.config || {}) },
      };
    } catch (error) {
      if (error.code === "ENOENT") {
        return {
          thresholds: { ...DEFAULT_THRESHOLDS },
          alerts: [],
          config: { ...DEFAULT_CONFIG },
        };
      }
      throw error;
    }
  }

  /**
   * Write the entire alerts data structure
   */
  async writeAlertsData(data) {
    await this.ensureStorageDir();
    await fs.writeFile(
      this.storagePath,
      JSON.stringify(data, null, 2),
      "utf-8",
    );
  }

  /**
   * Get all thresholds
   */
  async getThresholds() {
    const data = await this.readAlertsData();
    return data.thresholds;
  }

  /**
   * Get a specific threshold value
   */
  async getThreshold(metricName) {
    const thresholds = await this.getThresholds();
    return thresholds[metricName] !== undefined ? thresholds[metricName] : null;
  }

  /**
   * Update one or more thresholds
   */
  async updateThresholds(updates) {
    const data = await this.readAlertsData();
    data.thresholds = { ...data.thresholds, ...updates };
    await this.writeAlertsData(data);
    return data.thresholds;
  }

  /**
   * Reset thresholds to defaults
   */
  async resetThresholds() {
    const data = await this.readAlertsData();
    data.thresholds = { ...DEFAULT_THRESHOLDS };
    await this.writeAlertsData(data);
    return data.thresholds;
  }

  /**
   * Add a new alert to history
   */
  async addAlert(
    metricType,
    severity,
    value,
    threshold,
    connectionId = null,
    message = null,
  ) {
    const data = await this.readAlertsData();

    const alert = {
      id: crypto.randomUUID(),
      metric_type: metricType,
      severity, // 'info', 'warning', 'critical'
      value,
      threshold,
      connection_id: connectionId,
      message: message || `${metricType} exceeded threshold`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      acknowledged_at: null,
      acknowledged_by: null,
    };

    data.alerts.unshift(alert); // Add to beginning for chronological order

    // Trim alerts if exceeding max history
    if (data.alerts.length > data.config.max_alerts_history) {
      data.alerts = data.alerts.slice(0, data.config.max_alerts_history);
    }

    await this.writeAlertsData(data);
    return alert;
  }

  /**
   * Get all alerts
   */
  async getAllAlerts(filters = {}) {
    const data = await this.readAlertsData();
    let alerts = data.alerts;

    // Apply filters
    if (filters.connectionId) {
      alerts = alerts.filter((a) => a.connection_id === filters.connectionId);
    }
    if (filters.severity) {
      alerts = alerts.filter((a) => a.severity === filters.severity);
    }
    if (filters.acknowledged !== undefined) {
      alerts = alerts.filter((a) => a.acknowledged === filters.acknowledged);
    }
    if (filters.metricType) {
      alerts = alerts.filter((a) => a.metric_type === filters.metricType);
    }
    if (filters.limit) {
      alerts = alerts.slice(0, filters.limit);
    }

    return alerts;
  }

  /**
   * Get a specific alert by ID
   */
  async getAlert(alertId) {
    const data = await this.readAlertsData();
    return data.alerts.find((a) => a.id === alertId) || null;
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId, acknowledgedBy = "user") {
    const data = await this.readAlertsData();
    const alert = data.alerts.find((a) => a.id === alertId);

    if (!alert) {
      return null;
    }

    alert.acknowledged = true;
    alert.acknowledged_at = new Date().toISOString();
    alert.acknowledged_by = acknowledgedBy;

    await this.writeAlertsData(data);
    return alert;
  }

  /**
   * Acknowledge multiple alerts at once
   */
  async acknowledgeMultipleAlerts(alertIds, acknowledgedBy = "user") {
    const data = await this.readAlertsData();
    const acknowledgedAlerts = [];

    alertIds.forEach((alertId) => {
      const alert = data.alerts.find((a) => a.id === alertId);
      if (alert && !alert.acknowledged) {
        alert.acknowledged = true;
        alert.acknowledged_at = new Date().toISOString();
        alert.acknowledged_by = acknowledgedBy;
        acknowledgedAlerts.push(alert);
      }
    });

    if (acknowledgedAlerts.length > 0) {
      await this.writeAlertsData(data);
    }

    return acknowledgedAlerts;
  }

  /**
   * Delete an alert
   */
  async deleteAlert(alertId) {
    const data = await this.readAlertsData();
    const originalLength = data.alerts.length;
    data.alerts = data.alerts.filter((a) => a.id !== alertId);

    if (data.alerts.length < originalLength) {
      await this.writeAlertsData(data);
      return true;
    }
    return false;
  }

  /**
   * Delete multiple alerts
   */
  async deleteMultipleAlerts(alertIds) {
    const data = await this.readAlertsData();
    const originalLength = data.alerts.length;
    data.alerts = data.alerts.filter((a) => !alertIds.includes(a.id));

    if (data.alerts.length < originalLength) {
      await this.writeAlertsData(data);
      return originalLength - data.alerts.length;
    }
    return 0;
  }

  /**
   * Clear all alerts
   */
  async clearAllAlerts() {
    const data = await this.readAlertsData();
    const count = data.alerts.length;
    data.alerts = [];
    await this.writeAlertsData(data);
    return count;
  }

  /**
   * Clear acknowledged alerts
   */
  async clearAcknowledgedAlerts() {
    const data = await this.readAlertsData();
    const originalLength = data.alerts.length;
    data.alerts = data.alerts.filter((a) => !a.acknowledged);

    if (data.alerts.length < originalLength) {
      await this.writeAlertsData(data);
      return originalLength - data.alerts.length;
    }
    return 0;
  }

  /**
   * Clear old alerts (older than specified days)
   */
  async clearOldAlerts(daysOld = 30) {
    const data = await this.readAlertsData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const originalLength = data.alerts.length;
    data.alerts = data.alerts.filter(
      (a) => new Date(a.timestamp) >= cutoffDate,
    );

    if (data.alerts.length < originalLength) {
      await this.writeAlertsData(data);
      return originalLength - data.alerts.length;
    }
    return 0;
  }

  /**
   * Get alert configuration
   */
  async getConfig() {
    const data = await this.readAlertsData();
    return data.config;
  }

  /**
   * Update alert configuration
   */
  async updateConfig(updates) {
    const data = await this.readAlertsData();
    data.config = { ...data.config, ...updates };
    await this.writeAlertsData(data);
    return data.config;
  }

  /**
   * Reset configuration to defaults
   */
  async resetConfig() {
    const data = await this.readAlertsData();
    data.config = { ...DEFAULT_CONFIG };
    await this.writeAlertsData(data);
    return data.config;
  }

  /**
   * Get alert statistics
   */
  async getAlertStats() {
    const data = await this.readAlertsData();

    const stats = {
      total: data.alerts.length,
      unacknowledged: data.alerts.filter((a) => !a.acknowledged).length,
      acknowledged: data.alerts.filter((a) => a.acknowledged).length,
      by_severity: {
        info: data.alerts.filter((a) => a.severity === "info").length,
        warning: data.alerts.filter((a) => a.severity === "warning").length,
        critical: data.alerts.filter((a) => a.severity === "critical").length,
      },
      by_metric: {},
    };

    // Count by metric type
    data.alerts.forEach((alert) => {
      const metric = alert.metric_type;
      stats.by_metric[metric] = (stats.by_metric[metric] || 0) + 1;
    });

    return stats;
  }

  /**
   * Check if an alert should be triggered (cooldown logic)
   */
  async shouldTriggerAlert(metricType, connectionId = null) {
    const data = await this.readAlertsData();
    const cooldownMinutes = data.config.alert_cooldown_minutes || 5;
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - cooldownMinutes);

    // Check for recent unacknowledged alerts of the same type
    const recentAlert = data.alerts.find(
      (a) =>
        a.metric_type === metricType &&
        (!connectionId || a.connection_id === connectionId) &&
        !a.acknowledged &&
        new Date(a.timestamp) >= cutoffTime,
    );

    return !recentAlert; // Only trigger if no recent alert exists
  }
}

const alertStorage = new AlertStorage();

module.exports = {
  AlertStorage,
  alertStorage,
  DEFAULT_THRESHOLDS,
  DEFAULT_CONFIG,
};
