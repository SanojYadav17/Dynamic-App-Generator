# Dynamic App Generator

Config-driven full-stack demo for the Full Stack Developer internship task.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma-ready PostgreSQL schema
- JSON-driven runtime with forms, dashboard, and tables

## Feature coverage

- Dynamic runtime core:
	- Reads JSON config and normalizes invalid or missing fields
	- Renders sections, metrics, forms, and tables from config
- Frontend:
	- Loading state and error state included
	- Unknown/missing config values handled with defaults
- Backend:
	- Config endpoint: `GET /api/config`
	- Run management: `GET /api/runs`, `POST /api/runs`
	- Dynamic resource endpoints: `GET /api/runtime/:resource`, `POST /api/runtime/:resource`
- Basic authentication:
	- Signup: `POST /api/auth/signup`
	- Login (password): `POST /api/auth/login`
	- Login (OTP): `POST /api/auth/login-otp`
	- OTP request: `POST /api/auth/request-otp`
	- User-scoped run access via ownerId and request header
- Notifications & communication:
	- Event feed: `GET /api/notifications`
	- Event trigger: `POST /api/notifications`
	- Transactional email (mock): `POST /api/email/send`
- Database:
	- Prisma schema included and PostgreSQL-ready
	- Run persistence uses Prisma when `DATABASE_URL` is configured, with in-memory fallback for local demo
- Optional feature implemented:
	- CSV import endpoint: `POST /api/import/csv`

## Implemented mandatory features

- Dynamic forms (config-generated)
- Dynamic data table (config-generated)
- Dashboard metrics and section cards
- Basic auth endpoints
- Multiple login methods (password + OTP)
- User-scoped data access behavior
- Dynamic runtime resource APIs
- CSV import -> map -> store flow
- Event notifications and mock transactional email

## What it does

- Reads structured app configuration from local JSON
- Renders a dynamic landing page, form builder, dashboard, and data table
- Exposes API routes for config and generated app state
- Includes schema validation and fallback handling for incomplete configs

## Run locally

1. Copy `.env.example` to `.env` and set `DATABASE_URL` if you want Prisma connected to PostgreSQL.
2. Install dependencies with `npm install`.
3. Start the app with `npm run dev`.
4. Build for production with `npm run build`.

## Notes

- The app uses a local demo dataset by default so it can run even before a database is connected.
- Prisma schema is included for PostgreSQL deployment.
- In this demo, auth and generated runs are memory-backed for simplicity; Prisma model is ready to persist runs.