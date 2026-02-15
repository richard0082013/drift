# Drift Project Memory

## Current Baseline
- Main baseline SHA: `85360617` (Phase 2 UI overhaul complete)
- Branch sync rule: `main` is the source of truth.
- Latest preview deployment URL:
  - `https://drift-8uwyolmdg-richard0082013-gmailcoms-projects.vercel.app`
- Vercel inspect URL:
  - `https://vercel.com/richard0082013-gmailcoms-projects/drift/CfefKJNLBjoy566n3wnDBDPVqdL5`

## What Milestone A Delivered (User-visible)
- `/checkin` supports user-facing daily flow:
  1. Unauthenticated: login guidance shown.
  2. Logged-in, not checked in: form shown.
  3. Submit success: instant switch to checked-in state.
  4. Refresh: checked-in state persists.
- Backend endpoint added:
  - `GET /api/checkins/today`

## Mandatory Delivery Gates (Do not skip)
1. `npm run build`
2. `npx vitest --run`
3. `npx playwright test` (release scope)

If any gate fails:
- First run `superpowers:systematic-debugging`
- End batch with `superpowers:requesting-code-review`

## Team Execution Rules (Lead-controlled)
- Lead sends 3 separate instructions (BE/FE/QA), no shared mixed instruction.
- Explicit dependency order every batch: who starts, who waits.
- QA must validate cross-role integrated flow, not isolated module-only checks.
- Required callback payload:
  - `base_sha/head_sha`
  - build/vitest/playwright results
  - Critical/Important/Minor
  - blocker/risk

## Known Local Recovery Stashes (keep for now)
- `stash@{0}: On milestone-a-p1: wip/qa-pre-milestone-a`
- `stash@{1}: On milestone-a-p1: wip/pre-week8-local-changes`
- `stash@{2}: On week7-p1: temp-week7-rebase`
- `stash@{3}: autostash`

## Next Product Goal
- Milestone B: make trends/alerts/settings also user-visible and demoable (not only API-ready).
