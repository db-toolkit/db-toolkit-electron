/**
 * Analytics charts with Recharts - Enhanced with AreaChart
 */
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

export function AnalyticsCharts({ history, timeRange }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  if (!history || history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No historical data available
        </p>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const chartData = history.map((item) => ({
    time: formatTime(item.timestamp),
    connections: item.connections,
  }));

  const gridColor = isDark ? "#374151" : "#E5E7EB";
  const axisColor = isDark ? "#9CA3AF" : "#6B7280";
  const tooltipBg = isDark ? "#1F2937" : "#FFFFFF";
  const tooltipBorder = isDark ? "#374151" : "#E5E7EB";
  const tooltipText = isDark ? "#F3F4F6" : "#111827";

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="text-green-600 dark:text-green-400" size={20} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Database Connections Over Time
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Live</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorConnections" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="time"
            stroke={axisColor}
            tick={{ fontSize: 12, fill: axisColor }}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke={axisColor}
            tick={{ fontSize: 12, fill: axisColor }}
            label={{
              value: "Connections",
              angle: -90,
              position: "insideLeft",
              style: { fill: axisColor, fontSize: 12 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "8px",
              color: tooltipText,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            labelStyle={{
              color: tooltipText,
              fontWeight: "bold",
              marginBottom: "4px",
            }}
            cursor={{
              stroke: "#22C55E",
              strokeWidth: 1,
              strokeDasharray: "5 5",
            }}
          />
          <Legend wrapperStyle={{ paddingTop: "10px" }} iconType="circle" />
          <Area
            type="monotone"
            dataKey="connections"
            stroke="#22C55E"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorConnections)"
            name="Active Connections"
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
