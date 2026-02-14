# Week 5 QA Report

- Sprint: Week 5
- Branch: `qa/week5-p1`
- Owner: QA
- Date: 2026-02-14

## Batch A (P0) Coverage
- Spec: `tests/e2e/reminder-settings-flow.spec.ts`
- Scope:
  - 不 mock `/api/settings/reminder`，真实 GET/POST 设置读写
  - 真实触发 `/api/jobs/reminders`
  - 设置页状态区域可见性校验

## Test Execution
- Command: `npx playwright test tests/e2e/reminder-settings-flow.spec.ts`
- Result: 1 passed / 0 failed

## Defect Triage (Current)
- Critical: 0
- Important: 1
- Minor: 0

### Open Important
- W5-P0-INT-001: `/api/jobs/reminders/status` 在当前 Week 5 基线缺失，设置页状态查询进入不可用提示，尚未形成“触发后已发送状态可见”的全真实闭环。

## Batch A Gate
- Recommendation: **No-Go (for full P0 gate)**
- Reason:
  - 设置接口真实链路已通过；
  - 但状态接口缺失导致“设置 -> 触发 -> 已发送状态可见”目标未完全满足。

## Blocker / Risk
- Blocker:
  - 需要 BE/FE 补齐并接入 `/api/jobs/reminders/status` 真实接口后，QA 再执行无降级断言回归。
- Risk:
  - 当前仅能验证设置读写与触发成功，无法验证状态聚合正确性。
