import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SocialMediaChartProps {
  data: Array<{
    platform: string;
    growth_percentage: number;
    followers: number;
  }>;
}

const COLORS = ["#40b0bf", "#d2a64e", "#04d27f", "#40b0bf"];

export default function SocialMediaChart({ data }: SocialMediaChartProps) {
  // Find the max value excluding Instagram (which has 7300% growth)
  const normalPlatforms = data.filter((item) => item.growth_percentage < 1000);
  const maxNormalValue = Math.max(
    ...normalPlatforms.map((item) => item.growth_percentage),
    100
  );

  // Set domain to show normal platforms well, with some padding
  const yAxisDomain = [0, Math.ceil(maxNormalValue * 1.2)];

  // Transform data to cap Instagram for visual display but show actual in tooltip
  const chartData = data.map((item) => ({
    ...item,
    displayValue:
      item.growth_percentage > 1000 ? yAxisDomain[1] : item.growth_percentage,
    isCapped: item.growth_percentage > 1000,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 dark:bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{data.platform}</p>
          <p className="text-white">
            <span className="text-zinc-400">Growth: </span>
            {data.growth_percentage.toLocaleString()}%
            {data.isCapped && (
              <span className="text-yellow-400 text-sm ml-2">(off-scale)</span>
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-lg">
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 capitalize">
        Social Media Growth
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis
            dataKey="platform"
            stroke="#6b7280"
            style={{ fontSize: "14px" }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: "14px" }}
            domain={yAxisDomain}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="displayValue" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.isCapped ? "#fbbf24" : COLORS[index % COLORS.length]
                }
                style={{ opacity: entry.isCapped ? 0.7 : 1 }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {chartData.some((item) => item.isCapped) && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 text-center">
          * Instagram growth (7,300%) shown capped for scale comparison
        </p>
      )}
    </div>
  );
}
