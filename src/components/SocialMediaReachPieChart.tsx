import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface PlatformData {
  platform: string;
  views_reach?: number;
  reach?: number;
  followers?: number;
}

interface SocialMediaReachPieChartProps {
  data: PlatformData[];
}

const COLORS = ["#40b0bf", "#d2a64e", "#04d27f", "#40b0bf"];

export default function SocialMediaReachPieChart({
  data,
}: SocialMediaReachPieChartProps) {
  // Transform data to include reach values, prioritizing views_reach, then reach, then followers
  const pieData = data
    .map((platform) => {
      const reachValue =
        platform.views_reach || platform.reach || platform.followers || 0;
      return {
        name: platform.platform,
        value: reachValue,
      };
    })
    .filter((item) => item.value > 0); // Filter out platforms with no reach data

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-zinc-900 dark:bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{data.name}</p>
          <p className="text-white">
            <span className="text-zinc-400">Reach: </span>
            {data.value.toLocaleString()}
          </p>
          <p className="text-zinc-400 text-sm mt-1">
            {((data.payload.percent || 0) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if segment is large enough (>5%)
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={14}
        fontWeight="600"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-lg">
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 capitalize">
        Social Media Reach Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            stroke="#18181b"
            strokeWidth={2}
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-zinc-700 dark:text-zinc-300 text-sm">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

