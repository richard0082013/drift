# Week 1 风险台账（Lead）

- Owner: Lead
- Sprint: Week 1
- Last Updated: 2026-02-14 (Final QA gate)

## 风险分级标准
- P0: 阻断主链路或导致不可发布
- P1: 显著影响质量/体验，需本周处理
- P2: 可延后但需持续跟踪

## 风险列表
| Risk ID | Priority | Area | Description | Impact | Mitigation Plan | Owner | ETA | Status |
|--------|----------|------|-------------|--------|------------------|-------|-----|--------|
| R-001 | P0 | Backend | DB schema/migration 延迟，阻塞 API 与联调 | 主链路阻塞 | 优先执行 P0-BE-01；每日同步迁移状态 | Backend | D1 | Closed (Batch 1 done) |
| R-002 | P0 | API/FE | API contract 变更未同步导致 FE 联调失败 | UI 无法联通 | 固化接口契约文档；变更需 Lead 批准 | Lead + BE + FE | D2 | Mitigated (P0 API+FE 联调已通) |
| R-003 | P1 | QA | E2E 环境不稳定导致测试结果波动 | 验收不可信 | 固定测试数据与环境变量；失败重跑策略 | QA | D4 | Mitigated (Batch 2 e2e pass) |
| R-004 | P1 | Security | 前端输入渲染路径存在潜在 XSS 风险 | 安全风险 | FE 完成审计清单并加防护测试 | Frontend | D5 | Mitigated (audit done at `3b71ddf0`) |
| R-005 | P2 | Scope | 临时需求插入导致计划膨胀 | 交付延期 | 变更走 Lead 评审，超范围改入下周 | Lead | Ongoing | Open |
| R-006 | P1 | Repo Hygiene | `node_modules` 已被跟踪，且 `.next/`、`test-results/`、`dev.db` 等生成物在工作区造成脏状态 | 高冲突概率、PR 噪音、并行合并风险升高 | Batch 3 首先执行仓库清理（`.gitignore` + 取消追踪生成物） | Lead + BE | D3 | Mitigated (cleaned at `5e55e900`) |
| R-007 | P1 | API Completeness | `/api/trends`、`/api/alerts` 读取接口未实现，FE 当前以错误态兜底 | 体验不完整，影响演示质量 | 并行阶段由 BE 优先补齐读取接口，FE 再切正常态渲染 | BE + FE | D3 | Mitigated (BE done at `02586607`) |

## 阻塞事件记录
| Date | Blocker | Affected Tasks | Decision | Next Check |
|------|---------|----------------|----------|------------|
| 2026-02-14 | N/A | N/A | 初始化台账 | 2026-02-15 10:00 |
| 2026-02-14 | Vitest `-r` 参数与环境不兼容 | P0-BE-02, P0-FE-01 | 采用 `--run` 等价替代并保留可复现命令 | Batch 2 review |
| 2026-02-14 | E2E 外键与定位冲突（已修复） | P1-QA-01 | 按调试流程修复并通过回归 | Batch 3 review |
| 2026-02-14 | N/A | BE parallel batch | `P2-BE-03` 与读取接口已完成并通过 API 测试 | FE/QA batch review |
| 2026-02-14 | N/A | Repo hygiene | `.gitignore` 新增并取消追踪生成物（`5e55e900`） | Final QA gate |

## 每日检查项（Lead）
- [ ] P0 任务是否全部有 owner 与 ETA
- [ ] 是否有未处理的 Critical code review 问题
- [ ] QA 报告是否更新并可追溯
- [ ] 是否出现未按流程的“跳过调试/跳过审查”行为
