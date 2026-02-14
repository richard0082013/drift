"use client";

import React from "react";

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

export function ReminderStatusList({ items, loading, error }: Props) {
  return (
    <section aria-label="Reminder Delivery Status">
      <h2>Recent Reminder Status</h2>
      {loading ? <p>Loading reminder status...</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {!loading && !error && items.length === 0 ? <p>No reminder events yet.</p> : null}
      {!loading && !error && items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <p>Status: {statusLabel[item.status]}</p>
              <p>Channel: {item.channel}</p>
              <p>Time: {item.sentAt}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
