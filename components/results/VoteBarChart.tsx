"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import type { ResultParticipant } from "@/lib/results";

type VoteBarChartProps = {
  participants: ResultParticipant[];
};

const BAR_COLORS = ["#6366f1", "#818cf8", "#a5b4fc", "#4f46e5", "#c7d2fe"];

export function VoteBarChart({ participants }: VoteBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const chartData = participants.map((participant) => ({
    id: participant.id,
    name: participant.name,
    votes: participant.voteCount,
  }));

  const chartHeight = Math.max(chartData.length * 56 + 48, 160);
  const maxVotes = Math.max(...chartData.map((row) => row.votes), 1);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => {
      setWidth(element.getBoundingClientRect().width);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full min-w-0"
      style={{ height: chartHeight }}
    >
      {width > 0 ? (
        <BarChart
          width={width}
          height={chartHeight}
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 40, left: 8, bottom: 8 }}
        >
          <CartesianGrid
            horizontal={false}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="3 3"
          />
          <XAxis
            type="number"
            domain={[0, maxVotes]}
            allowDecimals={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={128}
            tick={{ fill: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="votes" radius={[0, 8, 8, 0]} barSize={28}>
            {chartData.map((row, index) => (
              <Cell key={row.id} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
            <LabelList
              dataKey="votes"
              position="right"
              className="fill-text-muted text-sm font-semibold"
            />
          </Bar>
        </BarChart>
      ) : null}
    </div>
  );
}
