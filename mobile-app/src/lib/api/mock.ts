/**
 * Mock API Client
 *
 * Drives all screen states deterministically during UI development phase.
 * Controllable via MockApiClient.scenario property.
 */

import type { ApiClient, ApiResult } from "./client";
import type {
  ApiLoginResponse,
  ApiSessionResponse,
  ApiCheckInTodayResponse,
  ApiCheckInResponse,
  ApiTrendsResponse,
  ApiAlertsResponse,
  ApiWeeklyInsights,
  ApiReminderSettingsResponse,
  ApiReminderStatusResponse,
  ApiAccountDeleteResponse,
} from "../../types/api";

type Scenario = "success" | "error" | "empty" | "loading";

const MOCK_DELAY = 800;

function delay(ms: number = MOCK_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function success<T>(data: T, status = 200): ApiResult<T> {
  return { ok: true, data, status };
}

function error(code: string, message: string, status = 500): ApiResult<never> {
  return { ok: false, error: { code, message }, status };
}

// ── Mock Data ──

const MOCK_USER = { id: "user_mock_1", email: "demo@drift.local", name: "Demo User" };
const MOCK_TOKEN = "mock-bearer-token-xxxx";

const MOCK_LOGIN_RESPONSE: ApiLoginResponse = {
  user: MOCK_USER,
  accessToken: MOCK_TOKEN,
  tokenType: "Bearer",
  expiresIn: 604800,
};

const MOCK_SESSION: ApiSessionResponse = {
  authenticated: true,
  session: { userId: MOCK_USER.id },
  requestId: "req_mock_1",
  timestamp: new Date().toISOString(),
};

const MOCK_CHECKIN_TODAY_UNCHECKED: ApiCheckInTodayResponse = {
  checkedInToday: false,
  checkin: null,
};

const MOCK_CHECKIN_TODAY_CHECKED: ApiCheckInTodayResponse = {
  checkedInToday: true,
  checkin: {
    id: "ck_mock_1",
    date: new Date().toISOString().slice(0, 10),
    energy: 4,
    stress: 2,
    social: 3,
    keyContact: "Mom",
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const MOCK_ALERTS: ApiAlertsResponse = {
  data: [
    {
      id: "al_mock_1",
      date: new Date().toISOString().slice(0, 10),
      level: "moderate",
      message: "Your stress has been trending upward.",
      reason: "Stress increased 40% over the last 3 days",
      action: "Consider a recovery day tomorrow",
    },
    {
      id: "al_mock_2",
      date: new Date().toISOString().slice(0, 10),
      level: "low",
      message: "Social engagement is slightly low.",
      reason: "Social score below average for 5 days",
      action: "Reach out to a friend or family member today",
    },
  ],
};

const MOCK_INSIGHTS: ApiWeeklyInsights = {
  weekStart: (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10); })(),
  weekEnd: new Date().toISOString().slice(0, 10),
  days: 7,
  summary: {
    checkinCount: 5,
    alertCount: 2,
    averages: { energy: 3.6, stress: 2.4, social: 3.2, driftIndex: 2.8 },
    driftLevel: "low",
    hasEnoughData: true,
  },
  highlights: [
    "Your energy improved steadily over the week",
    "Stress peaked mid-week but recovered",
  ],
  suggestions: [
    "Keep maintaining your sleep routine",
    "Schedule a social activity this weekend",
  ],
  requestId: "req_mock_2",
  timestamp: new Date().toISOString(),
};

const MOCK_REMINDER_SETTINGS: ApiReminderSettingsResponse = {
  settings: {
    reminderHourLocal: 20,
    notificationsEnabled: true,
    reminderTime: "20:00",
    timezone: "America/New_York",
    enabled: true,
  },
  requestId: "req_mock_3",
  timestamp: new Date().toISOString(),
};

const MOCK_REMINDER_STATUS: ApiReminderStatusResponse = {
  items: [
    {
      id: "log_mock_1",
      status: "sent",
      sentAt: new Date().toISOString(),
      channel: "inapp",
      source: "notification_log",
    },
  ],
  meta: { limit: 5, hours: 24 },
};

// ── Mock Client ──

/** Track whether the mock user has "checked in" this session */
let mockCheckedIn = false;

export class MockApiClient implements ApiClient {
  scenario: Scenario = "success";

  async get<T>(path: string, params?: Record<string, string>): Promise<ApiResult<T>> {
    await delay();

    if (this.scenario === "error") {
      return error("INTERNAL_ERROR", "Mock error for testing") as ApiResult<T>;
    }

    if (path === "/api/auth/session") {
      return success(MOCK_SESSION) as ApiResult<T>;
    }

    if (path === "/api/checkins/today") {
      if (this.scenario === "empty" || !mockCheckedIn) {
        return success(MOCK_CHECKIN_TODAY_UNCHECKED) as ApiResult<T>;
      }
      return success(MOCK_CHECKIN_TODAY_CHECKED) as ApiResult<T>;
    }

    if (path === "/api/trends") {
      const raw = Number(params?.days ?? 7);
      if (raw !== 7 && raw !== 30) {
        return error("VALIDATION_ERROR", "days must be 7 or 30.", 400) as ApiResult<T>;
      }
      const days = raw as 7 | 30;
      if (this.scenario === "empty") {
        return success({ days, data: [] } satisfies ApiTrendsResponse) as ApiResult<T>;
      }
      // Generate data matching requested period
      const trendData = Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        return {
          date: d.toISOString().slice(0, 10),
          energy: 3 + Math.round(Math.sin(i) * 1.5),
          stress: 2 + Math.round(Math.cos(i) * 1),
          social: 3 + Math.round(Math.sin(i + 1)),
        };
      });
      return success({ days, data: trendData } satisfies ApiTrendsResponse) as ApiResult<T>;
    }

    if (path === "/api/alerts") {
      if (this.scenario === "empty") {
        return success({ data: [] }) as ApiResult<T>;
      }
      return success(MOCK_ALERTS) as ApiResult<T>;
    }

    if (path === "/api/insights/weekly") {
      const rawDays = Number(params?.days ?? 7);
      if (!Number.isInteger(rawDays) || rawDays < 1 || rawDays > 14) {
        return error("VALIDATION_ERROR", "days must be an integer between 1 and 14.", 400) as ApiResult<T>;
      }
      const days = rawDays;
      const weekEnd = new Date();
      const weekStart = new Date();
      weekStart.setDate(weekEnd.getDate() - (days - 1));
      const base = {
        weekStart: weekStart.toISOString().slice(0, 10),
        weekEnd: weekEnd.toISOString().slice(0, 10),
        days,
        requestId: "req_mock_2",
        timestamp: new Date().toISOString(),
      };
      if (this.scenario === "empty") {
        return success({
          ...base,
          summary: {
            checkinCount: 0,
            alertCount: 0,
            averages: { energy: null, stress: null, social: null, driftIndex: null },
            driftLevel: "low" as const,
            hasEnoughData: false,
          },
          highlights: [],
          suggestions: [],
        } satisfies ApiWeeklyInsights) as ApiResult<T>;
      }
      return success({
        ...base,
        summary: MOCK_INSIGHTS.summary,
        highlights: MOCK_INSIGHTS.highlights,
        suggestions: MOCK_INSIGHTS.suggestions,
      } satisfies ApiWeeklyInsights) as ApiResult<T>;
    }

    if (path === "/api/settings/reminder") {
      return success(MOCK_REMINDER_SETTINGS) as ApiResult<T>;
    }

    if (path === "/api/jobs/reminders/status") {
      return success(MOCK_REMINDER_STATUS) as ApiResult<T>;
    }

    return error("NOT_FOUND", `Mock: no handler for GET ${path}`, 404) as ApiResult<T>;
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
    await delay();

    if (this.scenario === "error") {
      return error("INTERNAL_ERROR", "Mock error for testing") as ApiResult<T>;
    }

    if (path === "/api/auth/login") {
      return success(MOCK_LOGIN_RESPONSE) as ApiResult<T>;
    }

    if (path === "/api/auth/logout") {
      mockCheckedIn = false;
      return success({ ok: true }) as ApiResult<T>;
    }

    if (path === "/api/checkins") {
      if (mockCheckedIn) {
        return {
          ok: false,
          error: { code: "DUPLICATE_CHECKIN", message: "Already checked in today" },
          status: 409,
        } as ApiResult<T>;
      }
      mockCheckedIn = true;
      // Build response using only backend-shaped fields (camelCase)
      const req = body as Record<string, unknown> | undefined;
      const now = new Date().toISOString();
      const checkinResponse: ApiCheckInResponse = {
        checkin: {
          id: `ck_${Date.now()}`,
          date: (req?.date as string) ?? now.slice(0, 10),
          energy: (req?.energy as number) ?? 3,
          stress: (req?.stress as number) ?? 3,
          social: (req?.social as number) ?? 3,
          // Backend maps snake_case key_contact → camelCase keyContact
          keyContact: (req?.key_contact as string | undefined) ?? null,
          notes: null,
          createdAt: now,
          updatedAt: now,
        },
      };
      return success(checkinResponse, 201) as ApiResult<T>;
    }

    if (path === "/api/settings/reminder") {
      return success(MOCK_REMINDER_SETTINGS) as ApiResult<T>;
    }

    if (path === "/api/account/delete") {
      const deleteResp: ApiAccountDeleteResponse = {
        deleted: true,
        strategy: "soft",
        purgeAfter: new Date(Date.now() + 30 * 86400000).toISOString(),
        message: "Account scheduled for permanent deletion.",
      };
      return success(deleteResp) as ApiResult<T>;
    }

    return error("NOT_FOUND", `Mock: no handler for POST ${path}`, 404) as ApiResult<T>;
  }

  async delete<T>(path: string): Promise<ApiResult<T>> {
    return this.post<T>(path);
  }
}
