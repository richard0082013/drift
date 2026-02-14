# Week 1 执行交接单（Parallel Session）

## 新会话启动指令
1. 在 `drift` 项目根目录打开新会话。
2. 先运行并加载技能：
   - `~/.codex/superpowers/.codex/superpowers-codex bootstrap`
   - `~/.codex/superpowers/.codex/superpowers-codex use-skill superpowers:executing-plans`
3. 告知代理执行目标文件：
   - `docs/team/assignments/week-1.md`

## 执行顺序（建议）
- Batch 1（P0）
  - P0-BE-01
  - P0-BE-02
  - P0-FE-01
  - P0-QA-01
- Batch 2（P1）
  - P1-BE-01
  - P1-BE-02
  - P1-FE-01
  - P1-QA-01
- Batch 3（P2 + 收尾）
  - P2-FE-02
  - P2-BE-03
  - LEAD-01 ~ LEAD-03

## 每个 Batch 的强制动作
- 完成后执行代码审查：`superpowers:requesting-code-review`
- 遇到失败先调试：`superpowers:systematic-debugging`
- 给出测试证据后再进入下一批

## 完成判定
- QA 报告为 Go
- 无 P0/P1 未关闭缺陷
- 进入 `superpowers:finishing-a-development-branch`
