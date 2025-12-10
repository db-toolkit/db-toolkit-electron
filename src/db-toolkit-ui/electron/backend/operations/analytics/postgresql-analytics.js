/**
 * PostgreSQL-specific analytics operations.
 */

async function getPostgreSQLAnalytics(connector) {
  try {
    const currentQueriesSql = `
      SELECT pid, usename, application_name, 
             CAST(client_addr AS TEXT) as client_addr, 
             state, query, 
             query_start::TEXT as query_start, 
             state_change::TEXT as state_change,
             CAST(EXTRACT(EPOCH FROM (NOW() - query_start)) AS FLOAT) as duration,
             CASE 
               WHEN query ILIKE 'SELECT%' THEN 'SELECT'
               WHEN query ILIKE 'INSERT%' THEN 'INSERT'
               WHEN query ILIKE 'UPDATE%' THEN 'UPDATE'
               WHEN query ILIKE 'DELETE%' THEN 'DELETE'
               ELSE 'OTHER'
             END as query_type
      FROM pg_stat_activity
      WHERE state NOT IN ('idle', '') AND query NOT LIKE '%pg_stat_activity%'
      ORDER BY query_start DESC
      LIMIT 50
    `;
    const currentQueriesResult = await connector.connection.query(currentQueriesSql);
    const currentQueries = currentQueriesResult.rows;

    const queryStats = { SELECT: 0, INSERT: 0, UPDATE: 0, DELETE: 0, OTHER: 0 };
    for (const q of currentQueries) {
      queryStats[q.query_type]++;
    }

    const idleSql = "SELECT COUNT(*) as count FROM pg_stat_activity WHERE state = 'idle'";
    const idleResult = await connector.connection.query(idleSql);
    const idleConnections = idleResult.rows[0]?.count || 0;

    const longRunningSql = `
      SELECT pid, usename, application_name, 
             CAST(EXTRACT(EPOCH FROM (NOW() - query_start)) AS FLOAT) as duration,
             query, query_start::TEXT as query_start
      FROM pg_stat_activity
      WHERE state = 'active' 
        AND query_start < NOW() - INTERVAL '30 seconds'
        AND query NOT LIKE '%pg_stat_activity%'
      ORDER BY query_start
      LIMIT 20
    `;
    const longRunningResult = await connector.connection.query(longRunningSql);
    const longRunning = longRunningResult.rows;

    const blockedSql = `
      SELECT blocked_locks.pid AS blocked_pid,
             blocked_activity.usename AS blocked_user,
             blocking_locks.pid AS blocking_pid,
             blocking_activity.usename AS blocking_user,
             blocked_activity.query AS blocked_query,
             blocking_activity.query AS blocking_query
      FROM pg_catalog.pg_locks blocked_locks
      JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
      JOIN pg_catalog.pg_locks blocking_locks 
          ON blocking_locks.locktype = blocked_locks.locktype
          AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
          AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
          AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
          AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
          AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
          AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
          AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
          AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
          AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
          AND blocking_locks.pid != blocked_locks.pid
      JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
      WHERE NOT blocked_locks.granted
      LIMIT 20
    `;
    const blockedResult = await connector.connection.query(blockedSql);
    const blockedQueries = blockedResult.rows;

    const sizeSql = 'SELECT pg_database_size(current_database()) as size';
    const sizeResult = await connector.connection.query(sizeSql);
    const dbSize = sizeResult.rows[0]?.size || 0;

    const activeSql = "SELECT COUNT(*) as count FROM pg_stat_activity WHERE state = 'active'";
    const activeResult = await connector.connection.query(activeSql);
    const activeConnections = activeResult.rows[0]?.count || 0;

    return {
      success: true,
      current_queries: currentQueries,
      idle_connections: idleConnections,
      long_running_queries: longRunning,
      blocked_queries: blockedQueries,
      database_size: dbSize,
      active_connections: activeConnections,
      query_stats: queryStats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('PostgreSQL analytics error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { getPostgreSQLAnalytics };
