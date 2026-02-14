# Drift 开发团队章程（Lead + Backend + Frontend + QA）

## 1. 团队结构
- Lead / PM（不写代码）
- Backend Engineer（服务端）
- Frontend Engineer（前端）
- QA Engineer（测试与质量）

## 2. 角色职责
### Lead / PM（不写代码）
- 负责需求分析、架构设计、任务拆分、里程碑管理。
- 使用 superpowers 完成规划、执行监督、审查、调试策略、最终验收。
- 指定任务边界（精确到文件路径、接口契约、验收标准）。
- 负责 Git 提交策略与分支合并决策。
- 不直接编写业务代码。

### Backend Engineer
- 负责服务端代码、API、数据库 schema、migration。
- 负责后端单元测试、集成测试。
- 按 Lead 指令在指定目录开发并提交。

### Frontend Engineer
- 负责前端页面、组件、样式、交互逻辑。
- 执行前端代码审查与基础安全审计（输入校验、XSS/CSRF 基础防护、敏感信息暴露检查）。
- 与 Backend 对齐 API 合同，避免字段漂移。

### QA Engineer
- 制定 test cases（功能、边界、异常、回归）。
- 执行 E2E 测试与冒烟测试。
- 提交结构化 QA 报告给 Lead，阻断高风险发布。

## 3. RACI（简版）
- 需求定义：Lead(A), QA(C), FE(C), BE(C)
- 架构设计：Lead(A), BE(R), FE(C), QA(C)
- API & DB：BE(R), Lead(A), QA(C), FE(C)
- UI & 交互：FE(R), Lead(A), QA(C), BE(C)
- 测试计划：QA(R), Lead(A), FE(C), BE(C)
- 发布验收：Lead(A), QA(R), FE(C), BE(C)

## 4. 协作原则
- 一切任务必须有：目标、文件范围、验收标准、测试命令。
- Lead 只做规划与审核，不直接写实现代码。
- 任务完成必须先过测试再请求代码审查。
- 严重缺陷优先级高于新功能。
