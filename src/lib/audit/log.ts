import { db } from "@/lib/db";

type AuditPayload = {
  action: string;
  actorId: string;
  status: "success" | "failed" | "rate_limited";
  target?: string;
  meta?: Record<string, unknown>;
};

export async function writeAuditLog(payload: AuditPayload) {
  try {
    await db.notificationLog.create({
      data: {
        userId: payload.actorId,
        channel: "audit",
        template: payload.action,
        status: payload.status,
        payloadJson: {
          target: payload.target ?? null,
          meta: payload.meta ?? {}
        },
        sentAt: new Date()
      }
    });
  } catch {
    // audit must not block business flow
  }
}
