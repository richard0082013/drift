"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { buildLoginHref, isLoggedIn } from "@/lib/auth/client-auth";

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

  useEffect(() => {
    setAuthenticated(isLoggedIn());
    setAuthChecked(true);
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
      {error ? <p role="alert">{error}</p> : null}
      {success ? <p>{success}</p> : null}
    </main>
  );
}
