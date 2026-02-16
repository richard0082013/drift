# Drift Mobile API Field Mapping (Source of Truth: Current `main` Code)

## 1. Purpose

This document maps mobile screens to current backend endpoints and payload fields.
It should be used during UI implementation to avoid schema drift.

Important:
- Source of truth is runtime code under `src/app/api/**`, not older contract docs.
- Some contract docs are partially outdated (example: account deletion strategy).

## 2. Auth Model

### Web (current)
- Session cookie: `drift_session` (httpOnly, SameSite=Lax, 7-day TTL)
- Login sets cookie via `POST /api/auth/login`
- Session check via `GET /api/auth/session`

### Mobile (added)
- Bearer token: returned in login response as `accessToken`
- All API requests include `Authorization: Bearer <token>` header
- Token uses same HMAC-SHA256 signing as cookie (same secret, same TTL)
- Store in Expo SecureStore or React Native Keychain
- Backend `getSessionUserId()` checks Bearer header first, falls back to cookie

### Login response (updated)
```json
{
  "user": { "id": "user_id", "email": "user@example.com", "name": "Optional Name" },
  "accessToken": "<signed-token>",
  "tokenType": "Bearer",
  "expiresIn": 604800
}
```

Session refresh:
- No dedicated refresh endpoint in v1.
- Token TTL is 7 days. Mobile client should re-login when receiving 401.
- Future: add `/api/auth/refresh` if needed.

## 3. Common Error Shapes

Most endpoints return:
```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human-readable message"
  }
}
```

Some endpoints using `response-contract` also include:
```json
{
  "requestId": "uuid",
  "timestamp": "ISO-8601"
}
```

## 4. Screen-to-Endpoint Mapping

## 4.1 Login Screen

### POST `/api/auth/login`
Request:
```json
{
  "email": "user@example.com",
  "name": "Optional Name"
}
```

Success `200`:
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "Optional Name"
  },
  "accessToken": "<signed-token>",
  "tokenType": "Bearer",
  "expiresIn": 604800
}
```

Errors:
- `400 VALIDATION_ERROR`
- `429 RATE_LIMITED`

### GET `/api/auth/session`
Success `200`:
```json
{
  "authenticated": true,
  "session": { "userId": "user_id" },
  "requestId": "uuid",
  "timestamp": "ISO-8601"
}
```

Error `401`:
```json
{
  "error": { "code": "UNAUTHORIZED", "message": "Authentication required." },
  "requestId": "uuid",
  "timestamp": "ISO-8601"
}
```

### POST `/api/auth/logout`
Success `200`:
```json
{ "ok": true }
```

## 4.2 Today + Check-in

### GET `/api/checkins/today`
Success when no check-in:
```json
{
  "checkedInToday": false,
  "checkin": null
}
```

Success when check-in exists:
```json
{
  "checkedInToday": true,
  "checkin": {
    "id": "ck_xxx",
    "date": "YYYY-MM-DD",
    "energy": 1,
    "stress": 1,
    "social": 1,
    "keyContact": "string|null",
    "notes": "string|null",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  }
}
```

### POST `/api/checkins`
Request:
```json
{
  "date": "YYYY-MM-DD",
  "energy": 1,
  "stress": 1,
  "social": 1,
  "key_contact": "optional string"
}
```

Success `201`:
```json
{
  "checkin": {
    "id": "ck_xxx",
    "userId": "user_id",
    "date": "ISO-8601",
    "energy": 1,
    "stress": 1,
    "social": 1,
    "keyContact": "string|null"
  }
}
```

Errors:
- `400 VALIDATION_ERROR`
- `401 UNAUTHORIZED`
- `409 DUPLICATE_CHECKIN`
- `500 INTERNAL_ERROR`

> **Field naming warning:** Request body uses `key_contact` (snake_case). Response body uses `keyContact` (camelCase). DTO mappers must handle this asymmetry.

> **Date field rule:** The `date` field in POST request should be the user's local calendar date (YYYY-MM-DD), not UTC. Backend normalizes to UTC internally.

## 4.3 Trends Screen

### GET `/api/trends?days=7|30`
Success `200`:
```json
{
  "days": 7,
  "data": [
    {
      "date": "YYYY-MM-DD",
      "energy": 1,
      "stress": 1,
      "social": 1
    }
  ]
}
```

Errors:
- `400 VALIDATION_ERROR` (`days must be 7 or 30`)
- `401 UNAUTHORIZED`

## 4.4 Alerts Screen

### GET `/api/alerts`
Success `200`:
```json
{
  "data": [
    {
      "id": "al_xxx",
      "date": "YYYY-MM-DD",
      "level": "low|moderate|high",
      "message": "string",
      "reason": "string",
      "action": "string"
    }
  ]
}
```

Errors:
- `401 UNAUTHORIZED`

> **Field semantics:**
> - `reason`: Why the alert was triggered (e.g., "Stress increased 40% over 3 days")
> - `action`: What the user should do (e.g., "Consider a recovery day tomorrow")
> - `message`: General human-readable summary. Mobile UI should display `reason` + `action` as primary content. `message` can be used as a fallback or notification text.

## 4.5 Insights Screen (Weekly Summary block)

### GET `/api/insights/weekly?days=1..14`
Success `200`:
```json
{
  "weekStart": "YYYY-MM-DD",
  "weekEnd": "YYYY-MM-DD",
  "days": 7,
  "summary": {
    "checkinCount": 0,
    "alertCount": 0,
    "averages": {
      "energy": 0.0,
      "stress": 0.0,
      "social": 0.0,
      "driftIndex": 0.0
    },
    "driftLevel": "low|moderate|high",
    "hasEnoughData": true
  },
  "highlights": ["string"],
  "suggestions": ["string"],
  "requestId": "uuid",
  "timestamp": "ISO-8601"
}
```

Errors:
- `400 VALIDATION_ERROR`
- `401 UNAUTHORIZED`
- `500 INTERNAL_ERROR`

## 4.6 Reminder Settings + Status

### GET `/api/settings/reminder`
Success `200`:
```json
{
  "settings": {
    "reminderHourLocal": 20,
    "notificationsEnabled": true,
    "reminderTime": "20:00",
    "timezone": "UTC",
    "enabled": true
  },
  "requestId": "uuid",
  "timestamp": "ISO-8601"
}
```

### POST `/api/settings/reminder`
Accepted request variants:
```json
{
  "reminderHourLocal": 20,
  "notificationsEnabled": true,
  "timezone": "Asia/Shanghai"
}
```
or
```json
{
  "reminderTime": "20:00",
  "enabled": true,
  "timezone": "Asia/Shanghai"
}
```

Success shape: same as GET.

Validation constraints:
- `reminderHourLocal`: integer 0..23
- `reminderTime`: `HH:00` only
- `timezone`: must be valid IANA timezone
- must provide boolean via `notificationsEnabled` or `enabled`

> **Important:** `reminderTime` only accepts top-of-hour values (`HH:00`). Minute-level granularity is not supported. Mobile time picker must constrain selection to hours only (e.g., `08:00`, `20:00`).

### GET `/api/jobs/reminders/status?limit=5&hours=24`
Success `200`:
```json
{
  "items": [
    {
      "id": "log_or_pending_id",
      "status": "sent|failed|pending",
      "sentAt": "ISO-8601",
      "channel": "inapp",
      "source": "notification_log|computed_pending"
    }
  ],
  "meta": {
    "limit": 5,
    "hours": 24
  }
}
```

Errors:
- `400 VALIDATION_ERROR`
- `401 UNAUTHORIZED`

## 4.7 Account Actions

### GET `/api/export`
Success `200`:
- Content-Type: `text/csv; charset=utf-8`
- Headers:
  - `x-export-generated-at`
  - `x-export-record-count`
  - `x-export-version`

Error examples:
- `401 UNAUTHORIZED`
- `429 RATE_LIMITED`

> **Mobile handling:** Export returns a CSV text stream, not JSON.
> Mobile client should:
> 1. Fetch with appropriate Accept header
> 2. Save to temporary file via Expo FileSystem
> 3. Present Share Sheet for user to save/send
> Response headers `x-export-record-count` and `x-export-generated-at` can be shown as metadata before/after download.

### POST `/api/account/delete` or DELETE `/api/account/delete`
Success `200`:
```json
{
  "deleted": true,
  "strategy": "soft",
  "purgeAfter": "ISO-8601",
  "message": "Account scheduled for permanent deletion."
}
```

Errors:
- `401 UNAUTHORIZED`
- `404 ACCOUNT_NOT_FOUND`
- `429 RATE_LIMITED`
- `500 INTERNAL_ERROR`

Note:
- This is **soft delete with retention window** in current code.
- If old docs mention hard delete, current runtime behavior should win.

## 5. Mobile DTO Recommendation

Use normalized DTOs in mobile layer:
1. API raw types (`Api*`)
2. Domain view models (`Vm*`)
3. Mapper functions (`mapApi*ToVm*`)

Example:
- `ApiTrendPoint` -> `TrendPointVm`
- `ApiWeeklyInsights` -> `InsightsVm`

This keeps UI stable if backend field names evolve.

## 5.5 Subscription / Tier Model

### Current state
No subscription or tier system exists in the backend. All features are open to authenticated users.

### UI-phase strategy
Use a mock tier constant to gate Pro features:

```typescript
type Tier = "free" | "pro";
const MOCK_TIER: Tier = "free";

const PRO_FEATURES: Record<string, boolean> = {
  trends_30d: true,
  trends_90d: true,
  sensitivity_tuning: true,
  action_plan: true,
  weekly_detail: true,
  insight_history: true,
};

function isProFeature(key: string): boolean {
  return PRO_FEATURES[key] === true;
}
```

Integration-phase requirement:
Backend needs to provide user tier via one of:
- Extended session response (`GET /api/auth/session` includes tier field)
- Dedicated endpoint (`GET /api/subscription/status`)

Decision deferred to integration phase.

## 6. Contract Verification Checklist

Before integration start:
1. Confirm reminders status `channel` literal values.
2. Confirm account delete retention window copy and legal text.
3. Confirm export metadata headers in staging.
4. Confirm tier source (`session` extension vs dedicated subscription endpoint).
