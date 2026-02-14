export type ClientEventName = "checkin_submitted" | "settings_saved" | "insights_viewed";

export type ClientEventRecord = {
  name: ClientEventName;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

type EventWindow = Window & {
  __driftClientEvents?: ClientEventRecord[];
};

export function trackClientEvent(
  name: ClientEventName,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === "undefined") {
    return;
  }

  const target = window as EventWindow;
  if (!Array.isArray(target.__driftClientEvents)) {
    target.__driftClientEvents = [];
  }

  target.__driftClientEvents.push({
    name,
    timestamp: new Date().toISOString(),
    metadata
  });
}
