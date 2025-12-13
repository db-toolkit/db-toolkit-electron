/**
 * Analytics charts with Recharts - Enhanced pgAdmin-style graph
 */
import {
  LineChart,
  Line,
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

  // Format time based on time range
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);

    if (!timeRange || typeof timeRange !== "string") {
      // Default format
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }

    // Parse time range (e.g., "15m", "30m", "1h", "3h")
    const rangeValue = parseInt(timeRange);
    const rangeUnit = timeRange.replace(/[0-9]/g, "");

    if (rangeUnit === "m") {
      // For minute ranges (15m, 30m), show time with seconds
      if (rangeValue <= 30) {
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } else {
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } else if (rangeUnit === "h") {
      // For hour ranges (1h, 3h), show hour and minute
      if (rangeValue >= 3) {
        // For 3+ hours, might span different hours, show hour:minute
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      }
    }

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate Y-axis domain to handle edge cases
  const calculateYAxisDomain = () => {
    const values = history.map((item) => item.connections || 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    // If all values are 0 or very close
    if (maxValue === 0) {
      return [0, 10];
    }

    // If range is very small (e.g., all values are 1)
    if (maxValue === minValue) {
      return [0, Math.max(maxValue + 5, 10)];
    }

    // Add 20% padding to top for better visualization
    const padding = Math.ceil(maxValue * 0.2);
    return [0, maxValue + padding];
  };

  // Calculate tick interval to show integer values only
  const calculateTickInterval = () => {
    const values = history.map((item) => item.connections || 0);
    const maxValue = Math.max(...values);

    if (maxValue <= 10) return 1;
    if (maxValue <= 20) return 2;
    if (maxValue <= 50) return 5;
    if (maxValue <= 100) return 10;
    if (maxValue <= 200) return 20;
    if (maxValue <= 500) return 50;
    return 100;
  };

  const chartData = history.map((item) => ({
    time: formatTime(item.timestamp),
    timestamp: item.timestamp,
    connections: item.connections || 0,
  }));

  const yAxisDomain = calculateYAxisDomain();
  const tickInterval = calculateTickInterval();

  const gridColor = isDark ? "#374151" : "#E5E7EB";
  const axisColor = isDark ? "#9CA3AF" : "#6B7280";
  const tooltipBg = isDark ? "#1F2937" : "#FFFFFF";
  const tooltipBorder = isDark ? "#374151" : "#E5E7EB";
  const tooltipText = isDark ? "#F3F4F6" : "#111827";
  const lineColor = "#3B82F6"; // Blue like pgAdmin

  // Determine tick count based on data length
  const calculateXAxisTicks = () => {
    if (chartData.length <= 10) return "preserveEnd";
    if (chartData.length <= 30) return Math.floor(chartData.length / 5);
    return Math.floor(chartData.length / 10);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="text-blue-600 dark:text-blue-400" size={20} />
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
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke={axisColor}
            tick={{ fontSize: 11, fill: axisColor }}
            interval={calculateXAxisTicks()}
            tickLine={{ stroke: axisColor }}
            axisLine={{ stroke: axisColor }}
          />
          <YAxis
            stroke={axisColor}
            tick={{ fontSize: 11, fill: axisColor }}
            tickLine={{ stroke: axisColor }}
            axisLine={{ stroke: axisColor }}
            domain={yAxisDomain}
            allowDecimals={false}
            ticks={Array.from(
              { length: Math.floor(yAxisDomain[1] / tickInterval) + 1 },
              (_, i) => i * tickInterval,
            )}
            label={{
              value: "Active Connections",
              angle: -90,
              position: "insideLeft",
              style: {
                fill: axisColor,
                fontSize: 12,
                textAnchor: "middle",
              },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "8px",
              color: tooltipText,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              padding: "8px 12px",
            }}
            labelStyle={{
              color: tooltipText,
              fontWeight: "600",
              marginBottom: "4px",
              fontSize: "12px",
            }}
            itemStyle={{
              color: tooltipText,
              fontSize: "12px",
            }}
            cursor={{
              stroke: lineColor,
              strokeWidth: 1,
              strokeDasharray: "5 5",
            }}
            formatter={(value) => [`${value} connections`, "Active"]}
          />
          <Legend
            wrapperStyle={{ paddingTop: "10px" }}
            iconType="line"
            iconSize={14}
          />
          <Line
            type="monotone"
            dataKey="connections"
            stroke={lineColor}
            strokeWidth={2}
            dot={{
              r: 3,
              fill: lineColor,
              strokeWidth: 2,
              stroke: "#FFFFFF",
            }}
            activeDot={{
              r: 5,
              fill: lineColor,
              strokeWidth: 2,
              stroke: "#FFFFFF",
            }}
            name="Active Connections"
            animationDuration={300}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
