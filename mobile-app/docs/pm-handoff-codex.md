# Drift Mobile App — PM Handoff & Strategic Direction for Codex

## Context

Claude (PM/Architect/Lead) is handing off to Codex due to flow limit reset.
Branch: `codex/mobile-integration-backend`, latest commit: `2918a318`.
Tasks 7–9 are APPROVED. Task 9 N1+N2 review fixes committed.

**This document serves as the PM directive** — Codex should follow these priorities in order.

---

## Current State Summary

### Completed (Tasks 7–9, all APPROVED)

| Task | Commit(s) | Scope |
|------|-----------|-------|
| Task 7: UI Skeleton + Onboarding | `3fb77a3e` | 9 screens, 12 components, 5 tabs, auth flow, offline queue, error boundary |
| Codex Backend: Tier + Seed | `f8fdc96d` | Session tier endpoint, seed script |
| Review Fixes Round 1+2 | `6bf5ce6c` | 10 findings (P0×3, P1×3, P2×4) + 1 N1 |
| Task 8: API Integration | `ce007360`, `c06d8fc7` | Real API client, 401 interceptor, tier wiring, CSV export |
| Task 9: Onboarding + Paywall | `3e866e11`, `2918a318` | Promise step, PaywallScreen, conversion triggers, navigation modal |

### Architecture (Do NOT Change)

```
ErrorBoundary
  → NetworkProvider
    → AuthProvider (tier + 401 interceptor)
      → RootNavigator
        → AuthStack [Welcome, Login]                    (not authenticated)
        → OnboardingScreen [welcome, prefs, checkin, feedback]  (not onboarded)
        → NativeStack                                   (authenticated + onboarded)
            → MainTabs [Today, Trends, Alerts, Insights, Profile]
            → PaywallScreen (modal)
```

### Key Design Decisions (Immutable)

1. **Dual API client**: `MockApiClient` (dev default) / `RealApiClient` (prod + env override)
2. **Bearer token auth** via expo-secure-store, 401 auto-logout
3. **Offline-first check-ins**: AsyncStorage queue, auto-flush on reconnect, max 3 retries
4. **Soft paywall**: Never blocks before first check-in; Day 3 teaser, Day 7 lock
5. **ProGate**: Reads tier from AuthContext (backend session), feature key based
6. **expo-file-system SDK 54 new API**: `File`, `Paths` classes (NOT legacy `cacheDirectory`)
7. **Custom SVG charts**: No heavy charting library (using react-native-svg directly)

---

## Immediate Work: Task 10 — QA Hardening

### Priority 1: Known Bug Fix (Backend)

**File:** `src/app/api/alerts/evaluate/route.ts` (line ~23)

```typescript
// BUG: Gets oldest 6 check-ins instead of newest 6
orderBy: { date: "asc" }
// FIX: Change to
orderBy: { date: "desc" }
```

**Impact:** Drift calculation uses historical data instead of current → alerts are inaccurate.
**Verify:** Run `npx vitest run tests/api/alerts-evaluate.test.ts` — may need test update too.

### Priority 2: Code Quality Audit (Mobile)

```bash
cd mobile-app
npx tsc --noEmit                    # Must be 0 errors (verified at commit time)
npx eslint src/ --ext .ts,.tsx      # If eslint configured
```

Check for:
- Unused imports in all `src/` files
- `console.log` that should be removed
- Missing `useCallback`/`useEffect` dependency arrays
- Dead code or unreachable branches

### Priority 3: Screen Edge Cases

Verify **code-level** handling (not visual QA) for each screen:

| Screen | Verify These States |
|--------|-------------------|
| TodayScreen | Empty (no check-in), already checked-in, network error, offline |
| TrendsScreen | Empty data, 7d/30d switch, error, refresh, ProGate on 30d |
| AlertsScreen | No alerts, multiple alerts, error |
| InsightsScreen | Empty, insufficient data warning, Pro-gated suggestions, conversion trigger |
| ProfileScreen | Export loading/error, logout flow |
| OnboardingScreen | 4-step flow, skip preference, check-in API error |
| PaywallScreen | Modal dismiss, upgrade link with source param |
| Login/Welcome | Auth flow, validation errors |

### Priority 4: Contract Verification

- Compare every type in `mobile-app/src/types/api.ts` against actual backend route responses
- Verify mock responses in `mobile-app/src/lib/api/mock.ts` match type contracts
- Check `satisfies` assertions are present where needed

### Priority 5: Report

Output a structured report:
```
## QA Hardening Report

### Findings
[ID] [Severity P0/P1/P2/Nit] [File:Line] [Description] [Fix Applied ✅ / Deferred ⏳]

### Tests
- tsc: PASS / FAIL
- vitest (backend): X/Y passed
- eslint: X warnings, Y errors

### Verdict: READY FOR BETA / NEEDS FIXES
```

---

## Post-Task 10: What Comes Next

After Task 10 QA, the app moves into **beta prep and feature maturation**. Here is the PM-directed priority order:

### Phase 1: Beta Build (Immediate after QA)

1. **EAS Build Setup** — Claude will handle this (requires Expo credentials)
   - `eas.json` config for development/preview/production profiles
   - TestFlight (iOS) + internal track APK (Android)
   - Codex should NOT attempt EAS builds

2. **Merge to Main** — After QA passes
   - Squash or rebase `codex/mobile-integration-backend` onto `main`
   - Claude will decide merge strategy on return

### Phase 2: Feature Maturation (v1.1 Roadmap)

Priority order for post-beta features:

#### P0: Billing Infrastructure
- **Why:** Paywall currently links to a web URL; zero revenue path exists
- **What:**
  - Add `subscription` model to Prisma schema (userId, plan, status, expiresAt, provider, providerSubId)
  - Implement `getUserTier()` to read from subscription table (currently hardcoded "free")
  - Backend: `POST /api/subscription/verify` endpoint for receipt validation
  - Mobile: Replace `Linking.openURL` in PaywallScreen with `expo-in-app-purchases` or RevenueCat SDK
  - Consider RevenueCat for cross-platform subscription management (recommended)
- **Constraint:** MUST work before Pro features have real value to users

#### P1: Push Notifications (Reminders)
- **Why:** Reminder system exists in backend but has no mobile delivery channel
- **What:**
  - `expo-notifications` for push token registration
  - Backend: Store push tokens, update reminder dispatcher to use push provider
  - Notification handling: foreground banner + tap-to-open check-in
  - Permission prompt during onboarding (after first check-in, NOT before)
- **Constraint:** Must respect user's notification preference in settings

#### P2: Drift Engine v2 (ML Upgrade)
- **Why:** Current rule-based engine (3 rules, weighted avg) is simplistic
- **What:**
  - Train a lightweight anomaly detection model on aggregated check-in patterns
  - Deploy as serverless function (not in-app)
  - Keep rule-based as fallback
  - Add "drift forecast" feature (Pro-only)
- **Constraint:** Must not increase check-in time; backend-only change

#### P3: Social Features (v2.0 territory)
- **Why:** "Key Contact" field exists but is unused
- **What:**
  - Accountability partner: share drift status with 1 trusted person
  - Emergency contact trigger on "high" drift sustained 3+ days
  - Privacy-first: opt-in, per-contact granularity
- **Constraint:** Requires new privacy review; out of v1 scope

### Phase 3: Polish & Growth

- **Deep linking**: `drift://checkin` for reminder taps
- **Widget**: iOS/Android home screen check-in widget (expo-widget, future SDK)
- **App Store assets**: Screenshots, description, keywords
- **Analytics**: Mixpanel or PostHog for funnel tracking (sign-up → first check-in → Day 7 → upgrade)

---

## File Inventory (For Reference)

### Mobile App (`mobile-app/src/`)

**Screens (9):** WelcomeScreen, LoginScreen, TodayScreen, TrendsScreen, AlertsScreen, InsightsScreen, ProfileScreen, OnboardingScreen, PaywallScreen

**Components (12):** ui/{Button, Input, Card, Badge, SegmentedControl}, ProGate, ProUpgradeCard, ErrorBoundary, LoadingState, ErrorState, EmptyState, OfflineBanner

**Lib (10):** api/{client, mock, index}, auth/{session, AuthContext}, offline/{NetworkContext, checkin-queue, index}, conversion/useConversionTrigger, export/csv-export

**Config (2):** theme.ts (design tokens), tier.ts (feature gates)

**Navigation (3):** RootNavigator, AuthStack, MainTabs

**Types (1):** api.ts (all API DTOs + cache TTL)

### Backend (Next.js `src/app/api/`)

**Endpoints:** auth/{login, logout, session}, checkins, checkins/today, trends, alerts, alerts/evaluate, insights/weekly, settings/reminder, jobs/reminders, jobs/reminders/status, export, account/delete, internal/jobs/purge-users, health

**Key Lib:** lib/auth/session.ts, lib/drift/engine.ts, lib/subscription/tier.ts (stub), lib/security/rate-limit.ts

**Tests:** 20 test files in `tests/api/`

---

## Rules for Codex

1. **Do NOT modify navigation structure** — it's been reviewed and approved across 3 rounds
2. **Do NOT add new screens or features** — focus on QA hardening only
3. **Do NOT create EAS builds** — Claude will handle on return
4. **Do NOT merge to main** — Claude decides merge strategy
5. **DO fix bugs found during audit** — commit each fix with descriptive messages
6. **DO remove dead code** — unused imports, console.logs, etc.
7. **DO fix the alerts/evaluate orderBy bug** — this is the one known backend issue
8. **DO write a structured QA report** — this is the key deliverable

---

## Verification

After Task 10 is complete:
1. `npx tsc --noEmit` in `mobile-app/` — 0 errors
2. `npx vitest run` in project root — all backend tests pass
3. No P0 or P1 findings remaining
4. QA report committed to repo
