"use client";

import React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/page-feedback";

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

export function TrendChart({ period, data, loading, error, onPeriodChange }: Props) {
  return (
    <section>
      <div>
        <button type="button" aria-pressed={period === 7} onClick={() => onPeriodChange(7)}>
          7 days
        </button>
        <button type="button" aria-pressed={period === 30} onClick={() => onPeriodChange(30)}>
          30 days
        </button>
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error && data.length === 0 ? <EmptyState message="No trend data yet." /> : null}

      {!loading && !error && data.length > 0 ? (
        <ul>
          {data.map((item) => (
            <li key={item.date}>
              {item.date} E:{item.energy} S:{item.stress} C:{item.social}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
