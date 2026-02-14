import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId, unauthorizedResponse } from "@/lib/auth/session";
import {
  getCurrentUtcHourWindow,
  getSinceDate,
  isDueInCurrentUtcWindow,
  normalizeReminderStatus,
  REMINDER_CHANNEL,
  REMINDER_TEMPLATE,
  type ReminderPreference
} from "@/lib/notifications/reminder";

type StatusItem = {
  id: string;
  status: "sent" | "failed" | "pending";
  sentAt: string;
  channel: string;
  source: "notification_log" | "computed_pending";
};

function parseQueryNumber(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }
  return parsed;
}

export async function GET(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const limit = parseQueryNumber(searchParams.get("limit"), 5, 1, 50);
  const hours = parseQueryNumber(searchParams.get("hours"), 24, 1, 24 * 30);

  if (!limit || !hours) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "limit and hours must be valid integers in allowed range."
        }
      },
      { status: 400 }
    );
  }

  const now = new Date();
  const since = getSinceDate(now, hours);
  const window = getCurrentUtcHourWindow(now);

  const [logs, preference] = await Promise.all([
    db.notificationLog.findMany({
      where: {
        userId,
        channel: REMINDER_CHANNEL,
        template: REMINDER_TEMPLATE,
        createdAt: {
          gte: since
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    }),
    db.userPreference.findUnique({
      where: { userId },
      select: {
        reminderHourLocal: true,
        notificationsEnabled: true,
        user: {
          select: {
            timezone: true
          }
        }
      }
    })
  ]);

  const items: StatusItem[] = logs
    .map((log) => {
      const status = normalizeReminderStatus(log.status);
      if (!status || status === "pending") {
        return null;
      }

      return {
        id: log.id,
        status,
        sentAt: (log.sentAt ?? log.createdAt).toISOString(),
        channel: log.channel,
        source: "notification_log" as const
      };
    })
    .filter((item): item is StatusItem => item !== null);

  if (preference) {
    const candidate: ReminderPreference = {
      userId,
      reminderHourLocal: preference.reminderHourLocal,
      notificationsEnabled: preference.notificationsEnabled,
      timezone: preference.user.timezone
    };

    if (isDueInCurrentUtcWindow(now, candidate)) {
      const existingInWindow = await db.notificationLog.findFirst({
        where: {
          userId,
          channel: REMINDER_CHANNEL,
          template: REMINDER_TEMPLATE,
          createdAt: {
            gte: window.start,
            lt: window.end
          }
        }
      });

      if (!existingInWindow) {
        items.unshift({
          id: `pending-${userId}-${window.start.toISOString()}`,
          status: "pending",
          sentAt: window.start.toISOString(),
          channel: REMINDER_CHANNEL,
          source: "computed_pending"
        });
      }
    }
  }

  return NextResponse.json({
    items: items.slice(0, limit),
    meta: {
      limit,
      hours
    }
  });
}
