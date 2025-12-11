/**
 * PDF export for analytics metrics.
 */

const fs = require('fs').promises;
const path = require('path');

async function generateAnalyticsPDF(connectionName, metrics, historicalData, slowQueries, tableStats) {
  // Read HTML template
  const templatePath = path.join(__dirname, '../../templates/analytics-report.html');
  let html = await fs.readFile(templatePath, 'utf-8');
  // Replace placeholders
  html = html.replace('{{CONNECTION_NAME}}', escapeHtml(connectionName));
  html = html.replace('{{TIMESTAMP}}', new Date().toLocaleString());
  html = html.replace('{{ACTIVE_CONNECTIONS}}', metrics.active_connections || 0);
  html = html.replace('{{IDLE_CONNECTIONS}}', metrics.idle_connections || 0);
  html = html.replace('{{DATABASE_SIZE}}', formatBytes(metrics.database_size || 0));
  html = html.replace('{{TOTAL_TABLES}}', tableStats?.length || 0);
  
  // Query stats
  const queryStats = metrics.query_stats || {};
  const queryStatsHtml = Object.entries(queryStats)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => `
      <div class="metric-card">
        <div class="metric-label">${escapeHtml(type)}</div>
        <div class="metric-value">${count}</div>
      </div>
    `).join('');
  html = html.replace('{{QUERY_STATS}}', queryStatsHtml || '<p>No query statistics available</p>');
  
  // Current queries
  const currentQueries = metrics.current_queries || [];
  const currentQueriesHtml = currentQueries.slice(0, 10).map(q => `
    <tr>
      <td>${q.pid || 'N/A'}</td>
      <td>${escapeHtml(q.usename || q.user || 'N/A')}</td>
      <td>${formatDuration(q.duration || 0)}</td>
      <td><span class="badge badge-info">${escapeHtml(q.state || 'active')}</span></td>
      <td><div class="query-text">${escapeHtml(truncateText(q.query, 100))}</div></td>
    </tr>
  `).join('');
  html = html.replace('{{CURRENT_QUERIES}}', currentQueriesHtml || '<tr><td colspan="5">No active queries</td></tr>');
  
  // Slow queries
  const slowQueriesHtml = (slowQueries || []).slice(0, 20).map(q => `
    <tr>
      <td>${q.timestamp?.slice(0, 19) || 'N/A'}</td>
      <td>${escapeHtml(q.user || 'N/A')}</td>
      <td><span class="badge badge-warning">${formatDuration(q.duration)}</span></td>
      <td><div class="query-text">${escapeHtml(truncateText(q.query, 100))}</div></td>
    </tr>
  `).join('');
  html = html.replace('{{SLOW_QUERIES}}', slowQueriesHtml || '<tr><td colspan="4">No slow queries recorded</td></tr>');
  
  // Table stats
  const tableStatsHtml = (tableStats || []).slice(0, 20).map(t => {
    const tableName = t.tablename || t.table_name || t.collection || 'N/A';
    const size = typeof t.size === 'number' ? formatBytes(t.size) : t.size || 'N/A';
    const rows = t.row_count || t.n_live_tup || 0;
    const indexSize = t.index_size ? formatBytes(t.index_size) : 'N/A';
    return `
      <tr>
        <td>${escapeHtml(tableName)}</td>
        <td>${size}</td>
        <td>${rows.toLocaleString()}</td>
        <td>${indexSize}</td>
      </tr>
    `;
  }).join('');
  html = html.replace('{{TABLE_STATS}}', tableStatsHtml || '<tr><td colspan="4">No table statistics available</td></tr>');
  
  // Historical summary
  let historicalSummary = 'No historical data available';
  if (historicalData && historicalData.length > 0) {
    const latest = historicalData[historicalData.length - 1];
    historicalSummary = `${historicalData.length} data points collected. Latest: ${latest.active_connections || 0} active connections, ${formatBytes(latest.database_size || 0)} database size`;
  }
  html = html.replace('{{HISTORICAL_SUMMARY}}', historicalSummary);
  
  return html;
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

function formatDuration(seconds) {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = { generateAnalyticsPDF };
