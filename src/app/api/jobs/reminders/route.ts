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
  let skippedCount = 0;

  for (const due of dueUsers) {
    const existing = await db.notificationLog.findFirst({
      where: {
        userId: due.userId,
        channel: REMINDER_CHANNEL,
        template: REMINDER_TEMPLATE,
        sentAt: {
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
    await db.notificationLog.create({
      data: {
        userId: due.userId,
        channel: REMINDER_CHANNEL,
        template: REMINDER_TEMPLATE,
        status: "sent",
        payloadJson: {
          type: "reminder",
          localDate,
          timezone: due.timezone,
          reminderHourLocal: due.reminderHourLocal
        },
        sentAt: now
      }
    });
    sentCount += 1;
  }

  return NextResponse.json({
    utcWindowStart: window.start.toISOString(),
    utcWindowEnd: window.end.toISOString(),
    candidateCount: candidates.length,
    dueCount: dueUsers.length,
    sentCount,
    skippedCount
  });
}
