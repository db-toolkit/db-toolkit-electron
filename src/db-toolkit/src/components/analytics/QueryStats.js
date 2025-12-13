/**
 * Query statistics by type - DonutChart with enhanced visualization
 */
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { PieChart as PieChartIcon } from "lucide-react";

const COLORS = {
  SELECT: "#22C55E", // Green
  INSERT: "#3B82F6", // Blue
  UPDATE: "#F59E0B", // Orange
  DELETE: "#EF4444", // Red
  OTHER: "#8B5CF6", // Purple
};

export function QueryStats({ stats }) {
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

  if (!stats) return null;

  const data = Object.entries(stats)
    .map(([type, count]) => ({
      name: type,
      value: count,
      color: COLORS[type] || COLORS.OTHER,
    }))
    .filter((item) => item.value > 0); // Only show non-zero values

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const tooltipBg = isDark ? "#1F2937" : "#FFFFFF";
  const tooltipBorder = isDark ? "#374151" : "#E5E7EB";
  const tooltipText = isDark ? "#F3F4F6" : "#111827";

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const percent = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div
          style={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: "8px",
            padding: "8px 12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <p
            style={{
              color: tooltipText,
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            {payload[0].name}
          </p>
          <p style={{ color: tooltipText, fontSize: "14px" }}>
            Count: {payload[0].value}
          </p>
          <p
            style={{
              color: payload[0].payload.color,
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            {percent}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon
          className="text-purple-600 dark:text-purple-400"
          size={20}
        />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Query Distribution
        </h3>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: isDark ? "#9CA3AF" : "#6B7280" }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label */}
          <div className="text-center -mt-40 mb-32 pointer-events-none">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {total}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Queries
            </p>
          </div>
        </div>

        {/* Legend with Stats */}
        <div className="flex-shrink-0 w-full lg:w-auto">
          <div className="space-y-3">
            {data.map((item, index) => {
              const percentage = ((item.value / total) * 100).toFixed(1);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4 min-w-[200px]"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {item.value}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-right">
                      ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
