"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { buildLoginHref, isLoggedIn } from "@/lib/auth/client-auth";
import {
  ReminderStatusList,
  type ReminderDeliveryStatus,
  type ReminderStatusItem
} from "@/components/reminder-status-list";

type ReminderSettings = {
  reminderTime: string;
  timezone: string;
  enabled: boolean;
};

const DEFAULT_SETTINGS: ReminderSettings = {
  reminderTime: "09:00",
  timezone: "UTC",
  enabled: true
};

function normalizeStatus(value: unknown): ReminderDeliveryStatus | null {
  if (value === "sent" || value === "failed" || value === "pending") {
    return value;
  }

  return null;
}

function normalizeReminderStatusPayload(payload: unknown): ReminderStatusItem[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const source = payload as { items?: unknown; data?: unknown; statuses?: unknown };
  const list = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source.statuses)
      ? source.statuses
      : Array.isArray(source.data)
        ? source.data
        : [];

  return list
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as {
        id?: unknown;
        status?: unknown;
        sentAt?: unknown;
        channel?: unknown;
      };

      const status = normalizeStatus(candidate.status);
      if (!status) {
        return null;
      }
      if (typeof candidate.id !== "string" || !candidate.id) {
        return null;
      }
      if (typeof candidate.sentAt !== "string" || !candidate.sentAt) {
        return null;
      }
      if (typeof candidate.channel !== "string" || !candidate.channel) {
        return null;
      }

      return { id: candidate.id, status, sentAt: candidate.sentAt, channel: candidate.channel };
    })
    .filter((item): item is ReminderStatusItem => item !== null);
}

function isValidTime(value: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export default function SettingsPage() {
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusItems, setStatusItems] = useState<ReminderStatusItem[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function resolveSession() {
      const loggedIn = await isLoggedIn();
      if (!active) {
        return;
      }

      setAuthenticated(loggedIn);
      setAuthChecked(true);
    }

    resolveSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    let active = true;

    async function loadSettings() {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch("/api/settings/reminder", {
          method: "GET",
          headers: { accept: "application/json" },
          cache: "no-store"
        });

        if (!response.ok) {
          if (active) {
            setError("Unable to load settings.");
          }
          return;
        }

        const payload = (await response.json()) as {
          settings?: Partial<ReminderSettings>;
        };

        if (active && payload.settings) {
          setSettings({
            reminderTime: payload.settings.reminderTime ?? DEFAULT_SETTINGS.reminderTime,
            timezone: payload.settings.timezone ?? DEFAULT_SETTINGS.timezone,
            enabled:
              typeof payload.settings.enabled === "boolean"
                ? payload.settings.enabled
                : DEFAULT_SETTINGS.enabled
          });
        }
      } catch {
        if (active) {
          setError("Unable to load settings.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    let active = true;

    async function loadReminderStatuses() {
      setStatusLoading(true);
      setStatusError(null);

      try {
        const response = await fetch("/api/jobs/reminders/status?limit=5", {
          method: "GET",
          headers: { accept: "application/json" },
          cache: "no-store"
        });

        if (!response.ok) {
          if (active) {
            setStatusItems([]);
            setStatusError("Reminder status is unavailable.");
          }
          return;
        }

        const payload = (await response.json()) as unknown;
        const normalized = normalizeReminderStatusPayload(payload);
        if (active) {
          setStatusItems(normalized);
        }
      } catch {
        if (active) {
          setStatusItems([]);
          setStatusError("Reminder status is unavailable.");
        }
      } finally {
        if (active) {
          setStatusLoading(false);
        }
      }
    }

    loadReminderStatuses();

    return () => {
      active = false;
    };
  }, [authenticated]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isValidTime(settings.reminderTime)) {
      setError("Reminder time must be in HH:MM format.");
      return;
    }

    if (!settings.timezone.trim()) {
      setError("Timezone is required.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/settings/reminder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        setError("Unable to save settings.");
        return;
      }

      setSuccess("Settings saved.");
    } catch {
      setError("Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (!authChecked) {
    return <main><p>Checking authentication...</p></main>;
  }

  if (!authenticated) {
    return (
      <main>
        <h1>Reminder Settings</h1>
        <p role="alert">Please log in to continue.</p>
        <Link href={buildLoginHref(pathname ?? "/settings", "/settings")}>Go to login</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Reminder Settings</h1>
      <p>Set reminder time, timezone, and notification preference.</p>
      {loading ? <p>Loading settings...</p> : null}
      <form onSubmit={onSubmit}>
        <label>
          Reminder Time
          <input
            aria-label="Reminder Time"
            type="time"
            value={settings.reminderTime}
            onChange={(event) =>
              setSettings((prev) => ({ ...prev, reminderTime: event.target.value }))
            }
          />
        </label>
        <label>
          Timezone
          <input
            aria-label="Timezone"
            value={settings.timezone}
            onChange={(event) => setSettings((prev) => ({ ...prev, timezone: event.target.value }))}
          />
        </label>
        <label>
          Enable Reminders
          <input
            aria-label="Enable Reminders"
            type="checkbox"
            checked={settings.enabled}
            onChange={(event) => setSettings((prev) => ({ ...prev, enabled: event.target.checked }))}
          />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
      <ReminderStatusList items={statusItems} loading={statusLoading} error={statusError} />
      {error ? <p role="alert">{error}</p> : null}
      {success ? <p>{success}</p> : null}
    </main>
  );
}
