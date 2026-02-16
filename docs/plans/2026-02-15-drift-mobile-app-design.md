# Drift Mobile App v1 Design (UI-First, Shared Backend)

## 1. Goal

Build a mobile-first Drift app that increases week-1 retention and supports paid conversion, while reusing the current web backend and database.

Core promise:
- `30 seconds per day`
- `early warning before obvious burnout`
- `one actionable step for today`

## 2. Product Positioning

Drift mobile is not a journaling app and not a medical app.
It is a "personal stability signal + micro-action" app.

Primary value:
1. Detect trend deterioration early from daily check-ins.
2. Translate risk into a concrete daily action.
3. Show weekly evidence that actions are helping.

## 3. Architecture Options

### Option A (Recommended): Shared API + Shared DB
- Mobile app calls existing `/api/*` endpoints.
- Data remains in the same DB used by web.
- Add only minimal mobile-specific API surface later (push token, subscription status).

Pros:
- Fastest path to ship.
- Lowest backend complexity.
- Keeps web and mobile behavior consistent.

Cons:
- Some auth/session endpoints are web-cookie oriented and need mobile adaptation.

### Option B: Mobile BFF layer
- Add a dedicated BFF between mobile and current API.

Pros:
- Better separation and client-specific optimization.

Cons:
- Extra infra and slower delivery.

### Option C: Local-first mobile backend fork
- Separate storage/sync path for mobile.

Pros:
- Strong offline support.

Cons:
- High complexity and duplicate business logic.

Decision: use **Option A** for v1.

### Auth Transport Decision

Mobile clients use Bearer token authentication.

- `POST /api/auth/login` returns `accessToken` + `tokenType` + `expiresIn` in response body alongside `user`.
- Mobile stores token in secure storage (Expo SecureStore / RN Keychain).
- All API requests include `Authorization: Bearer <token>` header.
- Web app continues using httpOnly cookie (unchanged).
- Backend `getSessionUserId()` checks Bearer header first, falls back to cookie.

## 4. User Segments and Jobs-To-Be-Done

Primary segment:
- Professionals/students with irregular stress and energy patterns.
- Need low-friction tracking, not long reflection.

Core jobs:
1. "I want to check in quickly without cognitive burden."
2. "I want a clear signal if I am drifting."
3. "I want one thing to do today, not generic advice."

## 5. Mobile Information Architecture

Bottom tabs (5):
1. `Today` (home)
2. `Trends`
3. `Alerts`
4. `Insights`
5. `Profile`

Key screen responsibilities:
- `Today`: daily status card, check-in CTA, one micro-action, streak.
- `Check-in flow`: 3 sliders (energy/stress/social) + optional key contact.
- `Trends`: 7/30-day chart + plain-language interpretation.
- `Alerts`: trigger reasons + "what to do now."
- `Insights`: weekly summary with averages, drift level, highlights, suggestions.
- `Profile`: reminder time/timezone, privacy, export/delete entry.

### Future Scope (Not in v1)
- `Plan`: daily action program and completion history. Requires new backend APIs. Will be added as a tab or sub-screen when backend support is ready.

## 6. Feature Definition (v1)

### Free Tier
- Daily check-in.
- 7-day trend view.
- Basic alerts with reasons.
- Daily reminder.

### Pro Tier
- 30/90-day trends.
- Early warning sensitivity tuning.
- Personalized micro-action plan.
- Weekly summary ("what improved / what worsened").
- Historical insight timeline.

### Not in v1
- Therapist marketplace.
- AI chat as primary UX.
- Complex social/community features.

### Tier Enforcement Model

Feature access is controlled by a tier gate system.

Feature keys (v1):
- `trends_30d` - 30-day trend view
- `trends_90d` - 90-day trend view (future)
- `sensitivity_tuning` - alert sensitivity config
- `action_plan` - personalized micro-action plan (future)
- `weekly_detail` - full weekly summary detail
- `insight_history` - historical insight timeline

UI phase: use `const MOCK_TIER: Tier = "free"` in a single config file.
`<ProGate feature="trends_30d">` checks feature key against current tier.
Changing the constant to `"pro"` flips all gates for testing.

Integration phase: tier source will be determined (session extension or dedicated endpoint).

## 7. Shared Backend Contract (Web + Mobile)

Use existing endpoints as baseline:
- `POST /api/checkins`
- `GET /api/checkins/today`
- `GET /api/trends?days=7|30`
- `GET /api/alerts`
- `GET /api/insights/weekly?days=7|14`
- `GET/POST /api/settings/reminder`
- `GET /api/jobs/reminders/status`

Planned additions (minimal):
1. `POST /api/mobile/push-token`
2. `GET /api/mobile/bootstrap` (single payload for home screen)

## 8. UI-First Delivery Scope (Now)

Current phase is UI-focused, but integration-ready.

Required in UI phase:
1. Stable screen skeletons for all tabs.
2. Typed data models aligned with current API contracts.
3. API client interfaces + mock adapters (no hardcoded random fields).
4. Loading/empty/error/success states per screen.
5. Navigation and auth-gated screen flow.

Do not do yet:
- Payment SDK wiring.
- Push delivery logic.
- New backend business rules.

## 9. Onboarding and Conversion Strategy

Onboarding sequence:
1. Promise screen ("30 sec/day, early signal").
2. Preference setup (reminder time + timezone).
3. First check-in immediately.
4. Instant feedback card + one action for today.

Conversion triggers:
- Day 3: "pattern emerging" insight teaser.
- Day 7: weekly summary with partial lock for Pro details.
- Soft paywall after user sees value (not before first check-in).

## 10. Metrics and Success Criteria

North-star:
- Weekly completed micro-actions per active user.

Leading indicators:
1. D1 check-in completion rate.
2. D7 retention.
3. Alert-to-action completion rate.
4. Trial start rate after first weekly summary.

Guardrails:
- Check-in median completion time <= 30s.
- Crash-free sessions >= 99.5%.

## 11. 8-Week Execution Plan

1. **Week 1-2**: Project init + design system + navigation skeleton + auth flow
   - Output: Running Expo app with auth stack, tab navigation, UI primitives
   - Acceptance: `npx expo start` works; login/logout flow navigates correctly

2. **Week 3**: Today + Check-in flow
   - Output: Today screen with status card + Check-in modal with 3 sliders
   - Acceptance: Mock adapter drives all 4 states; duplicate check-in handled

3. **Week 4**: Trends + Insights + Alerts screens
   - Output: All data visualization screens with period switching and state handling
   - Acceptance: Empty/error/loading/success states render correctly; ProGate shown on 30-day

4. **Week 5**: Profile + Reminder Settings + Account Actions + offline strategy
   - Output: Full profile flow; offline check-in queue; network status banner
   - Acceptance: Delete requires countdown + typed confirmation; offline check-in queues and syncs

5. **Week 6**: Shared API integration pass
   - Output: All screens connected to real backend via Bearer auth
   - Acceptance: Full user flow works against staging API

6. **Week 7**: Onboarding + paywall UX
   - Output: Welcome -> preference setup -> first check-in flow; Pro feature gates
   - Acceptance: Conversion triggers fire at correct moments

7. **Week 8**: QA hardening + beta release
   - Output: TestFlight / internal APK; QA report; known issues list
   - Acceptance: All screens x 4 states x 2 device sizes pass; crash-free >= 99.5%

## 12. Review Checklist (for Claude Review)

1. Is tab IA minimal and aligned with core value loop?
2. Are free/pro boundaries clear and defensible?
3. Are API assumptions compatible with current web backend?
4. Is UI-phase scope tight enough to avoid backend creep?
5. Any critical mobile UX gaps before implementation planning?
