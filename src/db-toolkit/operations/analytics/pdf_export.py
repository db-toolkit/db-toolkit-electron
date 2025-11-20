"""PDF export for analytics metrics."""

from typing import Dict, List, Any
from datetime import datetime

from db_toolkit.utils.pdf import PDFReport, format_bytes, format_duration, truncate_text


def generate_analytics_pdf(
    connection_name: str,
    metrics: Dict[str, Any],
    historical_data: List[Dict[str, Any]],
    slow_queries: List[Dict[str, Any]],
    table_stats: List[Dict[str, Any]]
) -> bytes:
    """Generate PDF report for analytics data."""
    
    pdf = PDFReport("Database Analytics Report")
    pdf.add_title(subtitle=f"Connection: {connection_name}")
    
    # Current Metrics
    pdf.add_section("Current Metrics")
    system_stats = metrics.get('system_stats', {})
    pdf.add_metric_grid([
        {"label": "Active Connections", "value": str(metrics.get('active_connections', 0)), "color": "#10b981"},
        {"label": "Idle Connections", "value": str(metrics.get('idle_connections', 0)), "color": "#6b7280"},
        {"label": "Database Size", "value": format_bytes(metrics.get('database_size', 0)), "color": "#3b82f6"},
        {"label": "CPU Usage", "value": f"{system_stats.get('cpu_usage', 0):.1f}%", "color": "#f59e0b"},
        {"label": "Memory Usage", "value": f"{system_stats.get('memory_usage', 0):.1f}%", "color": "#8b5cf6"},
        {"label": "Disk Usage", "value": f"{system_stats.get('disk_usage', 0):.1f}%", "color": "#ec4899"},
    ])
    
    # Query Statistics
    if metrics.get('query_stats'):
        pdf.add_section("Query Distribution")
        query_data = [[qtype, str(count)] for qtype, count in metrics['query_stats'].items()]
        pdf.add_table(query_data, headers=['Query Type', 'Count'])
    
    # Slow Queries
    if slow_queries:
        pdf.add_page_break()
        pdf.add_section("Slow Query Log (Last 24 Hours)")
        slow_data = [
            [
                q['timestamp'][:19],
                format_duration(q['duration']),
                truncate_text(q['user'], 20),
                truncate_text(q['query'], 80)
            ]
            for q in slow_queries[:20]
        ]
        pdf.add_table(slow_data, headers=['Timestamp', 'Duration', 'User', 'Query'])
    
    # Table Statistics
    if table_stats:
        pdf.add_page_break()
        pdf.add_section("Table Statistics (Top 20)")
        table_data = []
        for t in table_stats[:20]:
            table_name = t.get('tablename') or t.get('table_name') or t.get('collection', 'N/A')
            size = t.get('size', 'N/A')
            if isinstance(size, (int, float)):
                size = format_bytes(int(size))
            rows = t.get('row_count', t.get('n_live_tup', 0))
            table_data.append([truncate_text(table_name, 40), str(size), str(rows)])
        pdf.add_table(table_data, headers=['Table', 'Size', 'Rows'])
    
    return pdf.build()
