"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface CreationDataPoint {
  date: string;
  count: number;
}

interface DistributionPoint {
  name: string;
  value: number;
  color?: string;
}

const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export function CreationTrendChart({ data }: { data: CreationDataPoint[] }) {
  if (!data || data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-zinc-400 italic">
        No prompt creation activity in the last 7 days.
      </div>
    );
  }

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="promptGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            stroke="#71717a"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#71717a"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              borderColor: "#27272a",
              borderRadius: "6px",
              fontSize: "11px",
              color: "#f4f4f5",
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#promptGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionPieChart({ data }: { data: DistributionPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-zinc-400 italic">
        No category or workspace distribution data.
      </div>
    );
  }

  return (
    <div className="h-44 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={65}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              borderColor: "#27272a",
              borderRadius: "6px",
              fontSize: "11px",
              color: "#f4f4f5",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
