"use client";

import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { buildLoginHref, isLoggedIn } from "@/lib/auth/client-auth";
import {
  ReminderStatusList,
  type ReminderDeliveryStatus,
  type ReminderStatusItem
} from "@/components/reminder-status-list";
import { AuthRequiredState, ErrorState, LoadingState } from "@/components/page-feedback";
import { trackClientEvent } from "@/lib/metrics/client-events";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

function normalizeReminderSettings(payload: unknown): ReminderSettings {
  if (!payload || typeof payload !== "object") {
    return DEFAULT_SETTINGS;
  }

  const source = payload as { settings?: Partial<ReminderSettings> };
  const settings = source.settings ?? {};

  const reminderTime =
    typeof settings.reminderTime === "string"
      ? settings.reminderTime
      : DEFAULT_SETTINGS.reminderTime;

  const timezone = typeof settings.timezone === "string" ? settings.timezone : DEFAULT_SETTINGS.timezone;
  const enabled =
    typeof settings.enabled === "boolean"
      ? settings.enabled
      : DEFAULT_SETTINGS.enabled;

  return { reminderTime, timezone, enabled };
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

        const payload = (await response.json()) as unknown;

        if (active) {
          setSettings(normalizeReminderSettings(payload));
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
        body: JSON.stringify({
          reminderTime: settings.reminderTime,
          timezone: settings.timezone,
          enabled: settings.enabled
        })
      });

      if (!response.ok) {
        setError("Unable to save settings.");
        return;
      }

      setSuccess("Settings saved.");
      trackClientEvent("settings_saved", {
        timezone: settings.timezone,
        enabled: settings.enabled
      });
    } catch {
      setError("Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (!authChecked) {
    return <main><LoadingState /></main>;
  }

  if (!authenticated) {
    return (
      <main className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-slate-800">Reminder Settings</h1>
        <AuthRequiredState loginHref={buildLoginHref(pathname ?? "/settings", "/settings")} />
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-800">Reminder Settings</h1>
        <p className="mt-1 text-sm font-body text-slate-600">
          Set reminder time, timezone, and notification preference.
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <Card>
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1">
                <label htmlFor="reminder-time" className="block text-sm font-medium text-slate-600">
                  Reminder Time
                </label>
                <input
                  id="reminder-time"
                  aria-label="Reminder Time"
                  type="time"
                  value={settings.reminderTime}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, reminderTime: event.target.value }))
                  }
                  className="w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-coral-500 focus:ring-1 focus:ring-coral-500 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="timezone" className="block text-sm font-medium text-slate-600">
                  Timezone
                </label>
                <input
                  id="timezone"
                  aria-label="Timezone"
                  value={settings.timezone}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, timezone: event.target.value }))
                  }
                  className="w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-coral-500 focus:ring-1 focus:ring-coral-500 outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="enable-reminders"
                  aria-label="Enable Reminders"
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, enabled: event.target.checked }))
                  }
                  className="h-5 w-5 rounded border-cream-200 text-coral-500 focus:ring-coral-500"
                />
                <label htmlFor="enable-reminders" className="text-sm font-medium text-slate-700">
                  Enable Reminders
                </label>
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? "Submitting..." : "Save Settings"}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {error ? <ErrorState message={error} /> : null}

      {success ? (
        <div className="flex items-center gap-2 rounded-lg bg-sage-500/10 px-4 py-3">
          <svg
            className="h-5 w-5 shrink-0 text-sage-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <p className="text-sm font-medium text-sage-500">{success}</p>
        </div>
      ) : null}

      <ReminderStatusList items={statusItems} loading={statusLoading} error={statusError} />
    </main>
  );
}
