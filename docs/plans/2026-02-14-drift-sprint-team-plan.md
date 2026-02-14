# Drift Sprint Team Plan (2 Weeks)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver Drift MVP vertical slice with check-in, trends, alerts, and QA report.

**Architecture:** Keep backend and frontend loosely coupled via explicit API contract. Lead controls task boundaries and acceptance gates. QA validates each milestone before branch completion.

**Tech Stack:** Next.js, TypeScript, PostgreSQL/Prisma, Vitest, Playwright.

### Task 1: Lead - Planning & Task Assignment
**Files:**
- Modify: `docs/plans/2026-02-14-drift-implementation-plan.md`
- Create: `docs/team/assignments/week-1.md`

1. 按模块拆成 BE/FE/QA 子任务。
2. 每个子任务补充文件范围与 DoD。
3. 下发任务单并确认依赖。

### Task 2: Backend - Data Layer & Check-in API
**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/app/api/checkins/route.ts`
- Test: `tests/api/checkins.test.ts`

1. 建表与 migration。
2. 实现打卡 API 与校验。
3. 完成单元测试 + 集成测试。

### Task 3: Frontend - Check-in UI & Trends UI
**Files:**
- Create: `src/app/checkin/page.tsx`
- Create: `src/app/trends/page.tsx`
- Create: `src/components/checkin-form.tsx`

1. 实现 10 秒打卡交互。
2. 接入趋势展示（7/30 天）。
3. 做基础安全审计（输入、渲染）。

### Task 4: Backend - Drift Engine & Alerts API
**Files:**
- Create: `src/lib/drift/engine.ts`
- Create: `src/app/api/alerts/evaluate/route.ts`
- Test: `tests/lib/drift-engine.test.ts`

1. 实现规则引擎。
2. 生成可解释提醒。
3. 完成单元测试。

### Task 5: QA - Test Cases & E2E
**Files:**
- Create: `tests/e2e/mvp-flow.spec.ts`
- Create: `docs/team/reports/week-1-qa-report.md`

1. 制定 test cases（正向/边界/异常）。
2. 执行 E2E 和回归。
3. 输出 Go/No-Go 结论。

### Task 6: Lead - Review, Debug Governance, Final Acceptance
**Files:**
- Create: `docs/team/reports/week-1-lead-acceptance.md`

1. 发起 code review（requesting-code-review）。
2. 对失败项强制进入 systematic-debugging。
3. QA 通过后进入 finishing-a-development-branch。
