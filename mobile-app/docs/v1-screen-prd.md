# Drift Mobile v1 Screen PRD (UI-First)

## 1. Scope

This PRD defines the mobile app screens for a UI-first phase with backend-compatible contracts.

In scope:
- App IA and navigation
- Screen-level UI states
- User flows and acceptance criteria
- Data dependency contracts (integration-ready)

Out of scope:
- Payment SDK implementation
- Push delivery implementation
- New backend business logic

## 2. IA and Navigation

Navigation model:
- Auth stack:
  - `Welcome`
  - `Login`
- Main tab stack:
  - `Today`
  - `Trends`
  - `Alerts`
  - `Insights`
  - `Profile`
- Modal stack:
  - `Check-in`
  - `Reminder Settings`
  - `Account Actions`

## 3. Screen Definitions

## 3.1 Welcome

Purpose:
- Explain value quickly and drive first login.

Primary UI:
- Headline: "30 sec/day, see drift early."
- 3 value bullets.
- Primary CTA: `Get Started`
- Secondary CTA: `Privacy`

States:
- Default
- Network error toast for failed route prefetch (non-blocking)

Acceptance criteria:
- User can reach login in one tap.
- User can open privacy before login.

## 3.2 Login

Purpose:
- Authenticate with email + optional name.

Primary UI:
- Email input (required)
- Name input (optional)
- Submit button with loading state
- Error inline message

States:
- Idle
- Submitting (button disabled)
- Validation error
- Server error
- Success (navigate to Today)

Acceptance criteria:
- Invalid email shows actionable error.
- Successful login routes to Today.

## 3.3 Today (Home)

Purpose:
- Central daily action hub.

Primary UI:
- "Today status" card:
  - Checked in / not checked in
  - Last score summary if exists
- CTA:
  - `Start Check-in` if not checked in
  - `View Today Entry` if checked in
- "One micro-action" card (UI placeholder in v1 UI phase)
- Footer reminder summary (time + enabled state)

States:
- Loading skeleton
- Unchecked-in
- Checked-in
- Error + retry

Acceptance criteria:
- User understands next action in <= 3 seconds.
- If unchecked-in, CTA opens Check-in modal.

## 3.4 Check-in (Modal)

Purpose:
- Complete daily input in <= 30s.

Primary UI:
- 3 sliders or 1-5 segmented controls:
  - Energy
  - Stress
  - Social
- Optional input:
  - Key contact
- Submit button

States:
- Idle
- Validation error
- Submitting
- Success confirmation
- Duplicate check-in state

Acceptance criteria:
- Cannot submit if required values missing.
- Success updates Today screen immediately.

## 3.5 Trends

Purpose:
- Show 7/30 day trend progression.

Primary UI:
- Period switch: 7 / 30
- Multi-line chart (energy/stress/social)
- Accessible table toggle

States:
- Loading
- Empty
- Error
- Loaded

Acceptance criteria:
- Period switch re-fetches and updates chart.
- Empty/error states are explicit.

## 3.6 Alerts

Purpose:
- Show drift alerts with clear action language.

Primary UI:
- Alert cards:
  - reason
  - recommended action
  - level/date (if available)

States:
- Loading
- Empty ("No active alerts")
- Error
- Loaded list

Acceptance criteria:
- User can read reason and action without extra taps.

## 3.7 Insights

Purpose:
- Show interpreted weekly summary with drift assessment.

Primary UI:
- Period switch: 7 / 14 days
- Summary card:
  - Check-in count, alert count
  - Drift level badge (low/moderate/high)
  - Average scores (energy/stress/social/driftIndex) with bar visualization
- Highlights list (if available)
- Suggestions list (if available)
- "Not enough data" warning card (when hasEnoughData is false)

States:
- Loading
- Empty ("No weekly insights yet. Keep checking in daily.")
- Error
- Loaded
- Insufficient data (loaded but hasEnoughData = false)

Acceptance criteria:
- Period switch re-fetches insights.
- Drift level badge uses distinct colors for low/moderate/high.
- ProGate wraps detailed breakdown for Pro tier.

## 3.8 Profile

Purpose:
- User settings and compliance actions.

Primary UI:
- Reminder summary tile
- Reminder status preview tile
- Privacy entry
- Account actions entry
- Logout

States:
- Loading
- Error
- Loaded

Acceptance criteria:
- User can reach reminder settings and account actions in <= 2 taps.

## 3.9 Reminder Settings (Modal)

Purpose:
- Manage reminder schedule and enablement.

Primary UI:
- Time selector
- Timezone selector/text input
- Enable toggle
- Save button

States:
- Loading current settings
- Validation error
- Saving
- Save success
- Save error

Acceptance criteria:
- Invalid timezone/time is blocked with clear copy.

## 3.10 Account Actions (Modal)

Purpose:
- Data export and deletion flow.

Primary UI:
- Export card:
  - trigger export
  - show metadata
- Delete card:
  - arm delete
  - countdown
  - typed confirmation

States:
- Idle
- Exporting/deleting
- Success
- Error

Acceptance criteria:
- Delete requires explicit confirmation and countdown unlock.

## 4. Cross-Screen UX Rules

1. Every data screen must support 4 states: loading / empty / error / success.
2. Primary actions are always bottom-reachable on mobile.
3. Input controls must have >= 44x44 touch target.
4. Reduced-motion mode must remove non-essential motion.
5. No screen may rely on color alone for critical status.
6. Offline behavior:
   - Check-in supports local queue: if offline, store submission in device storage and auto-submit when connectivity resumes.
   - Other data screens show cached data with an "Offline" banner.
   - Network recovery triggers automatic queue flush.
7. Timezone rule:
   - Check-in `date` field is the user's LOCAL calendar date (YYYY-MM-DD), not UTC.
   - Backend handles UTC normalization.
   - Device timezone should be sent with reminder settings.
8. Export handling:
   - Export endpoint returns CSV stream, not JSON.
   - Mobile must use Share Sheet or file save API for CSV download.

## 5. UI-Phase Technical Guardrails

1. Keep typed API DTOs in one place (`mobile-app/src/types/api.ts` when implementation starts).
2. Use repository pattern:
   - `real` adapter for API
   - `mock` adapter for UI development
3. Do not hardcode backend-specific shape in components.
4. Keep auth handling isolated in a session module.

## 6. Definition of Done (UI Phase)

1. All screens above implemented with navigation and full state handling.
2. Mock adapter can drive every state deterministically.
3. Screen contracts are aligned with `/mobile-app/docs/api-field-mapping.md`.
4. Zero blocking TODOs before integration phase.

## Appendix A: Future Screens (Not in v1)

### Plan

Purpose:
- Present a structured daily micro-action program.

Status: Blocked on backend API. Will be added when plan/action endpoints are available.

Placeholder UI:
- "Coming Soon" card with brief description of future capability.
