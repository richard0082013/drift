import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId, unauthorizedResponse } from "@/lib/auth/session";

type ReminderSettings = {
  reminderTime: string;
  timezone: string;
  enabled: boolean;
};

const DEFAULT_SETTINGS: ReminderSettings = {
  reminderTime: "20:00",
  timezone: "UTC",
  enabled: true
};

const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

function toReminderTime(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function parseReminderHour(reminderTime: string): number | null {
  const match = TIME_PATTERN.exec(reminderTime);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return null;
  }
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }

  return hour;
}

function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function validationError(message: string) {
  return NextResponse.json(
    {
      error: {
        code: "VALIDATION_ERROR",
        message
      }
    },
    { status: 400 }
  );
}

export async function GET(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const [user, preference] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { timezone: true }
    }),
    db.userPreference.findUnique({
      where: { userId },
      select: {
        reminderHourLocal: true,
        notificationsEnabled: true
      }
    })
  ]);

  const reminderHour = preference?.reminderHourLocal ?? 20;

  return NextResponse.json({
    settings: {
      reminderTime: toReminderTime(reminderHour),
      timezone: user?.timezone ?? DEFAULT_SETTINGS.timezone,
      enabled: preference?.notificationsEnabled ?? DEFAULT_SETTINGS.enabled
    }
  });
}

export async function POST(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return validationError("Invalid JSON payload.");
  }

  if (!payload || typeof payload !== "object") {
    return validationError("Invalid request body.");
  }

  const candidate = payload as Partial<ReminderSettings>;

  if (typeof candidate.reminderTime !== "string") {
    return validationError("reminderTime is required.");
  }

  const reminderHour = parseReminderHour(candidate.reminderTime);
  if (reminderHour === null) {
    return validationError("reminderTime must be in HH:MM format.");
  }

  if (typeof candidate.timezone !== "string" || !candidate.timezone.trim()) {
    return validationError("timezone is required.");
  }

  const timezone = candidate.timezone.trim();
  if (!isValidTimezone(timezone)) {
    return validationError("timezone is invalid.");
  }

  if (typeof candidate.enabled !== "boolean") {
    return validationError("enabled must be boolean.");
  }

  await db.user.upsert({
    where: { id: userId },
    update: {
      timezone
    },
    create: {
      id: userId,
      email: `${userId}@local.drift`,
      name: "Drift User",
      timezone
    }
  });

  await db.userPreference.upsert({
    where: { userId },
    update: {
      reminderHourLocal: reminderHour,
      notificationsEnabled: candidate.enabled
    },
    create: {
      userId,
      reminderHourLocal: reminderHour,
      notificationsEnabled: candidate.enabled
    }
  });

  return NextResponse.json({
    settings: {
      reminderTime: toReminderTime(reminderHour),
      timezone,
      enabled: candidate.enabled
    }
  });
}
