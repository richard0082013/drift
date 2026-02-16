# Drift Mobile v1 Execution Plan (Track D)

## 1. Overview

8-week plan with weekly milestone outputs, dependency graph, and acceptance criteria.
Derived from the joint Claude + Codex architecture review.

**Execution model:** UI-first with mock adapters → integration pass → QA hardening.

**Parallel tracks during UI phase:**
- Frontend: screens + navigation + state handling (mock data)
- Backend: Bearer auth (Track A, already in progress)
- Docs: Design amendments (Track B, queued after Track A)

---

## 2. Dependency Graph

```
Week 1 ─── Task 1: Init + Design System ──────────────────────────────┐
                                                                       │
Week 2 ─── Task 2: Navigation + Auth ─────────────────────────────────┤
               │                                                       │
               ├──────────────────────────────────────────────┐        │
               │                                               │        │
Week 3 ─── Task 3: Today + Check-in ──┐    Task 4: Trends ───┤        │
               │                       │    + Insights         │        │
               │                       │         │             │        │
Week 4 ────────┤                       │    Task 5: Alerts ───┘        │
               │                       │                                │
Week 5 ─── Task 6: Profile + ─────────┤                                │
               │  Reminders +          │                                │
               │  Account Actions      │                                │
               │                       │                                │
Week 5 ─── Task 7: Offline + ─────────┘                                │
               │  Error Handling                                        │
               │                                                        │
Week 6 ─── Task 8: API Integration Pass ──────────────────────────────┘
               │
Week 7 ─── Task 9: Onboarding + Paywall UX
               │
Week 8 ─── Task 10: QA + Beta Release
```

---

## 3. Task Definitions

### Task 1: Project Init + Design System
**Week:** 1
**Owner:** Claude (frontend)
**Branch:** `mobile/init-design-system`

**Goal:** Expo project scaffold + reusable UI primitive components.

**Input:**
- Web design tokens from `src/app/globals.css` (coral/cream/amber/rose/sage palette)
- Font pairing: Lora (headings) + Raleway (body)
- Component patterns from web: Button, Card, Input, Badge, LoadingState, ErrorState, EmptyState

**Output:**
- Running Expo project (`mobile-app/` directory)
- `mobile-app/src/components/ui/` — Button, Card, Input, Badge, SegmentedControl
- `mobile-app/src/components/` — LoadingState, ErrorState, EmptyState, OfflineBanner, ProGate, ProUpgradeCard
- `mobile-app/src/config/` — theme tokens, tier config
- `mobile-app/src/types/api.ts` — typed DTOs for all API responses

**Dependencies:** None

**Acceptance Criteria:**
- [ ] `npx expo start` launches without errors
- [ ] All primitive components render in a demo screen
- [ ] Touch targets >= 44x44 on all interactive elements
- [ ] Theme tokens match web design system colors
- [ ] `MOCK_TIER` constant flips ProGate behavior

---

### Task 2: Navigation Skeleton + Auth Flow
**Week:** 2
**Owner:** Claude (frontend)
**Branch:** `mobile/navigation-auth`

**Goal:** React Navigation setup with auth-gated routing + session module.

**Input:**
- IA: Auth stack (Welcome, Login) + Main tab stack (Today, Trends, Alerts, Insights, Profile) + Modal stack
- Auth transport: Bearer token via SecureStore
- Login endpoint: `POST /api/auth/login` → `{ user, accessToken, tokenType, expiresIn }`

**Output:**
- `mobile-app/src/navigation/` — RootNavigator, AuthStack, MainTabs, ModalStack
- `mobile-app/src/lib/auth/` — session module (store/read/clear token, login, logout)
- `mobile-app/src/lib/api/` — API client with Bearer header injection + mock adapter
- Welcome screen + Login screen (full state handling)

**Dependencies:** Task 1

**Acceptance Criteria:**
- [ ] Unauthenticated users see Welcome → Login flow
- [ ] Login mock returns token, stores in SecureStore, navigates to Today
- [ ] Logout clears token and returns to Welcome
- [ ] 401 on any API call redirects to Login with return path
- [ ] Mock adapter can simulate login success/failure/network error

---

### Task 3: Today + Check-in Flow
**Week:** 3
**Owner:** Claude (frontend)
**Branch:** `mobile/today-checkin`

**Goal:** Today home screen + Check-in modal with full state handling.

**Input:**
- API contracts: `GET /api/checkins/today`, `POST /api/checkins`
- Offline queue spec from `mobile-architecture.md` §3
- Field naming: request uses `key_contact`, response uses `keyContact`

**Output:**
- Today screen: status card, CTA (Start Check-in / View Entry), reminder summary
- Check-in modal: 3x segmented controls (1-5), optional key contact input, submit
- Offline check-in queue integration

**Dependencies:** Task 2

**Acceptance Criteria:**
- [ ] Not-checked-in state shows CTA to open Check-in modal
- [ ] Checked-in state shows scores summary
- [ ] Check-in completes in <= 30 seconds (timed)
- [ ] Duplicate check-in shows appropriate message (409 handling)
- [ ] Offline check-in queues locally with "Will sync" confirmation
- [ ] Mock adapter drives all 4 states (loading/empty/error/success)

---

### Task 4: Trends + Insights Screens
**Week:** 3-4 (parallel with Task 3)
**Owner:** Claude (frontend)
**Branch:** `mobile/trends-insights`

**Goal:** Trends tab with line chart + Insights tab with weekly summary.

**Input:**
- API contracts: `GET /api/trends?days=7|30`, `GET /api/insights/weekly?days=7|14`
- Insights screen layout from `mobile-architecture.md` §4
- ProGate on `trends_30d` and `weekly_detail`

**Output:**
- Trends screen: period switch (7/30), multi-line chart, accessible data table toggle
- Insights screen: period switch (7/14), summary card with metric bars, highlights, suggestions
- ProGate on 30-day trends and detailed suggestions

**Dependencies:** Task 1 (can run parallel with Task 3)

**Acceptance Criteria:**
- [ ] Period switch triggers re-fetch (mock)
- [ ] Chart renders energy/stress/social lines with correct colors
- [ ] Insights drift level badge uses distinct colors (low=sage, moderate=amber, high=rose)
- [ ] ProGate shows upgrade CTA on 30-day trends for Free tier
- [ ] Insufficient data warning shows when `hasEnoughData` is false
- [ ] All 4 states render correctly per screen

---

### Task 5: Alerts Screen
**Week:** 4 (parallel with Task 4)
**Owner:** Claude (frontend)
**Branch:** `mobile/alerts`

**Goal:** Alerts tab with reason + action cards.

**Input:**
- API contract: `GET /api/alerts`
- Alert field semantics: `reason` = why triggered, `action` = what to do, `message` = general summary

**Output:**
- Alerts screen: alert card list with reason, action, level badge, date
- Level-based visual distinction (low/moderate/high)

**Dependencies:** Task 1 (can run parallel with Task 3/4)

**Acceptance Criteria:**
- [ ] Alert cards show reason + action without extra taps
- [ ] Level badge colors: low=sage, moderate=amber, high=rose
- [ ] Empty state: "No active alerts. Alerts appear when your check-in patterns show notable changes."
- [ ] Error state with retry button
- [ ] All 4 states render correctly

---

### Task 6: Profile + Reminder Settings + Account Actions
**Week:** 5
**Owner:** Claude (frontend)
**Branch:** `mobile/profile-settings`

**Goal:** Profile tab + Reminder Settings modal + Account Actions modal.

**Input:**
- API contracts: `GET/POST /api/settings/reminder`, `GET /api/jobs/reminders/status`, `GET /api/export`, `POST /api/account/delete`
- Reminder constraint: only `HH:00` format accepted
- Export is CSV stream, not JSON
- Delete is soft-delete with retention window

**Output:**
- Profile screen: reminder summary, reminder status preview, privacy link, account actions link, logout
- Reminder Settings modal: hour picker (0-23, no minutes), timezone input, enable toggle, save
- Account Actions modal: export card (trigger + metadata), delete card (countdown + typed confirmation)

**Dependencies:** Task 2

**Acceptance Criteria:**
- [ ] Time picker constrains to top-of-hour only
- [ ] Timezone input validates IANA timezone
- [ ] Delete requires 5-second countdown + type "DELETE" to confirm
- [ ] Export shows metadata (generated-at, record-count) after download
- [ ] CSV handled via Share Sheet or file save (not JSON parse)
- [ ] Logout clears session and returns to Welcome
- [ ] Offline: settings save and account actions disabled with message

---

### Task 7: Offline Strategy + Error Handling + Polish
**Week:** 5 (parallel with Task 6)
**Owner:** Claude (frontend)
**Branch:** `mobile/offline-polish`

**Goal:** Network detection, offline queue flush, global error boundary, reduced motion.

**Input:**
- Offline spec from `mobile-architecture.md` §3
- Error hierarchy from `mobile-architecture.md` §5.2

**Output:**
- NetInfo integration with online/offline state
- OfflineBanner component wired to all screens
- Check-in queue auto-flush on network restore
- Global ErrorBoundary with fallback UI
- `prefers-reduced-motion` support (disable non-essential animations)

**Dependencies:** Task 3 (check-in queue), Task 1 (UI components)

**Acceptance Criteria:**
- [ ] Airplane mode: check-in queues locally, success message shows
- [ ] Reconnect: queue flushes automatically, toast shows "Synced N check-in(s)"
- [ ] Max 3 retries per queued item before giving up
- [ ] Duplicate check-in in queue resolves gracefully (removed, not errored)
- [ ] Global crash shows fallback UI, not white screen
- [ ] All screens show offline badge/banner when disconnected

---

### Task 8: Shared API Integration Pass
**Week:** 6
**Owner:** Claude (frontend) + review by Codex
**Branch:** `mobile/api-integration`

**Goal:** Replace all mock adapters with real API calls against staging backend.

**Input:**
- Backend with Bearer auth (Track A merged)
- All mock adapters from Tasks 2-6
- Staging environment URL

**Output:**
- Real API client implementations for all endpoints
- Bearer token header injection on all requests
- End-to-end user flow: Login → Check-in → Trends → Alerts → Insights → Settings → Logout

**Dependencies:** Tasks 2-7 complete, Track A merged

**Acceptance Criteria:**
- [ ] Full user flow works against staging API (not mocks)
- [ ] Login returns and stores real Bearer token
- [ ] Check-in submission creates real DB record
- [ ] Trends/Alerts/Insights show real data
- [ ] Reminder settings save persists to DB
- [ ] Export downloads real CSV
- [ ] 401 handling works end-to-end (expired token → login redirect)

---

### Task 9: Onboarding + Paywall UX
**Week:** 7
**Owner:** Claude (frontend)
**Branch:** `mobile/onboarding-paywall`

**Goal:** First-time user flow + conversion triggers + soft paywall.

**Input:**
- Onboarding sequence from design doc §9
- Conversion triggers: Day 3 teaser, Day 7 partial lock
- ProGate already wired in Tasks 4-5

**Output:**
- Onboarding screens: promise screen → preference setup (reminder time + timezone) → first check-in
- Soft paywall screen with feature comparison
- Conversion trigger logic (based on check-in count or days since signup)

**Dependencies:** Tasks 2-6

**Acceptance Criteria:**
- [ ] New user sees onboarding before main tabs
- [ ] Onboarding completes in <= 4 screens
- [ ] First check-in happens during onboarding (immediate value)
- [ ] ProGate upgrade CTA links to paywall screen
- [ ] Paywall does NOT block before first check-in

---

### Task 10: QA Hardening + Beta Release
**Week:** 8
**Owner:** Claude (frontend) + Codex (backend review)
**Branch:** `mobile/beta-prep`

**Goal:** Full regression + beta build.

**Input:**
- All Tasks 1-9 complete
- Device matrix: iPhone SE (small), iPhone 15 Pro (large)

**Output:**
- QA report (all screens × 4 states × 2 device sizes)
- TestFlight build (iOS) + internal APK (Android)
- Known issues list with severity ratings
- Performance baseline (app launch time, check-in flow time)

**Dependencies:** All tasks complete

**Acceptance Criteria:**
- [ ] All screens render correctly on iPhone SE and iPhone 15 Pro
- [ ] All 4 states (loading/empty/error/success) verified per screen
- [ ] Offline flow verified end-to-end
- [ ] Check-in median completion time <= 30 seconds
- [ ] Crash-free sessions >= 99.5%
- [ ] No P0/P1 bugs in known issues list
- [ ] Beta build installs and runs on physical device

---

## 4. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Expo SDK compatibility issues | Medium | High | Pin SDK version early (Task 1), test on physical device weekly |
| Chart library performance on low-end devices | Medium | Medium | Benchmark in Task 4, have fallback (data table only) |
| Token expiry during long offline period | Low | Medium | Re-login flow handles gracefully (Task 7) |
| Backend API changes during UI phase | Low | High | Mock adapters isolate UI; integration pass (Task 8) catches drift |
| App Store review rejection | Low | High | Follow HIG guidelines from Task 1; no health claims in copy |

---

## 5. Success Metrics (from design doc §10)

| Metric | Target | Measured When |
|--------|--------|---------------|
| D1 check-in completion rate | >= 70% | After beta launch |
| Check-in median completion time | <= 30s | Task 10 QA |
| D7 retention | >= 40% | 2 weeks post-launch |
| Crash-free sessions | >= 99.5% | Task 10 QA |
| Alert-to-action completion rate | Baseline | Post-launch tracking |
| Trial start rate after first weekly summary | Baseline | Post-launch tracking |
