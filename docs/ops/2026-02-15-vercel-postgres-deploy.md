# Vercel PostgreSQL Deploy (P0-DeployFix)

This project now uses Prisma with a PostgreSQL datasource.

## Required Vercel Environment Variables

Set these for `Preview` and `Production`:

- `DATABASE_URL`
  - Example: `postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public`
- `AUTH_SESSION_SECRET`
  - Long random secret used to sign session cookies.
- `INTERNAL_JOB_TOKEN`
  - Token for internal job endpoints such as `/api/internal/jobs/purge-users`.

Optional but recommended:

- `RATE_LIMIT_MAX_LOGIN`
- `RATE_LIMIT_MAX_EXPORT`
- `RATE_LIMIT_MAX_ACCOUNT_DELETE`
- `REMINDER_PROVIDER` (`email` or `noop`)
- `EMAIL_FROM` (when `REMINDER_PROVIDER=email`)
- `EMAIL_API_KEY` (when `REMINDER_PROVIDER=email`)

## Deploy-Time Database Commands

After each deployment (or before promoting a release), run:

```bash
npm run db:migrate
npm run db:seed
```

Equivalent Prisma commands:

```bash
npx prisma migrate deploy
npx prisma db seed
```

## Local PostgreSQL Smoke Check

1. Point `.env`/`.env.local` `DATABASE_URL` to a PostgreSQL database.
2. Apply migrations and seed:

```bash
npm run db:migrate
npm run db:seed
```

3. Verify login and write path:
   - `POST /api/auth/login` should return `200`.
   - `POST /api/checkins` should return `201` for valid payload.
