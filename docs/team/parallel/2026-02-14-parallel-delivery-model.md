# Drift 并行开发模型（Lead 制定）

## 1. 目标
在不牺牲质量的前提下，将串行执行改为 BE/FE/QA 并行推进，缩短交付周期并降低返工。

## 2. 并行单元
- Workstream A: Backend（API + DB + Drift Engine）
- Workstream B: Frontend（页面 + 组件 + 交互）
- Workstream C: QA（test cases + E2E + 报告）

## 3. 分支与工作区
- `be/week1-p1`
- `fe/week1-p1`
- `qa/week1-p1`
- Lead 不写代码，仅审查文档与决策。

建议每条分支独立 worktree，避免本地文件互相污染。

## 4. 文件边界（强约束）
### Backend 专属
- `prisma/**`
- `src/app/api/**`
- `src/lib/drift/**`
- `src/lib/alerts/**`
- `tests/api/**`
- `tests/lib/**`

### Frontend 专属
- `src/app/checkin/**`
- `src/app/trends/**`
- `src/app/alerts/**`
- `src/components/**`
- `tests/ui/**`

### QA 专属
- `tests/e2e/**`
- `docs/team/reports/**`

### 共享高风险文件（改动需 Lead 批准）
- `package.json`
- `prisma/schema.prisma`
- `src/types/**`（若后续新增）
- `src/lib/contract/**`（若后续新增）

## 5. 冲突预防规则
1. 先冻结 API 合同（见 `docs/contracts/2026-02-14-api-contract-v1.md`）。
2. 每天至少一次 `rebase` 到共同基线。
3. 同名文件被两个流改动前，必须先在 Lead 处登记。
4. 发现冲突时，先保合同一致性，再保 UI 兼容性。

## 6. 合并顺序（Week 1 / Batch 2）
1. 先合并 BE：`P1-BE-01` + `P1-BE-02`
2. 再合并 FE：`P1-FE-01`
3. 最后合并 QA：`P1-QA-01` 报告与 E2E

## 7. 每日同步节奏
- 10:00 Standup：进度、阻塞、接口变更请求
- 14:00 Contract Check：仅检查 API 合同与兼容性
- 18:00 Gate：Lead 决定继续/打回

## 8. 质量门禁
- 单元/集成/E2E 通过
- code review 已执行
- Critical 0，Important 已处理或有 Lead 豁免

## 9. 流程技能强制绑定
- 规划：`superpowers:writing-plans`
- 执行：`superpowers:executing-plans`
- 审查：`superpowers:requesting-code-review`
- 调试：`superpowers:systematic-debugging`
- 分支收尾：`superpowers:finishing-a-development-branch`
