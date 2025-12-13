/**
 * Analytics statistics cards with sparklines and trends
 */
import { Activity, Zap, Clock, HardDrive } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";

export function AnalyticsStats({ analytics, history = [] }) {
  const [previousStats, setPreviousStats] = useState(null);

  useEffect(() => {
    // Store previous stats for comparison
    if (analytics && !previousStats) {
      setPreviousStats(analytics);
    }
  }, [analytics, previousStats]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Generate sparkline data from history
  const getSparklineData = (metric) => {
    if (!history || history.length === 0) {
      return Array(10).fill({ value: analytics[metric] || 0 });
    }
    return history
      .slice(-10)
      .map((h) => ({ value: h[metric] || h.connections || 0 }));
  };

  // Calculate query metrics
  const totalQueries = analytics.query_stats
    ? Object.values(analytics.query_stats).reduce(
        (sum, count) => sum + count,
        0,
      )
    : 0;

  const stats = [
    {
      label: "Active Connections",
      value: analytics.active_connections,
      previousValue: previousStats?.active_connections,
      icon: Activity,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      sparklineData: getSparklineData("connections"),
      sparklineColor: "#22C55E",
    },
    {
      label: "Idle Connections",
      value: analytics.idle_connections,
      previousValue: previousStats?.idle_connections,
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      sparklineData: getSparklineData("idle_connections"),
      sparklineColor: "#3B82F6",
    },
    {
      label: "Total Queries",
      value: totalQueries,
      previousValue: previousStats?.query_stats
        ? Object.values(previousStats.query_stats).reduce(
            (sum, count) => sum + count,
            0,
          )
        : 0,
      icon: Zap,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      sparklineData: Array(10).fill({ value: totalQueries }),
      sparklineColor: "#A855F7",
    },
    {
      label: "Database Size",
      value: formatBytes(analytics.database_size),
      numericValue: analytics.database_size,
      previousValue: previousStats?.database_size,
      icon: HardDrive,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      sparklineData: getSparklineData("database_size"),
      sparklineColor: "#F97316",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`${stat.color}`} size={24} />
              </div>
            </div>

            {/* Sparkline */}
            <div className="h-12 -mx-2 -mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stat.sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={stat.sparklineColor}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
