/**
 * Drift Mobile API Types
 *
 * Source of truth: mobile-app/docs/api-field-mapping.md
 * These types mirror the backend response shapes exactly.
 */

// ===== AUTH =====

export type ApiUser = {
  id: string;
  email: string;
  name?: string;
};

export type ApiLoginRequest = {
  email: string;
  name?: string;
};

export type ApiLoginResponse = {
  user: ApiUser;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

export type ApiSessionResponse = {
  authenticated: boolean;
  session: { userId: string; tier: "free" | "pro" };
  requestId: string;
  timestamp: string;
};

export type ApiLogoutResponse = {
  ok: boolean;
};

// ===== CHECK-IN =====

export type ApiCheckIn = {
  id: string;
  date: string;
  energy: number;
  stress: number;
  social: number;
  keyContact?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Note: request uses snake_case `key_contact`, response uses camelCase `keyContact` */
export type ApiCheckInRequest = {
  date: string;
  energy: number;
  stress: number;
  social: number;
  key_contact?: string;
};

export type ApiCheckInResponse = {
  checkin: ApiCheckIn;
};

export type ApiCheckInTodayResponse = {
  checkedInToday: boolean;
  checkin: ApiCheckIn | null;
};

// ===== TRENDS =====

export type ApiTrendPoint = {
  date: string;
  energy: number;
  stress: number;
  social: number;
};

export type ApiTrendsResponse = {
  days: 7 | 30;
  data: ApiTrendPoint[];
};

// ===== ALERTS =====

export type ApiAlert = {
  id: string;
  date: string;
  level: "low" | "moderate" | "high";
  message: string;
  /** Why the alert was triggered */
  reason: string;
  /** What the user should do */
  action: string;
};

export type ApiAlertsResponse = {
  data: ApiAlert[];
};

// ===== INSIGHTS =====

export type ApiWeeklyInsightsSummary = {
  checkinCount: number;
  alertCount: number;
  averages: {
    energy: number | null;
    stress: number | null;
    social: number | null;
    driftIndex: number | null;
  };
  driftLevel: "low" | "moderate" | "high";
  hasEnoughData: boolean;
};

export type ApiWeeklyInsights = {
  weekStart: string;
  weekEnd: string;
  days: number;
  summary: ApiWeeklyInsightsSummary;
  highlights: string[];
  suggestions: string[];
  requestId: string;
  timestamp: string;
};

// ===== REMINDER SETTINGS =====

export type ApiReminderSettings = {
  reminderHourLocal: number;
  notificationsEnabled: boolean;
  reminderTime: string;
  timezone: string;
  enabled: boolean;
};

export type ApiReminderSettingsRequest = {
  reminderHourLocal?: number;
  reminderTime?: string;
  notificationsEnabled?: boolean;
  enabled?: boolean;
  timezone: string;
};

export type ApiReminderSettingsResponse = {
  settings: ApiReminderSettings;
  requestId: string;
  timestamp: string;
};

// ===== REMINDER STATUS =====

export type ApiReminderStatusItem = {
  id: string;
  status: "sent" | "failed" | "pending";
  sentAt: string;
  channel: "inapp";
  source: "notification_log" | "computed_pending";
};

export type ApiReminderStatusResponse = {
  items: ApiReminderStatusItem[];
  meta: {
    limit: number;
    hours: number;
  };
};

// ===== EXPORT =====

export type ApiExportMetadata = {
  generatedAt: string;
  recordCount: number;
  version: string;
};

// ===== ACCOUNT =====

export type ApiAccountDeleteResponse = {
  deleted: boolean;
  strategy: "soft";
  purgeAfter: string;
  message: string;
};

// ===== COMMON =====

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
  };
  requestId?: string;
  timestamp?: string;
};

export type DriftLevel = "low" | "moderate" | "high";

// ===== CACHE CONFIG =====

export const CACHE_TTL = {
  checkinToday: 60_000,
  trends: 300_000,
  alerts: 300_000,
  insights: 600_000,
  reminderSettings: 600_000,
} as const;
