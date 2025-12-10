/**
 * PDF export for analytics metrics.
 */

const PDFDocument = require('pdfkit');

function generateAnalyticsPDF(connectionName, metrics, historicalData, slowQueries, tableStats) {
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  // Title with green theme
  doc.fontSize(24).fillColor('#10b981').text('Database Analytics Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).fillColor('#000').text(`Connection: ${connectionName}`, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#6b7280').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(2);
  
  // Current Metrics
  doc.fontSize(16).fillColor('#10b981').text('Current Metrics');
  doc.moveDown(0.5);
  
  const activeConn = metrics.active_connections || 0;
  const idleConn = metrics.idle_connections || 0;
  const dbSize = formatBytes(metrics.database_size || 0);
  
  doc.fontSize(10).fillColor('#000');
  doc.text(`Active Connections: ${activeConn}`);
  doc.text(`Idle Connections: ${idleConn}`);
  doc.text(`Database Size: ${dbSize}`);
  doc.moveDown();
  
  // Query Stats
  const queryStats = metrics.query_stats || {};
  if (Object.values(queryStats).some(v => v > 0)) {
    doc.fontSize(16).fillColor('#10b981').text('Query Distribution');
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#000');
    for (const [type, count] of Object.entries(queryStats)) {
      if (count > 0) doc.text(`${type}: ${count}`);
    }
    doc.moveDown();
  }
  
  // Historical Data
  if (historicalData && historicalData.length > 0) {
    doc.fontSize(16).fillColor('#10b981').text('Historical Trends');
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#000');
    doc.text(`Data points collected: ${historicalData.length}`);
    const latest = historicalData[historicalData.length - 1];
    if (latest) {
      doc.text(`Latest snapshot: ${latest.timestamp || 'N/A'}`);
      doc.text(`Active connections: ${latest.active_connections || 0}`);
      doc.text(`Database size: ${formatBytes(latest.database_size || 0)}`);
    }
    doc.moveDown();
  }
  
  // Current Queries
  const currentQueries = metrics.current_queries || [];
  if (currentQueries.length > 0) {
    doc.fontSize(16).fillColor('#10b981').text('Current Active Queries');
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#000');
    for (const q of currentQueries.slice(0, 10)) {
      doc.text(`PID: ${q.pid} | User: ${q.usename} | Duration: ${q.duration}s`);
      doc.text(`Query: ${truncateText(q.query, 80)}`);
      doc.moveDown(0.3);
    }
    doc.moveDown();
  }
  
  // Slow Queries
  if (slowQueries && slowQueries.length > 0) {
    doc.addPage();
    doc.fontSize(16).fillColor('#10b981').text('Slow Query Log (Last 24 Hours)');
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#000');
    for (const q of slowQueries.slice(0, 20)) {
      doc.text(`Time: ${q.timestamp?.slice(0, 19) || 'N/A'} | Duration: ${formatDuration(q.duration)}`);
      doc.text(`User: ${q.user} | Query: ${truncateText(q.query, 80)}`);
      doc.moveDown(0.3);
    }
  }
  
  // Table Stats
  if (tableStats && tableStats.length > 0) {
    doc.addPage();
    doc.fontSize(16).fillColor('#10b981').text('Table Statistics (Top 20)');
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#000');
    for (const t of tableStats.slice(0, 20)) {
      const tableName = t.tablename || t.table_name || t.collection || 'N/A';
      const size = typeof t.size === 'number' ? formatBytes(t.size) : t.size || 'N/A';
      const rows = t.row_count || t.n_live_tup || 0;
      doc.text(`${truncateText(tableName, 40)} | Size: ${size} | Rows: ${rows}`);
    }
  }
  
  doc.end();
  
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
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
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

module.exports = { generateAnalyticsPDF };
