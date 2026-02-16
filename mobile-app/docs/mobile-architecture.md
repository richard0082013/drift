# Drift Mobile Architecture Spec (Track C)

## 1. Purpose

This document defines three architecture-level mobile concerns that are prerequisites
for UI implementation: tier gating, offline strategy, and the Insights screen data flow.

These decisions were reached through a joint Claude + Codex architecture review and
must be treated as binding constraints during the UI-first phase.

---

## 2. Tier Gating System (ProGate)

### 2.1 Problem

The backend currently has no subscription or tier system. All features are open to
authenticated users. Mobile v1 needs a Free/Pro split at the UI layer to:
- Demonstrate conversion flow during UI phase
- Avoid large-scale UI rewrites when real subscription is added

### 2.2 Feature Key Enum

All Pro-gated features are identified by a fixed string key:

| Key | Description | Tier |
|-----|-------------|------|
| `trends_30d` | 30-day trend view | Pro |
| `trends_90d` | 90-day trend view | Pro (future) |
| `sensitivity_tuning` | Alert sensitivity config | Pro |
| `action_plan` | Personalized micro-action plan | Pro (future) |
| `weekly_detail` | Full weekly summary detail | Pro |
| `insight_history` | Historical insight timeline | Pro |

### 2.3 UI-Phase Implementation

```typescript
// mobile-app/src/config/tier.ts

export type Tier = "free" | "pro";

/**
 * Change this to "pro" to unlock all Pro features during development/testing.
 * Integration phase will replace this with a real tier source.
 */
export const MOCK_TIER: Tier = "free";

const PRO_FEATURES: Record<string, true> = {
  trends_30d: true,
  trends_90d: true,
  sensitivity_tuning: true,
  action_plan: true,
  weekly_detail: true,
  insight_history: true,
};

export function isProFeature(key: string): boolean {
  return key in PRO_FEATURES;
}

export function isFeatureUnlocked(key: string, tier: Tier): boolean {
  if (!isProFeature(key)) return true;
  return tier === "pro";
}
```

### 2.4 ProGate Component

```tsx
// mobile-app/src/components/ProGate.tsx

import { MOCK_TIER, isFeatureUnlocked } from "@/config/tier";

type Props = {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function ProGate({ feature, children, fallback }: Props) {
  if (isFeatureUnlocked(feature, MOCK_TIER)) {
    return <>{children}</>;
  }
  return <>{fallback ?? <ProUpgradeCard feature={feature} />}</>;
}
```

### 2.5 Usage Example

```tsx
// In Trends screen
<SegmentedControl
  options={[
    { label: "7 days", value: 7 },
    { label: "30 days", value: 30 },
  ]}
  selected={period}
  onChange={setPeriod}
/>

<ProGate feature="trends_30d">
  {/* 30-day chart renders normally when unlocked */}
  <TrendChart data={data} />
</ProGate>
```

### 2.6 Integration-Phase Migration

When real subscription is added, replace `MOCK_TIER` with a dynamic source:

- **Option A**: Extend `GET /api/auth/session` to include `tier` field
- **Option B**: Add `GET /api/subscription/status` endpoint

The `ProGate` component and `isFeatureUnlocked()` function signature remain unchanged.
Only the tier source changes.

---

## 3. Offline Strategy

### 3.1 Problem

Drift's core promise is "30 seconds per day." Mobile users may check in on subways,
planes, or in areas with poor connectivity. Without offline support, the core value
loop breaks.

### 3.2 Scope

| Capability | v1 Support | Strategy |
|-----------|-----------|----------|
| Check-in submission | Yes | Local queue + auto-sync |
| Read cached data (trends, alerts, insights) | Yes | Stale-while-revalidate |
| Reminder settings save | No | Require network |
| Account actions (export, delete) | No | Require network |

### 3.3 Network State Machine

```
                    ┌──────────┐
        app start   │          │  NetInfo: connected
       ──────────►  │  ONLINE  │ ◄──────────────────┐
                    │          │                     │
                    └────┬─────┘                     │
                         │                           │
          NetInfo: no    │                           │
          connection     │                           │
                         ▼                           │
                    ┌──────────┐                     │
                    │          │  NetInfo: connected  │
                    │ OFFLINE  │ ────────────────────►│
                    │          │   (trigger flush)    │
                    └──────────┘
```

### 3.4 Check-in Offline Queue

```typescript
// mobile-app/src/lib/offline/checkin-queue.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "drift:checkin_queue";

export type QueuedCheckin = {
  id: string;            // client-generated UUID
  date: string;          // YYYY-MM-DD (user local date)
  energy: number;        // 1-5
  stress: number;        // 1-5
  social: number;        // 1-5
  keyContact?: string;
  queuedAt: string;      // ISO-8601 timestamp
  retryCount: number;
};

export async function enqueue(checkin: Omit<QueuedCheckin, "id" | "queuedAt" | "retryCount">): Promise<void> {
  const queue = await getQueue();
  queue.push({
    ...checkin,
    id: crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
    retryCount: 0,
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueue(): Promise<QueuedCheckin[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  await AsyncStorage.setItem(
    QUEUE_KEY,
    JSON.stringify(queue.filter((item) => item.id !== id))
  );
}

export async function incrementRetry(id: string): Promise<void> {
  const queue = await getQueue();
  const item = queue.find((q) => q.id === id);
  if (item) {
    item.retryCount += 1;
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}
```

### 3.5 Queue Flush Logic

```typescript
// mobile-app/src/lib/offline/flush.ts

const MAX_RETRIES = 3;

export async function flushCheckinQueue(apiClient: ApiClient): Promise<FlushResult> {
  const queue = await getQueue();
  if (queue.length === 0) return { flushed: 0, failed: 0 };

  let flushed = 0;
  let failed = 0;

  for (const item of queue) {
    if (item.retryCount >= MAX_RETRIES) {
      // Give up after max retries — leave in queue for manual review
      failed++;
      continue;
    }

    try {
      await apiClient.submitCheckin({
        date: item.date,
        energy: item.energy,
        stress: item.stress,
        social: item.social,
        key_contact: item.keyContact,
      });
      await removeFromQueue(item.id);
      flushed++;
    } catch (error) {
      if (isDuplicateCheckinError(error)) {
        // Already submitted (e.g., from another device) — safe to remove
        await removeFromQueue(item.id);
        flushed++;
      } else {
        await incrementRetry(item.id);
        failed++;
      }
    }
  }

  return { flushed, failed };
}
```

### 3.6 Integration with NetInfo

```typescript
// In app root or navigation container
import NetInfo from "@react-native-community/netinfo";

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    setIsOnline(state.isConnected ?? false);

    if (state.isConnected) {
      // Network restored — flush queue
      flushCheckinQueue(apiClient).then((result) => {
        if (result.flushed > 0) {
          showToast(`Synced ${result.flushed} check-in(s)`);
        }
      });
    }
  });

  return () => unsubscribe();
}, []);
```

### 3.7 UI States for Offline

| Screen | Online Behavior | Offline Behavior |
|--------|----------------|-----------------|
| Today | Normal fetch + render | Show cached status + "Offline" banner |
| Check-in | Submit → API → success | Submit → local queue → success with "Will sync when online" |
| Trends | Fetch + render chart | Show last cached data + "Offline" badge on period selector |
| Alerts | Fetch + render list | Show last cached list + "Offline" badge |
| Insights | Fetch + render summary | Show last cached summary + "Offline" badge |
| Profile | Normal | Read-only; settings save disabled with tooltip |
| Reminder Settings | Normal save | Save button disabled + "Requires connection" message |
| Account Actions | Normal | Export/Delete disabled + "Requires connection" message |

### 3.8 Offline Banner Component

```tsx
// mobile-app/src/components/OfflineBanner.tsx

export function OfflineBanner({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>You're offline. Changes will sync when reconnected.</Text>
    </View>
  );
}
```

---

## 4. Insights Screen Definition

### 4.1 Context

Insights replaces the Plan tab (demoted to Future Scope) in the mobile IA.
It uses `GET /api/insights/weekly?days=7|14` — a different endpoint from Trends.

**Trends vs Insights distinction:**
- **Trends**: Raw data points → line chart visualization (`GET /api/trends`)
- **Insights**: Interpreted summary → drift assessment + recommendations (`GET /api/insights/weekly`)

### 4.2 Data Source

Endpoint: `GET /api/insights/weekly?days=7|14`

Response shape (from api-field-mapping.md §4.5):
```typescript
type WeeklyInsights = {
  weekStart: string;        // YYYY-MM-DD
  weekEnd: string;          // YYYY-MM-DD
  days: number;
  summary: {
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
  highlights: string[];
  suggestions: string[];
  requestId: string;
  timestamp: string;
};
```

### 4.3 Screen Layout

```
┌─────────────────────────────┐
│  Weekly Insights            │
│  ─────────────────────────  │
│  [  7 days  ] [ 14 days  ]  │  ← Period selector
│                             │
│  ┌─────────────────────┐    │
│  │ Window: Jan 6 – 12  │    │  ← Summary card
│  │ Check-ins: 5         │    │
│  │ Alerts: 1            │    │
│  │ Drift: ●moderate     │    │  ← Badge with color
│  │                      │    │
│  │ Energy  ████████░░  3.8│  │  ← Metric bars
│  │ Stress  ██████░░░░  2.5│  │
│  │ Social  █████████░  4.1│  │
│  │ Drift   ███████░░░  3.1│  │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ Highlights           │    │
│  │ • Energy trending up │    │
│  │ • Stress stable      │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ Suggestions          │    │  ← ProGate wraps detail
│  │ • Keep morning walks │    │
│  │ • Try 10min wind-down│    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ ⚠ Not enough data   │    │  ← Only when hasEnoughData=false
│  │ for stable trends    │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

### 4.4 States

| State | Condition | Render |
|-------|-----------|--------|
| Loading | Initial fetch in progress | Skeleton cards |
| Empty | API returns 200 but no insights data | "No weekly insights yet. Keep checking in daily." |
| Error | Network or server error | Error card with retry button |
| Loaded | Valid insights data | Full layout above |
| Insufficient data | `hasEnoughData === false` | Full layout + amber warning card at bottom |
| Offline | No network | Cached data + offline badge |

### 4.5 Pro Gating

```tsx
<ProGate feature="weekly_detail" fallback={<ProTeaser text="Unlock detailed suggestions" />}>
  <SuggestionsCard suggestions={insights.suggestions} />
</ProGate>
```

### 4.6 Acceptance Criteria

1. Period switch (7/14) triggers re-fetch and updates all cards
2. Drift level badge uses distinct colors: low=sage, moderate=amber, high=rose
3. Metric bars are proportional to value (max = 5)
4. Highlights and suggestions render as bullet lists
5. Insufficient data warning only shows when `hasEnoughData` is false
6. Empty state includes actionable guidance text
7. ProGate wraps suggestions section with upgrade CTA for Free tier

---

## 5. Cross-Cutting Concerns

### 5.1 Data Caching Strategy

Use a simple in-memory + AsyncStorage cache for stale-while-revalidate:

```typescript
type CacheEntry<T> = {
  data: T;
  fetchedAt: number;  // timestamp
  staleAfterMs: number;
};

// Stale thresholds per data type
const CACHE_TTL = {
  checkinToday: 60_000,      // 1 min (changes frequently)
  trends: 300_000,           // 5 min
  alerts: 300_000,           // 5 min
  insights: 600_000,         // 10 min
  reminderSettings: 600_000, // 10 min
};
```

### 5.2 Error Handling Hierarchy

```
API call fails
├── 401 Unauthorized → Navigate to Login screen (token expired)
├── 409 DUPLICATE_CHECKIN → Remove from queue, show "Already checked in"
├── 429 RATE_LIMITED → Show "Too many requests, try again in a moment"
├── Network error (offline) → Use cached data, show offline banner
└── Other 4xx/5xx → Show generic error with retry button
```

### 5.3 Token Lifecycle

```
App launch
├── Read token from SecureStore
├── If token exists → GET /api/auth/session to validate
│   ├── 200 → Navigate to Main tabs
│   └── 401 → Clear token, navigate to Login
└── If no token → Navigate to Welcome/Login

Login success
├── Store accessToken in SecureStore
├── Navigate to Today tab

Logout
├── POST /api/auth/logout
├── Clear token from SecureStore
├── Navigate to Welcome

401 on any API call
├── Clear token from SecureStore
├── Navigate to Login with return path
```
