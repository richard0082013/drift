export const REMINDER_CHANNEL = "in_app";
export const REMINDER_TEMPLATE = "daily_reminder";

export type ReminderPreference = {
  userId: string;
  reminderHourLocal: number;
  notificationsEnabled: boolean;
  timezone: string;
};

function safeTimeZone(timezone: string): string {
  return timezone?.trim() || "UTC";
}

function getHourInTimeZone(now: Date, timezone: string): number | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: safeTimeZone(timezone),
      hour: "2-digit",
      hourCycle: "h23"
    });
    const hourPart = formatter
      .formatToParts(now)
      .find((part) => part.type === "hour")?.value;

    if (!hourPart) {
      return null;
    }

    const hour = Number(hourPart);
    return Number.isInteger(hour) ? hour : null;
  } catch {
    return null;
  }
}

export function getLocalDateKey(now: Date, timezone: string): string | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: safeTimeZone(timezone),
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return formatter.format(now);
  } catch {
    return null;
  }
}

export function isDueInCurrentUtcWindow(now: Date, preference: ReminderPreference): boolean {
  if (!preference.notificationsEnabled) {
    return false;
  }

  if (!Number.isInteger(preference.reminderHourLocal)) {
    return false;
  }

  const localHour = getHourInTimeZone(now, preference.timezone);
  if (localHour === null) {
    return false;
  }

  return localHour === preference.reminderHourLocal;
}

export function getCurrentUtcHourWindow(now: Date) {
  const start = new Date(now);
  start.setUTCMinutes(0, 0, 0);
  const end = new Date(start);
  end.setUTCHours(end.getUTCHours() + 1);
  return { start, end };
}
