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

const MOCK_TRENDS_7: ApiTrendsResponse = {
  days: 7,
  data: Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().slice(0, 10),
      energy: 3 + Math.round(Math.sin(i) * 1.5),
      stress: 2 + Math.round(Math.cos(i) * 1),
      social: 3 + Math.round(Math.sin(i + 1)),
    };
  }),
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
      if (this.scenario === "empty") {
        return success({ days: 7, data: [] }) as ApiResult<T>;
      }
      return success(MOCK_TRENDS_7) as ApiResult<T>;
    }

    if (path === "/api/alerts") {
      if (this.scenario === "empty") {
        return success({ data: [] }) as ApiResult<T>;
      }
      return success(MOCK_ALERTS) as ApiResult<T>;
    }

    if (path === "/api/insights/weekly") {
      if (this.scenario === "empty") {
        return success({
          ...MOCK_INSIGHTS,
          summary: { ...MOCK_INSIGHTS.summary, checkinCount: 0, hasEnoughData: false },
          highlights: [],
          suggestions: [],
        }) as ApiResult<T>;
      }
      return success(MOCK_INSIGHTS) as ApiResult<T>;
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
      return success(
        {
          checkin: {
            ...MOCK_CHECKIN_TODAY_CHECKED.checkin!,
            ...(body as Record<string, unknown>),
          },
        },
        201,
      ) as ApiResult<T>;
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

/** Singleton mock client for UI phase */
export const mockApi = new MockApiClient();
