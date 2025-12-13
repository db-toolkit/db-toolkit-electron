/**
 * Analytics page for database monitoring
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Database, Download } from "lucide-react";
import { useConnections, useAnalytics } from "../hooks";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../components/workspace/WorkspaceProvider";
import { Button } from "../components/common/Button";

import { AnalyticsStats } from "../components/analytics/AnalyticsStats";
import { AnalyticsCharts } from "../components/analytics/AnalyticsCharts";
import { QueryStats } from "../components/analytics/QueryStats";
import { CurrentQueries } from "../components/analytics/CurrentQueries";
import { LongRunningQueries } from "../components/analytics/LongRunningQueries";
import { BlockedQueries } from "../components/analytics/BlockedQueries";
import { QueryPlanModal } from "../components/analytics/QueryPlanModal";
import { SlowQueryLog } from "../components/analytics/SlowQueryLog";
import { TableStats } from "../components/analytics/TableStats";
import { ConnectionPoolStats } from "../components/analytics/ConnectionPoolStats";
import { pageTransition } from "../utils/animations";

function AnalyticsPage() {
  const navigate = useNavigate();
  const { connections, connectToDatabase } = useConnections();
  const { getWorkspaceState, setWorkspaceState, activeWorkspaceId } =
    useWorkspace();
  const toast = useToast();
  const [connectionId, setConnectionId] = useState(null);
  const [connectionName, setConnectionName] = useState("");
  const [connecting, setConnecting] = useState(null);

  // Sync with workspace state when workspace changes
  // Only depends on activeWorkspaceId to avoid re-running when getWorkspaceState changes
  useEffect(() => {
    const savedConnectionId = getWorkspaceState("analyticsConnectionId");
    const savedConnectionName = getWorkspaceState("analyticsConnectionName");

    // Only update if we don't already have a connectionId (prevents overwriting on re-render)
    if (!connectionId && savedConnectionId) {
      setConnectionId(savedConnectionId);
      setConnectionName(savedConnectionName || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId]);
  const [timeRange, setTimeRange] = useState(1);
  const [planModal, setPlanModal] = useState({
    isOpen: false,
    query: "",
    plan: null,
  });
  const [slowQueries, setSlowQueries] = useState([]);
  const [tableStats, setTableStats] = useState([]);
  const [poolStats, setPoolStats] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const {
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
  } = useAnalytics(connectionId);

  useEffect(() => {
    if (connectionId) {
      fetchHistoricalData(timeRange);
      loadAdditionalData();
    }
  }, [connectionId, timeRange]);

  const loadAdditionalData = async () => {
    const [slow, tables, pool] = await Promise.all([
      getSlowQueries(24),
      getTableStats(),
      getPoolStats(),
    ]);
    setSlowQueries(slow);
    setTableStats(tables);
    setPoolStats(pool);
  };

  const handleViewPlan = async (query) => {
    const result = await getQueryPlan(query);
    if (result?.success) {
      setPlanModal({ isOpen: true, query, plan: result.plan });
    }
  };

  const handleConnect = async (id) => {
    setConnecting(id);
    try {
      await connectToDatabase(id, true);
      const conn = connections.find((c) => c.id === id);
      setConnectionId(id);
      setConnectionName(conn?.name || "");
      setWorkspaceState("analyticsConnectionId", id);
      setWorkspaceState("analyticsConnectionName", conn?.name || "");
      toast.success("Connected successfully");
    } catch (err) {
      toast.error("Failed to connect");
    } finally {
      setConnecting(null);
    }
  };

  if (!connectionId) {
    if (connections.length === 0) {
      return (
        <motion.div
          className="p-8 flex items-center justify-center h-full"
          {...pageTransition}
        >
          <div className="text-center max-w-md">
            <Database className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No Connections
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create a database connection first to view analytics
            </p>
            <Button onClick={() => navigate("/connections")}>
              Create Connection
            </Button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div className="p-8" {...pageTransition}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Database Analytics
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select a connection to view analytics
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-lg hover:border-green-400 dark:hover:border-green-500 transition-all duration-200"
            >
              <div className="flex items-start gap-3 mb-4">
                <Database
                  className="text-green-600 dark:text-green-400 mt-1"
                  size={24}
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {conn.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {conn.db_type}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {conn.db_type === "sqlite"
                      ? conn.database.split("/").pop()
                      : `${conn.host}:${conn.port}`}
                  </p>
                </div>
              </div>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleConnect(conn.id)}
                disabled={connecting === conn.id}
                className="w-full !text-white"
              >
                {connecting === conn.id ? "Connecting..." : "Connect & Monitor"}
              </Button>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="h-screen flex flex-col" {...pageTransition}>
      {loading ? (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading analytics...
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Database Analytics
                  </h2>
                  <div className="flex items-center gap-2 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">
                      Live Monitoring
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {connectionName}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(Number(e.target.value))}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value={1}>Last 1 hour</option>
                  <option value={2}>Last 2 hours</option>
                  <option value={3}>Last 3 hours</option>
                </select>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download size={16} />}
                  onClick={async () => {
                    setExportingPDF(true);
                    try {
                      await exportPDF();
                    } finally {
                      setExportingPDF(false);
                    }
                  }}
                  disabled={exportingPDF}
                >
                  {exportingPDF ? "Exporting..." : "Export PDF"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setConnectionId(null);
                    setConnectionName("");
                    setWorkspaceState("analyticsConnectionId", null);
                    setWorkspaceState("analyticsConnectionName", "");
                  }}
                >
                  Change Connection
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {connectionLost ? (
              <div className="text-center py-12">
                <Database className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Connection Lost
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Database connection was lost. Redirecting to connections...
                </p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : analytics ? (
              <>
                <div className="space-y-6">
                  <AnalyticsStats analytics={analytics} history={history} />
                  <AnalyticsCharts history={history} timeRange={timeRange} />
                  {poolStats && <ConnectionPoolStats stats={poolStats} />}
                  {analytics.query_stats && (
                    <QueryStats stats={analytics.query_stats} />
                  )}
                  <CurrentQueries
                    queries={analytics.current_queries}
                    onKill={killQuery}
                    onViewPlan={handleViewPlan}
                  />
                  <LongRunningQueries
                    queries={analytics.long_running_queries}
                    onKill={killQuery}
                  />
                  <BlockedQueries queries={analytics.blocked_queries} />
                  <SlowQueryLog queries={slowQueries} />
                  <TableStats stats={tableStats} />
                </div>
                <QueryPlanModal
                  isOpen={planModal.isOpen}
                  onClose={() =>
                    setPlanModal({ isOpen: false, query: "", plan: null })
                  }
                  query={planModal.query}
                  plan={planModal.plan}
                />
              </>
            ) : null}
          </div>
        </>
      )}
    </motion.div>
  );
}

export default AnalyticsPage;
