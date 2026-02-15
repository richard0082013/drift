"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { EmptyState, ErrorState, LoadingState } from "@/components/page-feedback";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Point = {
  date: string;
  energy: number;
  stress: number;
  social: number;
};

type Props = {
  period: 7 | 30;
  data: Point[];
  loading: boolean;
  error: string | null;
  onPeriodChange: (period: 7 | 30) => void;
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white rounded-lg shadow-card-hover border border-cream-200 px-3 py-2 text-xs">
      <p className="font-medium text-slate-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="flex justify-between gap-3">
          <span>{entry.name}:</span>
          <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export function TrendChart({ period, data, loading, error, onPeriodChange }: Props) {
  const chartData = [...data].reverse();

  return (
    <section className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={period === 7 ? "primary" : "secondary"}
          size="sm"
          aria-pressed={period === 7}
          onClick={() => onPeriodChange(7)}
        >
          7 days
        </Button>
        <Button
          type="button"
          variant={period === 30 ? "primary" : "secondary"}
          size="sm"
          aria-pressed={period === 30}
          onClick={() => onPeriodChange(30)}
        >
          30 days
        </Button>
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error && data.length === 0 ? <EmptyState message="No trend data yet." /> : null}

      {!loading && !error && data.length > 0 ? (
        <Card>
          <CardBody>
            <div data-testid="trend-chart" className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FFECD4" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#8A8A9A" }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 11, fill: "#8A8A9A" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    name="Energy"
                    stroke="#E87350"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#E87350" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="stress"
                    name="Stress"
                    stroke="#E05050"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#E05050" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="social"
                    name="Social"
                    stroke="#6A9A6A"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#6A9A6A" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {/* Accessible data table for screen readers and E2E tests */}
      {!loading && !error && data.length > 0 ? (
        <details className="text-xs text-slate-400">
          <summary className="cursor-pointer hover:text-slate-600 transition-colors">View data table</summary>
          <table className="mt-2 w-full text-left text-xs" data-testid="trend-data-table">
            <thead>
              <tr className="border-b border-cream-200">
                <th className="py-1 pr-3 font-medium text-slate-500">Date</th>
                <th className="py-1 pr-3 font-medium text-slate-500">Energy</th>
                <th className="py-1 pr-3 font-medium text-slate-500">Stress</th>
                <th className="py-1 font-medium text-slate-500">Social</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.date} className="border-b border-cream-100">
                  <td className="py-1 pr-3">{item.date}</td>
                  <td className="py-1 pr-3">{item.energy}</td>
                  <td className="py-1 pr-3">{item.stress}</td>
                  <td className="py-1">{item.social}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : null}
    </section>
  );
}
