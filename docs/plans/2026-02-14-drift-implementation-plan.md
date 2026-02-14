# Drift MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Drift MVP with daily check-ins, trend analysis, drift alerts, and simple notification workflow.

**Architecture:** A Next.js full-stack app backed by PostgreSQL. API routes handle write/read operations, a drift engine computes trend scores, and a scheduled job generates reminders/alerts. The design prioritizes low-friction daily usage and clear, explainable alerts.

**Tech Stack:** Next.js (TypeScript), Tailwind CSS, PostgreSQL (Supabase), Prisma, Vitest, Playwright, Sentry.

### Task 1: Bootstrap Project Skeleton

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `src/app/page.tsx`
- Create: `src/app/layout.tsx`
- Create: `src/styles/globals.css`

**Step 1: Initialize project metadata**
Run: `npm init -y`
Expected: `package.json` generated

**Step 2: Add core dependencies**
Run: `npm install next react react-dom`
Expected: install success

**Step 3: Add dev dependencies**
Run: `npm install -D typescript @types/node @types/react tailwindcss postcss autoprefixer vitest @testing-library/react playwright eslint prettier`
Expected: install success

**Step 4: Create minimal app shell**
Implement app layout and homepage with CTA to daily check-in.

**Step 5: Start app and verify boot**
Run: `npm run dev`
Expected: homepage loads without runtime errors

**Step 6: Commit**
Run:
```bash
git add package.json tsconfig.json next.config.ts src/app/layout.tsx src/app/page.tsx src/styles/globals.css
git commit -m "chore: bootstrap drift nextjs app shell"
```

### Task 2: Define Database Schema and Migrations

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Create: `prisma/migrations/*`
- Create: `.env.example`

**Step 1: Write schema models**
Add models: `User`, `DailyCheckin`, `DriftScore`, `Alert`, `NotificationLog`, `UserPreference`.

**Step 2: Add constraints/indexes**
Ensure unique `(userId, date)` on check-ins and indexes on `(userId, date)` for query speed.

**Step 3: Generate migration**
Run: `npx prisma migrate dev --name init_drift_schema`
Expected: migration SQL created

**Step 4: Add DB client singleton**
Create `src/lib/db.ts` for Prisma client reuse.

**Step 5: Verify migration applied**
Run: `npx prisma migrate status`
Expected: schema in sync

**Step 6: Commit**
Run:
```bash
git add prisma/schema.prisma prisma/migrations src/lib/db.ts .env.example
git commit -m "feat: add drift core data schema"
```

### Task 3: Implement Daily Check-in API with TDD

**Files:**
- Create: `src/app/api/checkins/route.ts`
- Create: `src/lib/validation/checkin.ts`
- Test: `tests/api/checkins.test.ts`

**Step 1: Write failing API tests**
Cover: create check-in success, duplicate same date rejected, invalid range rejected.

**Step 2: Run test to confirm fail**
Run: `npx vitest tests/api/checkins.test.ts -r`
Expected: FAIL with missing route/validation

**Step 3: Implement input validation**
Energy/Stress/Social range 1-5, optional note length limit, date normalization by timezone.

**Step 4: Implement route handler**
POST `/api/checkins` writes row and returns created entity.

**Step 5: Re-run tests**
Run: `npx vitest tests/api/checkins.test.ts -r`
Expected: PASS

**Step 6: Commit**
Run:
```bash
git add src/app/api/checkins/route.ts src/lib/validation/checkin.ts tests/api/checkins.test.ts
git commit -m "feat: add daily check-in api with validation"
```

### Task 4: Implement Trend Query API

**Files:**
- Create: `src/app/api/trends/route.ts`
- Create: `src/lib/trends/query.ts`
- Test: `tests/api/trends.test.ts`

**Step 1: Write failing tests**
Cases: 7-day trend, 30-day trend, empty state.

**Step 2: Run tests and verify fail**
Run: `npx vitest tests/api/trends.test.ts -r`
Expected: FAIL

**Step 3: Implement aggregation query**
Return metric arrays and lightweight summary stats.

**Step 4: Implement response contract**
Include `window`, `series`, `summary`.

**Step 5: Re-run tests**
Run: `npx vitest tests/api/trends.test.ts -r`
Expected: PASS

**Step 6: Commit**
Run:
```bash
git add src/app/api/trends/route.ts src/lib/trends/query.ts tests/api/trends.test.ts
git commit -m "feat: add trend query api"
```

### Task 5: Build Drift Engine (Rule-Based)

**Files:**
- Create: `src/lib/drift/rules.ts`
- Create: `src/lib/drift/engine.ts`
- Test: `tests/lib/drift-engine.test.ts`

**Step 1: Write failing drift rule tests**
Cases: energy downtrend, stress uptrend, social decline, no drift.

**Step 2: Run tests and confirm fail**
Run: `npx vitest tests/lib/drift-engine.test.ts -r`
Expected: FAIL

**Step 3: Implement rule functions**
Pure functions for each metric trend and threshold evaluation.

**Step 4: Implement drift index combiner**
Combine rule outputs into weighted `driftIndex` and `reasons` list.

**Step 5: Re-run tests**
Run: `npx vitest tests/lib/drift-engine.test.ts -r`
Expected: PASS

**Step 6: Commit**
Run:
```bash
git add src/lib/drift/rules.ts src/lib/drift/engine.ts tests/lib/drift-engine.test.ts
git commit -m "feat: add rule-based drift engine"
```

### Task 6: Alert Generation and Persistence

**Files:**
- Create: `src/app/api/alerts/evaluate/route.ts`
- Create: `src/lib/alerts/generate.ts`
- Test: `tests/api/alerts-evaluate.test.ts`

**Step 1: Write failing tests**
Verify alerts created when threshold exceeded and skipped otherwise.

**Step 2: Run tests to verify fail**
Run: `npx vitest tests/api/alerts-evaluate.test.ts -r`
Expected: FAIL

**Step 3: Implement evaluator route**
Load recent check-ins, call drift engine, persist drift score + alert.

**Step 4: Add explainable message templates**
Map reasons to gentle, non-medical wording.

**Step 5: Re-run tests**
Run: `npx vitest tests/api/alerts-evaluate.test.ts -r`
Expected: PASS

**Step 6: Commit**
Run:
```bash
git add src/app/api/alerts/evaluate/route.ts src/lib/alerts/generate.ts tests/api/alerts-evaluate.test.ts
git commit -m "feat: add drift alert evaluation and persistence"
```

### Task 7: Build MVP UI Flows

**Files:**
- Create: `src/app/checkin/page.tsx`
- Create: `src/app/trends/page.tsx`
- Create: `src/app/alerts/page.tsx`
- Create: `src/components/checkin-form.tsx`
- Create: `src/components/trend-chart.tsx`
- Test: `tests/ui/checkin-form.test.tsx`

**Step 1: Write failing UI tests**
Cover quick submit and field validation feedback.

**Step 2: Run test and verify fail**
Run: `npx vitest tests/ui/checkin-form.test.tsx -r`
Expected: FAIL

**Step 3: Implement check-in page/form**
Single-screen fast interaction with slider/select controls.

**Step 4: Implement trends page**
Render 7/30 day charts and summary cards.

**Step 5: Implement alerts page**
List latest alerts with reasons and suggested actions.

**Step 6: Re-run UI tests**
Run: `npx vitest tests/ui/checkin-form.test.tsx -r`
Expected: PASS

**Step 7: Commit**
Run:
```bash
git add src/app/checkin/page.tsx src/app/trends/page.tsx src/app/alerts/page.tsx src/components/checkin-form.tsx src/components/trend-chart.tsx tests/ui/checkin-form.test.tsx
git commit -m "feat: build mvp checkin trends and alerts ui"
```

### Task 8: Add Reminder Scheduler

**Files:**
- Create: `src/app/api/jobs/reminders/route.ts`
- Create: `src/lib/notifications/reminder.ts`
- Create: `src/lib/notifications/provider.ts`
- Test: `tests/api/reminders-job.test.ts`

**Step 1: Write failing scheduler tests**
Cases: due reminders selected by timezone, logs persisted.

**Step 2: Run tests and verify fail**
Run: `npx vitest tests/api/reminders-job.test.ts -r`
Expected: FAIL

**Step 3: Implement reminder selection logic**
Query users due at current UTC window.

**Step 4: Implement provider abstraction**
No-op/local logger provider for MVP, pluggable email later.

**Step 5: Re-run tests**
Run: `npx vitest tests/api/reminders-job.test.ts -r`
Expected: PASS

**Step 6: Commit**
Run:
```bash
git add src/app/api/jobs/reminders/route.ts src/lib/notifications/reminder.ts src/lib/notifications/provider.ts tests/api/reminders-job.test.ts
git commit -m "feat: add scheduled reminder job"
```

### Task 9: Privacy, Export, and Compliance Basics

**Files:**
- Create: `src/app/api/export/route.ts`
- Create: `src/app/privacy/page.tsx`
- Modify: `src/app/layout.tsx`
- Test: `tests/api/export.test.ts`

**Step 1: Write failing export API tests**
Verify authenticated user gets own CSV only.

**Step 2: Run test to confirm fail**
Run: `npx vitest tests/api/export.test.ts -r`
Expected: FAIL

**Step 3: Implement CSV export route**
Stream check-in and drift data in CSV format.

**Step 4: Add privacy/compliance page**
Include non-medical disclaimer and deletion request instructions.

**Step 5: Re-run tests**
Run: `npx vitest tests/api/export.test.ts -r`
Expected: PASS

**Step 6: Commit**
Run:
```bash
git add src/app/api/export/route.ts src/app/privacy/page.tsx src/app/layout.tsx tests/api/export.test.ts
git commit -m "feat: add export api and privacy baseline"
```

### Task 10: End-to-End Verification and Release Readiness

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/mvp-flow.spec.ts`
- Create: `docs/runbooks/mvp-smoke-test.md`

**Step 1: Write E2E scenario**
Flow: open app -> submit check-in -> view trend -> alert visibility.

**Step 2: Run E2E and verify initial fail**
Run: `npx playwright test tests/e2e/mvp-flow.spec.ts`
Expected: FAIL before app fully wired

**Step 3: Fix integration gaps**
Resolve route contracts, mock provider config, seed fixtures.

**Step 4: Re-run full test suite**
Run: `npm test`
Expected: PASS

**Step 5: Add runbook**
Document local setup, env vars, smoke checks, rollback notes.

**Step 6: Final commit**
Run:
```bash
git add playwright.config.ts tests/e2e/mvp-flow.spec.ts docs/runbooks/mvp-smoke-test.md
git commit -m "chore: add e2e verification and mvp runbook"
```
