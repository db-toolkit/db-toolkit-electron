"""PDF export for analytics metrics."""

from typing import Dict, List, Any
from datetime import datetime

from utils.pdf import PDFReport, format_bytes, format_duration, truncate_text


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
    
    # Debug info section
    pdf.add_section("Report Generation Info")
    pdf.add_paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    pdf.add_paragraph(f"Metrics Success: {metrics.get('success', False)}")
    pdf.add_paragraph(f"Historical Data Points: {len(historical_data)}")
    pdf.add_paragraph(f"Slow Queries: {len(slow_queries)}")
    pdf.add_paragraph(f"Table Stats: {len(table_stats)}")
    
    # Current Metrics
    pdf.add_section("Current Metrics")
    system_stats = metrics.get('system_stats', {})
    
    # Ensure we have valid values
    active_conn = metrics.get('active_connections', 0)
    idle_conn = metrics.get('idle_connections', 0)
    db_size = metrics.get('database_size', 0)
    cpu_usage = system_stats.get('cpu_usage', 0)
    memory_usage = system_stats.get('memory_usage', 0)
    disk_usage = system_stats.get('disk_usage', 0)
    
    pdf.add_metric_grid([
        {"label": "Active Connections", "value": str(active_conn), "color": "#10b981"},
        {"label": "Idle Connections", "value": str(idle_conn), "color": "#6b7280"},
        {"label": "Database Size", "value": format_bytes(db_size), "color": "#3b82f6"},
        {"label": "CPU Usage", "value": f"{cpu_usage:.1f}%", "color": "#f59e0b"},
        {"label": "Memory Usage", "value": f"{memory_usage:.1f}%", "color": "#8b5cf6"},
        {"label": "Disk Usage", "value": f"{disk_usage:.1f}%", "color": "#ec4899"},
    ])
    
    # Query Statistics
    query_stats = metrics.get('query_stats', {})
    if query_stats and any(count > 0 for count in query_stats.values()):
        pdf.add_section("Query Distribution")
        query_data = [[qtype, str(count)] for qtype, count in query_stats.items() if count > 0]
        if query_data:
            pdf.add_table(query_data, headers=['Query Type', 'Count'])
        else:
            pdf.add_paragraph("No active queries found.")
    else:
        pdf.add_section("Query Distribution")
        pdf.add_paragraph("No query statistics available.")
    
    # Current Queries
    current_queries = metrics.get('current_queries', [])
    if current_queries:
        pdf.add_section("Current Active Queries")
        current_data = []
        for q in current_queries[:10]:
            current_data.append([
                str(q.get('pid', 'N/A')),
                truncate_text(q.get('usename', 'N/A'), 15),
                q.get('state', 'N/A'),
                f"{q.get('duration', 0):.1f}s",
                truncate_text(q.get('query', 'N/A'), 60)
            ])
        if current_data:
            pdf.add_table(current_data, headers=['PID', 'User', 'State', 'Duration', 'Query'])
        else:
            pdf.add_paragraph("No current queries found.")
    
    # Slow Queries
    if slow_queries:
        pdf.add_page_break()
        pdf.add_section("Slow Query Log (Last 24 Hours)")
        slow_data = [
            [
                q.get('timestamp', 'N/A')[:19] if q.get('timestamp') else 'N/A',
                format_duration(q.get('duration', 0)),
                truncate_text(q.get('user', 'N/A'), 20),
                truncate_text(q.get('query', 'N/A'), 80)
            ]
            for q in slow_queries[:20]
        ]
        if slow_data:
            pdf.add_table(slow_data, headers=['Timestamp', 'Duration', 'User', 'Query'])
        else:
            pdf.add_paragraph("No slow queries found.")
    else:
        pdf.add_section("Slow Query Log (Last 24 Hours)")
        pdf.add_paragraph("No slow queries recorded.")
    
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
            table_data.append([truncate_text(str(table_name), 40), str(size), str(rows)])
        if table_data:
            pdf.add_table(table_data, headers=['Table', 'Size', 'Rows'])
        else:
            pdf.add_paragraph("No table statistics available.")
    else:
        pdf.add_section("Table Statistics")
        pdf.add_paragraph("No table statistics available.")
    
    return pdf.build()
