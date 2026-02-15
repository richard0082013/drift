import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type MetricEventPayload = {
  event: string;
  actorId: string;
  status: "success" | "failed" | "rate_limited";
  target?: string;
  properties?: Prisma.InputJsonObject;
};

export async function trackMetricEvent(payload: MetricEventPayload) {
  try {
    await db.notificationLog.create({
      data: {
        userId: payload.actorId,
        channel: "metrics",
        template: payload.event,
        status: payload.status,
        payloadJson: {
          target: payload.target ?? null,
          properties: payload.properties ?? {}
        },
        sentAt: new Date()
      }
    });
  } catch {
    // metrics should never block request flow
  }
}
