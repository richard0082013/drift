# Week 1 QA Report (P1)

## Scope
- E2E 主链路冒烟：打卡 -> 趋势 -> 提醒
- 读取接口正常态覆盖：`/api/trends`、`/api/alerts`（E2E 中 mock 200 响应并校验页面消费结果）
- 对应脚本：`tests/e2e/mvp-flow.spec.ts`

## 执行结果
- 执行命令：`npx playwright test tests/e2e/mvp-flow.spec.ts`
- 结果：1 passed（2026-02-14）
- 关键断言：
  - 打卡提交成功或重复提交提示可见
  - 趋势页读取接口返回数据后，列表项 `2026-02-14 E:4 S:3 C:2` 可见
  - 提醒页读取接口返回数据后，`reason/action` 文案可见

## 缺陷清单
- DEF-001（已修复）：打卡接口在空用户数据下触发外键错误
  - 严重级别：Important
  - 修复：打卡接口写入前对当前用户执行 `upsert`
- DEF-002（测试环境问题，已规避）：沙箱下 `next dev` 监听 `3000` 端口报 `EPERM`
  - 严重级别：Minor（环境限制）
  - 处理：E2E 验证阶段使用提权命令启动服务

## Go / No-Go
- 结论：Go
- 备注：当前主链路与读取接口正常态（200 响应）均有 E2E 覆盖与通过证据。
