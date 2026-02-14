# Drift 架构设计（MVP）

## 1. 架构目标
- 支持低负担高频打卡与趋势分析。
- 将“记录、检测、提醒、解释”分层解耦，便于后续接入 AI Pro 能力。
- 以简单稳定优先，避免早期过度工程化。

## 2. 推荐技术栈
- 前端：Next.js（App Router）+ TypeScript + Tailwind
- 后端：Next.js Route Handlers（或独立 Node API）
- 数据库：PostgreSQL（建议 Supabase 托管）
- 定时任务：Cron（Vercel Cron / Supabase Scheduled Functions）
- 通知：应用内 + Email（后续加 Push）
- 可观测性：基础日志 + Sentry（前后端）

## 3. 系统组件
- Client App
  - 打卡页
  - 趋势页（7/30 天）
  - 设置页（提醒时间、时区、隐私）
- API Layer
  - auth
  - checkins
  - trends
  - alerts
- Drift Engine
  - 规则计算（MVP）
  - 漂移指数聚合
  - 触发原因生成（可解释文本）
- Notification Worker
  - 每日提醒发送
  - 漂移告警发送
- Data Layer
  - 用户、打卡、漂移结果、通知日志、偏好设置

## 4. 数据模型（核心表）
- `users`
  - `id`, `email`, `timezone`, `created_at`
- `daily_checkins`
  - `id`, `user_id`, `date`, `energy`, `stress`, `social`, `key_contact`, `note`, `created_at`
  - 唯一约束：`(user_id, date)`
- `drift_scores`
  - `id`, `user_id`, `date`, `drift_index`, `energy_trend`, `stress_trend`, `social_trend`, `reasons_json`
- `alerts`
  - `id`, `user_id`, `date`, `alert_type`, `severity`, `message`, `status`
- `notification_logs`
  - `id`, `user_id`, `channel`, `template_id`, `sent_at`, `delivery_status`
- `user_preferences`
  - `user_id`, `reminder_time_local`, `reminder_enabled`, `quiet_hours`, `consent_flags`

## 5. 核心流程
### 5.1 每日打卡
1. 客户端提交今日指标。
2. API 做字段校验与去重。
3. 写入 `daily_checkins`。
4. 异步触发 Drift Engine 计算今日趋势。

### 5.2 漂移检测（MVP 规则）
- 规则示例（可配置）：
  - 精力 3 天均值较上周下降 >= 1.0。
  - 压力 3 天均值 >= 4 且连续 2 天上升。
  - 社交指标 7 天斜率持续为负。
- 输出：`drift_index` + `reasons_json`。
- 超阈值则生成 `alerts`。

### 5.3 提醒发送
1. Worker 拉取当日待发提醒。
2. 根据 `user_preferences` 选择时区和渠道。
3. 发送并记录 `notification_logs`。

## 6. AI Pro 扩展位
- 新增 `analysis_jobs` 与 `ai_insights` 表。
- 异步任务读取近 30-90 天数据生成周报。
- AI 输出需经过“安全模板层”规避医疗化表达。

## 7. 安全与隐私设计
- RLS（按用户隔离数据）
- 数据最小化：MVP 不采集敏感生物信息。
- 导出与删除：提供自助导出与账号删除流程。
- 法律文案：首屏明确“非医疗建议”。

## 8. 可观测性与错误处理
- API 统一错误码：`VALIDATION_ERROR`、`DUPLICATE_CHECKIN`、`UNAUTHORIZED`。
- 关键事件埋点：打卡提交、提醒触发、提醒点击、建议执行反馈。
- Drift Engine 失败重试与死信队列（后续）。

## 9. 版本演进建议
- V0（2-4 周）：规则引擎 + 基础提醒 + 趋势页
- V1（4-8 周）：提醒优化、解释增强、导出与隐私完善
- V2（8+ 周）：AI 解读与行动建议（Pro）
