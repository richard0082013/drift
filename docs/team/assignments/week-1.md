# Drift Week 1 正式任务派单（Lead 发布）

- Sprint: Week 1
- 发布人: Lead
- 目标: 完成 MVP 核心垂直链路（打卡 -> 趋势 -> 漂移提醒 -> QA 报告）
- 周期: 5 个工作日

## 优先级说明
- P0: 阻塞型基础能力，不完成则无法形成 MVP 主链路。
- P1: 关键体验能力，影响可用性与上线质量。
- P2: 提升项，可在 P0/P1 通过后并行推进。

## P0 任务

### P0-BE-01: 核心数据模型与迁移
- Owner: Backend
- Goal: 建立 Drift 最小可运行数据层。
- Files:
  - Create: `prisma/schema.prisma`
  - Create: `prisma/migrations/*`
  - Create: `src/lib/db.ts`
  - Create: `.env.example`
- Acceptance Criteria:
  - [ ] 包含 `User` `DailyCheckin` `DriftScore` `Alert` `NotificationLog` `UserPreference`
  - [ ] `DailyCheckin` 对 `(userId, date)` 有唯一约束
  - [ ] 迁移可执行且状态正常
- Required Tests/Commands:
  - `npx prisma migrate dev --name init_drift_schema`
  - `npx prisma migrate status`
- Dependency: 无
- Reviewer: Lead

### P0-BE-02: 每日打卡 API
- Owner: Backend
- Goal: 提供可用、可校验、可去重的打卡接口。
- Files:
  - Create: `src/app/api/checkins/route.ts`
  - Create: `src/lib/validation/checkin.ts`
  - Test: `tests/api/checkins.test.ts`
- Acceptance Criteria:
  - [ ] POST `/api/checkins` 成功写入
  - [ ] 1-5 范围校验有效
  - [ ] 同用户同日期重复写入被拒绝
- Required Tests/Commands:
  - `npx vitest tests/api/checkins.test.ts -r`
- Dependency: P0-BE-01
- Reviewer: Lead

### P0-FE-01: 快速打卡页面
- Owner: Frontend
- Goal: 完成 10 秒内可提交的打卡交互。
- Files:
  - Create: `src/app/checkin/page.tsx`
  - Create: `src/components/checkin-form.tsx`
  - Test: `tests/ui/checkin-form.test.tsx`
- Acceptance Criteria:
  - [ ] 支持 energy/stress/social + key_contact
  - [ ] 提交成功/失败反馈明确
  - [ ] 表单输入校验和禁用状态可见
- Required Tests/Commands:
  - `npx vitest tests/ui/checkin-form.test.tsx -r`
- Dependency: P0-BE-02（接口联调）
- Reviewer: Lead

### P0-QA-01: 主链路测试设计
- Owner: QA
- Goal: 建立 MVP 主链路测试基线。
- Files:
  - Create: `docs/team/reports/week-1-test-cases.md`
- Acceptance Criteria:
  - [ ] 覆盖正向、边界、异常、回归
  - [ ] 覆盖 API + UI + E2E 入口
  - [ ] 每条 case 含前置、步骤、期望结果
- Required Tests/Commands:
  - 文档评审通过
- Dependency: 无
- Reviewer: Lead

## P1 任务

### P1-BE-01: Drift 规则引擎
- Owner: Backend
- Goal: 输出可解释的 drift index 与 reasons。
- Files:
  - Create: `src/lib/drift/rules.ts`
  - Create: `src/lib/drift/engine.ts`
  - Test: `tests/lib/drift-engine.test.ts`
- Acceptance Criteria:
  - [ ] 覆盖 energy/stress/social 三类趋势规则
  - [ ] 产出 `driftIndex` 与 `reasons[]`
  - [ ] 规则函数可单测
- Required Tests/Commands:
  - `npx vitest tests/lib/drift-engine.test.ts -r`
- Dependency: P0-BE-01
- Reviewer: Lead

### P1-BE-02: 漂移评估与提醒 API
- Owner: Backend
- Goal: 按阈值生成 alerts 并可解释。
- Files:
  - Create: `src/app/api/alerts/evaluate/route.ts`
  - Create: `src/lib/alerts/generate.ts`
  - Test: `tests/api/alerts-evaluate.test.ts`
- Acceptance Criteria:
  - [ ] 超阈值创建 alert
  - [ ] 未超阈值不创建 alert
  - [ ] message 使用温和非医疗措辞
- Required Tests/Commands:
  - `npx vitest tests/api/alerts-evaluate.test.ts -r`
- Dependency: P1-BE-01
- Reviewer: Lead

### P1-FE-01: 趋势页与提醒页
- Owner: Frontend
- Goal: 实现 7/30 天趋势查看和提醒查看。
- Files:
  - Create: `src/app/trends/page.tsx`
  - Create: `src/app/alerts/page.tsx`
  - Create: `src/components/trend-chart.tsx`
- Acceptance Criteria:
  - [ ] 趋势页支持 7/30 天切换
  - [ ] 提醒页显示 reason + action
  - [ ] 空状态与错误状态清晰
- Required Tests/Commands:
  - `npx vitest tests/ui/trends-alerts.test.tsx -r`
- Dependency: P1-BE-02
- Reviewer: Lead

### P1-QA-01: E2E 主链路验证
- Owner: QA
- Goal: 形成可复用 E2E 冒烟流程。
- Files:
  - Create: `tests/e2e/mvp-flow.spec.ts`
  - Create: `docs/team/reports/week-1-qa-report.md`
- Acceptance Criteria:
  - [ ] 覆盖 打卡 -> 趋势 -> 提醒 三步
  - [ ] 输出缺陷清单与 Go/No-Go 结论
- Required Tests/Commands:
  - `npx playwright test tests/e2e/mvp-flow.spec.ts`
- Dependency: P0/P1 开发任务完成
- Reviewer: Lead

## P2 任务

### P2-FE-02: 基础安全审计（前端）
- Owner: Frontend
- Goal: 检查常见前端安全风险。
- Files:
  - Modify: `src/app/checkin/page.tsx`
  - Modify: `src/app/trends/page.tsx`
  - Modify: `src/app/alerts/page.tsx`
  - Create: `docs/team/reports/week-1-fe-security-audit.md`
- Acceptance Criteria:
  - [ ] 用户输入渲染路径无 XSS 风险
  - [ ] 敏感信息不落日志/不暴露到客户端
  - [ ] API 错误信息无内部细节泄漏
- Required Tests/Commands:
  - 审计清单评审通过
- Dependency: P1-FE-01
- Reviewer: Lead

### P2-BE-03: 导出接口（CSV）
- Owner: Backend
- Goal: 支持用户导出自己的核心数据。
- Files:
  - Create: `src/app/api/export/route.ts`
  - Test: `tests/api/export.test.ts`
- Acceptance Criteria:
  - [ ] 仅导出当前用户数据
  - [ ] CSV 字段完整可解析
- Required Tests/Commands:
  - `npx vitest tests/api/export.test.ts -r`
- Dependency: P0-BE-02
- Reviewer: Lead

## Lead 治理任务（不写代码）

### LEAD-01: 审查节奏
- 每个开发任务完成后必须触发 `superpowers:requesting-code-review`。
- Critical 必修复，Important 原则上需修复后再进入下一任务。

### LEAD-02: 调试纪律
- 出现失败必须执行 `superpowers:systematic-debugging`。
- 未定位根因不得允许“猜测式修复”。

### LEAD-03: 验收与分支完成
- QA 报告为 Go 且无 P0/P1 打开缺陷后，进入 `superpowers:finishing-a-development-branch`。

## 本周交付物清单
- 代码：BE/FE 对应实现与测试。
- 报告：
  - `docs/team/reports/week-1-test-cases.md`
  - `docs/team/reports/week-1-qa-report.md`
  - `docs/team/reports/week-1-fe-security-audit.md`
- Lead 验收记录：`docs/team/reports/week-1-lead-acceptance.md`
