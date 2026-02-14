import { db } from "@/lib/db";

type AuditPayload = {
  action: string;
  actorId: string;
  status: "success" | "failed" | "rate_limited";
  target?: string;
  meta?: Record<string, unknown>;
};

function buildAuditActorEmail(actorId: string) {
  const encoded = Buffer.from(actorId, "utf8").toString("base64url").slice(0, 40) || "actor";
  return `audit-${encoded}@local.drift`;
}

export async function writeAuditLog(payload: AuditPayload) {
  try {
    await db.user.upsert({
      where: { id: payload.actorId },
      update: {},
      create: {
        id: payload.actorId,
        email: buildAuditActorEmail(payload.actorId),
        name: "Audit Actor"
      }
    });

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
