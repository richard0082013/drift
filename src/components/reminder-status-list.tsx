"use client";

import React from "react";
import { Card, CardBody } from "@/components/ui/card";

export type ReminderDeliveryStatus = "sent" | "failed" | "pending";

export type ReminderStatusItem = {
  id: string;
  status: ReminderDeliveryStatus;
  sentAt: string;
  channel: string;
};

type Props = {
  items: ReminderStatusItem[];
  loading: boolean;
  error: string | null;
};

const statusLabel: Record<ReminderDeliveryStatus, string> = {
  sent: "Sent",
  failed: "Failed",
  pending: "Pending"
};

const statusDotColor: Record<ReminderDeliveryStatus, string> = {
  sent: "bg-sage-500",
  failed: "bg-rose-500",
  pending: "bg-amber-500"
};

export function ReminderStatusList({ items, loading, error }: Props) {
  return (
    <section aria-label="Reminder Delivery Status" className="space-y-3">
      <h2 className="text-lg font-heading font-semibold text-slate-700">Recent Reminder Status</h2>

      {loading ? (
        <p className="text-sm text-slate-500">Loading reminder status...</p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-rose-500">
          {error}
        </p>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <p className="text-sm text-slate-500">No reminder events yet.</p>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <Card>
          <CardBody className="divide-y divide-cream-100">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${statusDotColor[item.status]}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Status: {statusLabel[item.status]}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>Channel: {item.channel}</span>
                  <span>Time: {item.sentAt}</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}
    </section>
  );
}
