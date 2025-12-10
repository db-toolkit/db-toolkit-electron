/**
 * MySQL-specific analytics operations.
 */

async function getMySQLAnalytics(connection) {
  try {
    const currentQueriesSql = `
      SELECT ID as pid, USER as usename, HOST as client_addr,
             DB as database_name, COMMAND as state, 
             TIME as duration, INFO as query,
             CASE 
               WHEN INFO LIKE 'SELECT%' THEN 'SELECT'
               WHEN INFO LIKE 'INSERT%' THEN 'INSERT'
               WHEN INFO LIKE 'UPDATE%' THEN 'UPDATE'
               WHEN INFO LIKE 'DELETE%' THEN 'DELETE'
               ELSE 'OTHER'
             END as query_type
      FROM information_schema.PROCESSLIST
      WHERE COMMAND != 'Sleep' AND INFO IS NOT NULL
      ORDER BY TIME DESC
      LIMIT 50
    `;
    const [currentQueries] = await connection.query(currentQueriesSql);

    const queryStats = { SELECT: 0, INSERT: 0, UPDATE: 0, DELETE: 0, OTHER: 0 };
    for (const q of currentQueries) {
      queryStats[q.query_type || 'OTHER']++;
    }

    const idleSql = "SELECT COUNT(*) as count FROM information_schema.PROCESSLIST WHERE COMMAND = 'Sleep'";
    const [idleResult] = await connection.query(idleSql);
    const idleConnections = idleResult[0]?.count || 0;

    const longRunningSql = `
      SELECT ID as pid, USER as usename, 
             TIME as duration, INFO as query
      FROM information_schema.PROCESSLIST
      WHERE COMMAND != 'Sleep' AND TIME > 30
      ORDER BY TIME DESC
      LIMIT 20
    `;
    const [longRunning] = await connection.query(longRunningSql);

    let blockedQueries = [];
    try {
      const blockedSql = `
        SELECT 
          r.trx_id AS blocked_trx,
          r.trx_mysql_thread_id AS blocked_pid,
          r.trx_query AS blocked_query,
          b.trx_id AS blocking_trx,
          b.trx_mysql_thread_id AS blocking_pid,
          b.trx_query AS blocking_query,
          CONCAT(ru.USER, '@', ru.HOST) AS blocked_user,
          CONCAT(bu.USER, '@', bu.HOST) AS blocking_user
        FROM information_schema.INNODB_LOCK_WAITS w
        JOIN information_schema.INNODB_TRX b ON b.trx_id = w.blocking_trx_id
        JOIN information_schema.INNODB_TRX r ON r.trx_id = w.requesting_trx_id
        LEFT JOIN information_schema.PROCESSLIST ru ON ru.ID = r.trx_mysql_thread_id
        LEFT JOIN information_schema.PROCESSLIST bu ON bu.ID = b.trx_mysql_thread_id
        LIMIT 20
      `;
      const [blocked] = await connection.query(blockedSql);
      blockedQueries = blocked;
    } catch (error) {
      // Fallback for older MySQL versions
    }

    const sizeSql = `
      SELECT SUM(data_length + index_length) as size
      FROM information_schema.TABLES
      WHERE table_schema = DATABASE()
    `;
    const [sizeResult] = await connection.query(sizeSql);
    const dbSize = sizeResult[0]?.size || 0;

    const activeSql = "SELECT COUNT(*) as count FROM information_schema.PROCESSLIST WHERE COMMAND != 'Sleep'";
    const [activeResult] = await connection.query(activeSql);
    const activeConnections = activeResult[0]?.count || 0;

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
    console.error('MySQL analytics error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { getMySQLAnalytics };
