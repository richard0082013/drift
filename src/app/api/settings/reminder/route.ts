import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";
import { createRequestMeta, errorJson, successJson } from "@/lib/http/response-contract";

type ReminderSettings = {
  reminderHourLocal: number;
  notificationsEnabled: boolean;
  reminderTime: string;
  timezone: string;
  enabled: boolean;
};

const DEFAULT_SETTINGS: ReminderSettings = {
  reminderHourLocal: 20,
  notificationsEnabled: true,
  reminderTime: "20:00",
  timezone: "UTC",
  enabled: true
};

const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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

  if (minutes !== 0) {
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

function validationError(message: string, request: Request) {
  return errorJson("VALIDATION_ERROR", message, createRequestMeta(request), 400);
}

function toReminderSettings(reminderHourLocal: number, timezone: string, notificationsEnabled: boolean) {
  const safeHour =
    Number.isInteger(reminderHourLocal) && reminderHourLocal >= 0 && reminderHourLocal <= 23
      ? reminderHourLocal
      : DEFAULT_SETTINGS.reminderHourLocal;
  const safeTimezone = isValidTimezone(timezone) ? timezone : DEFAULT_SETTINGS.timezone;
  const safeEnabled = typeof notificationsEnabled === "boolean" ? notificationsEnabled : true;

  return {
    reminderHourLocal: safeHour,
    notificationsEnabled: safeEnabled,
    reminderTime: toReminderTime(safeHour),
    timezone: safeTimezone,
    enabled: safeEnabled
  };
}

export async function GET(request: Request) {
  const meta = createRequestMeta(request);
  const userId = getSessionUserId(request);
  if (!userId) {
    return errorJson("UNAUTHORIZED", "Authentication required.", meta, 401);
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

  const reminderHourLocal = preference?.reminderHourLocal ?? DEFAULT_SETTINGS.reminderHourLocal;
  const notificationsEnabled =
    preference?.notificationsEnabled ?? DEFAULT_SETTINGS.notificationsEnabled;
  const timezone = user?.timezone ?? DEFAULT_SETTINGS.timezone;

  return successJson(
    {
      settings: toReminderSettings(reminderHourLocal, timezone, notificationsEnabled)
    },
    meta
  );
}

export async function POST(request: Request) {
  const meta = createRequestMeta(request);
  const userId = getSessionUserId(request);
  if (!userId) {
    return errorJson("UNAUTHORIZED", "Authentication required.", meta, 401);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return validationError("Invalid JSON payload.", request);
  }

  if (!isRecord(payload)) {
    return validationError("Invalid request body.", request);
  }

  const candidate = payload as Partial<ReminderSettings>;

  let reminderHourLocal: number | null = null;
  if (typeof candidate.reminderHourLocal === "number") {
    if (
      Number.isInteger(candidate.reminderHourLocal) &&
      candidate.reminderHourLocal >= 0 &&
      candidate.reminderHourLocal <= 23
    ) {
      reminderHourLocal = candidate.reminderHourLocal;
    } else {
      return validationError("reminderHourLocal must be an integer between 0 and 23.", request);
    }
  }

  if (reminderHourLocal === null && typeof candidate.reminderTime === "string") {
    reminderHourLocal = parseReminderHour(candidate.reminderTime);
    if (reminderHourLocal === null) {
      return validationError("reminderTime must be in HH:00 format.", request);
    }
  }

  if (reminderHourLocal === null) {
    return validationError("reminderHourLocal or reminderTime is required.", request);
  }

  let notificationsEnabled: boolean | null = null;
  if (typeof candidate.notificationsEnabled === "boolean") {
    notificationsEnabled = candidate.notificationsEnabled;
  } else if (typeof candidate.enabled === "boolean") {
    notificationsEnabled = candidate.enabled;
  } else {
    return validationError("notificationsEnabled or enabled must be boolean.", request);
  }

  const existingUser = await db.user.findUnique({
    where: { id: userId },
    select: { timezone: true }
  });

  let timezone = existingUser?.timezone ?? DEFAULT_SETTINGS.timezone;
  if (typeof candidate.timezone === "string") {
    if (!candidate.timezone.trim()) {
      return validationError("timezone is required.", request);
    }

    const normalizedTimezone = candidate.timezone.trim();
    if (!isValidTimezone(normalizedTimezone)) {
      return validationError("timezone is invalid.", request);
    }
    timezone = normalizedTimezone;
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
      reminderHourLocal,
      notificationsEnabled
    },
    create: {
      userId,
      reminderHourLocal,
      notificationsEnabled
    }
  });

  return successJson(
    {
      settings: toReminderSettings(reminderHourLocal, timezone, notificationsEnabled)
    },
    meta
  );
}
