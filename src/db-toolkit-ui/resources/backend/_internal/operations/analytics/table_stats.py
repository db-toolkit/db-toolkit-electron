"""Table-level statistics."""

from utils.logger import logger
from typing import Dict, List, Any


async def get_table_stats_postgresql(connection) -> List[Dict[str, Any]]:
    """Get PostgreSQL table statistics."""
    try:
        query = """
            SELECT 
                schemaname,
                relname as tablename,
                pg_size_pretty(pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(relname))) as size,
                pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(relname)) as size_bytes,
                n_tup_ins as inserts,
                n_tup_upd as updates,
                n_tup_del as deletes,
                seq_scan + idx_scan as total_scans,
                n_live_tup as row_count
            FROM pg_stat_user_tables
            ORDER BY pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(relname)) DESC
            LIMIT 20
        """
        result = await connection.fetch(query)
        return [dict(row) for row in result]
    except Exception as e:
        logger.error(f"Analytics error in table_stats.py: {str(e)}")
        return []


async def get_table_stats_mysql(connection) -> List[Dict[str, Any]]:
    """Get MySQL table statistics."""
    try:
        query = """
            SELECT 
                table_schema,
                table_name,
                ROUND((data_length + index_length) / 1024 / 1024, 2) as size_mb,
                (data_length + index_length) as size_bytes,
                table_rows as row_count,
                ROUND(data_length / 1024 / 1024, 2) as data_size_mb,
                ROUND(index_length / 1024 / 1024, 2) as index_size_mb
            FROM information_schema.TABLES
            WHERE table_schema = DATABASE()
            ORDER BY (data_length + index_length) DESC
            LIMIT 20
        """
        result = await connection.fetch(query)
        return [dict(row) for row in result]
    except Exception as e:
        logger.error(f"Analytics error in table_stats.py: {str(e)}")
        return []


async def get_table_stats_mongodb(connection) -> List[Dict[str, Any]]:
    """Get MongoDB collection statistics."""
    try:
        collections = await connection.list_collection_names()
        stats = []
        
        for coll_name in collections[:20]:
            coll_stats = await connection.command('collStats', coll_name)
            stats.append({
                'collection': coll_name,
                'size_bytes': coll_stats.get('size', 0),
                'row_count': coll_stats.get('count', 0),
                'index_count': coll_stats.get('nindexes', 0),
                'avg_obj_size': coll_stats.get('avgObjSize', 0)
            })
        
        return sorted(stats, key=lambda x: x['size_bytes'], reverse=True)
    except Exception as e:
        logger.error(f"Analytics error in table_stats.py: {str(e)}")
        return []


async def get_table_stats_sqlite(connection) -> List[Dict[str, Any]]:
    """Get SQLite table statistics."""
    try:
        query = """
            SELECT 
                name as table_name,
                (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND tbl_name=m.name) as index_count
            FROM sqlite_master m
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
            LIMIT 20
        """
        result = await connection.fetch(query)
        
        stats = []
        for row in result:
            try:
                count_query = f"SELECT COUNT(*) as count FROM {row['table_name']}"
                count_result = await connection.fetchrow(count_query)
                stats.append({
                    'table_name': row['table_name'],
                    'row_count': count_result['count'] if count_result else 0,
                    'index_count': row['index_count']
                })
            except Exception:
                pass
        
        return stats
    except Exception as e:
        logger.error(f"Analytics error in table_stats.py: {str(e)}")
        return []
