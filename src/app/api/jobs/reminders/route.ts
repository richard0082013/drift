import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getCurrentUtcHourWindow,
  getLocalDateKey,
  isDueInCurrentUtcWindow,
  REMINDER_CHANNEL,
  REMINDER_TEMPLATE,
  type ReminderPreference
} from "@/lib/notifications/reminder";
import { sendReminder } from "@/lib/notifications/provider";
import { trackMetricEvent } from "@/lib/metrics/events";

export async function POST() {
  const now = new Date();
  const window = getCurrentUtcHourWindow(now);

  const preferences = await db.userPreference.findMany({
    where: { notificationsEnabled: true },
    select: {
      userId: true,
      reminderHourLocal: true,
      notificationsEnabled: true,
      user: {
        select: {
          timezone: true
        }
      }
    }
  });

  const candidates: ReminderPreference[] = preferences.map((item) => ({
    userId: item.userId,
    reminderHourLocal: item.reminderHourLocal,
    notificationsEnabled: item.notificationsEnabled,
    timezone: item.user.timezone
  }));

  const dueUsers = candidates.filter((item) => isDueInCurrentUtcWindow(now, item));

  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const due of dueUsers) {
    const existing = await db.notificationLog.findFirst({
      where: {
        userId: due.userId,
        channel: REMINDER_CHANNEL,
        template: REMINDER_TEMPLATE,
        createdAt: {
          gte: window.start,
          lt: window.end
        }
      }
    });

    if (existing) {
      skippedCount += 1;
      continue;
    }

    const localDate = getLocalDateKey(now, due.timezone) ?? "unknown";
    try {
      const dispatch = await sendReminder({
        userId: due.userId,
        timezone: due.timezone,
        localDate,
        reminderHourLocal: due.reminderHourLocal
      });

      await db.notificationLog.create({
        data: {
          userId: due.userId,
          channel: REMINDER_CHANNEL,
          template: REMINDER_TEMPLATE,
          status: "sent",
          payloadJson: {
            type: "reminder",
            provider: dispatch.provider,
            delivered: dispatch.delivered,
            messageId: dispatch.messageId ?? null,
            localDate,
            timezone: due.timezone,
            reminderHourLocal: due.reminderHourLocal
          },
          sentAt: now
        }
      });
      await trackMetricEvent({
        event: "reminder.dispatch",
        actorId: due.userId,
        status: "success",
        target: due.userId,
        properties: {
          provider: dispatch.provider,
          localDate
        }
      });
      sentCount += 1;
    } catch (error) {
      await db.notificationLog.create({
        data: {
          userId: due.userId,
          channel: REMINDER_CHANNEL,
          template: REMINDER_TEMPLATE,
          status: "failed",
          payloadJson: {
            type: "reminder",
            provider: "unknown",
            localDate,
            timezone: due.timezone,
            reminderHourLocal: due.reminderHourLocal,
            error: error instanceof Error ? error.message : "Unknown error"
          },
          sentAt: null
        }
      });
      await trackMetricEvent({
        event: "reminder.dispatch",
        actorId: due.userId,
        status: "failed",
        target: due.userId,
        properties: {
          localDate,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      });
      failedCount += 1;
    }
  }

  return NextResponse.json({
    utcWindowStart: window.start.toISOString(),
    utcWindowEnd: window.end.toISOString(),
    candidateCount: candidates.length,
    dueCount: dueUsers.length,
    sentCount,
    failedCount,
    skippedCount
  });
}
