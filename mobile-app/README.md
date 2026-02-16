# Drift Mobile App

Mobile companion for Drift - personal stability early-warning system.

## Architecture

- Shares backend API and database with the web app
- Mobile-specific auth via Bearer token (web uses httpOnly cookie)
- UI-first development: mock adapters during initial build, real API integration later

## Tech Stack (Recommended)

- Expo SDK 52+
- React Native 0.76+
- TypeScript 5.x
- React Navigation 7
- Expo SecureStore (token storage)

## Design Reference

- Product design: `docs/plans/2026-02-15-drift-mobile-app-design.md`
- Screen PRD: `mobile-app/docs/v1-screen-prd.md`
- API field mapping: `mobile-app/docs/api-field-mapping.md`
- Mobile architecture: `mobile-app/docs/mobile-architecture.md`
- Execution plan: `mobile-app/docs/execution-plan.md`

## Getting Started

> Mobile app initialization pending. Run `npx create-expo-app` here when ready.
