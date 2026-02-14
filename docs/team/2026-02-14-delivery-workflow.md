# Drift 团队交付流程（绑定 Superpowers）

## 1. 强制技能映射
- 规划：`superpowers:writing-plans`
- 执行：`superpowers:executing-plans`
- 代码审查：`superpowers:requesting-code-review`
- 调试：`superpowers:systematic-debugging`
- 完成分支：`superpowers:finishing-a-development-branch`

## 2. 端到端流程
1. Lead 产出计划文档（`docs/plans/*.md`），明确每个任务的文件路径与验收标准。
2. Backend/Frontend 按计划执行任务，阶段性提交。
3. 每个任务完成后发起代码审查（requesting-code-review）。
4. 若测试失败或行为异常，必须走 systematic-debugging 四阶段流程后才能修复。
5. QA 执行测试用例与 E2E，提交报告。
6. Lead 汇总代码审查 + QA 结果，决定是否进入完成分支流程。
7. 通过 finishing-a-development-branch 执行合并/PR/保留/丢弃决策。

## 3. 分支与提交策略
- 分支命名：
  - `lead/plan-<topic>`（Lead 文档分支）
  - `be/<feature-or-api>`
  - `fe/<feature-or-ui>`
  - `qa/<test-cycle>`
- 提交格式：
  - `feat(be): ...`
  - `feat(fe): ...`
  - `test(qa): ...`
  - `docs(lead): ...`
- 每个任务最少包含：代码 + 测试 + 说明（PR 描述或任务记录）。

## 4. Lead 下发任务模板
```md
### Task: <name>

Owner: <BE|FE|QA>
Goal: <一句话目标>

Files:
- Create: `path/a`
- Modify: `path/b`
- Test: `tests/path/c`

API Contract / UI Spec:
- <关键字段、状态码、交互说明>

Definition of Done:
- [ ] 功能完成
- [ ] 测试通过（列命令）
- [ ] 已完成 code review
- [ ] 无 blocker
```

## 5. 每日节奏（建议）
- 10:00 Standup：昨天进展/今天计划/阻塞。
- 14:00 Review Checkpoint：代码审查与风险同步。
- 18:00 QA/Lead Gate：是否满足当日验收门槛。

## 6. 发布门禁（必须全部满足）
- 单元测试、集成测试、E2E 全通过。
- 无 P0/P1 未关闭缺陷。
- Lead 验收通过并完成分支流程决策。
