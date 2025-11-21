# DataShift

DataShift is a Node.js + React + Vite application for configuring and monitoring data migrations and sources. This README covers project overview, local setup, available scripts, and development tips.

## Overview

- Frontend: `React` + `Inertia` with `Vite` for bundling and HMR.
- UI: `Tailwind`, `Radix UI`, `Lucide/Tabler` icons.
- Databases: MySQL, PostgreSQL, SQLite supported.
- Testing: `@japa/*` for unit/integration and `Playwright` for e2e.

## Current Capabilities

- Migrate and monitor data between systems.
- Database connectors: MySQL, PostgreSQL, SQLite.
- Global search across navigation, migrations, sources, and errors.
- Notifications center with mute and clear-all actions.

## Planned Connectors

- REST API
- SOAP
- GraphQL

## Prerequisites

- Node.js 20+ (recommended) and npm 10+.
- A database if you plan to run migrations (Postgres/MySQL/SQLite).
- Recommended: modern browser with JS enabled for HMR.

## Quick Start

1. Install dependencies
   - `npm install`

2. Configure environment
   - Copy example env: `cp .env.example .env` (if present)
   - Generate app key: `node ace generate:key` (writes `APP_KEY` into `.env`)
   - Configure database connection in `.env` if you plan to run migrations

3. Run database migrations (optional, if the app uses DB tables)
   - `node ace migration:run`

4. Start development server with HMR
   - `npm run dev`
   - The server prints a local URL (e.g., `http://localhost:52944`). Open it in the browser.

## Scripts

- `npm run dev` — Start development server with HMR (`node ace serve --hmr`).
- `npm run build` — Build server and frontend (`node ace build`).
- `npm start` — Run the built server (`node bin/server.js`).
- `npm run test` — Run unit/integration tests (Japa).
- `npm run e2e` — Run Playwright end-to-end tests (headless).
- `npm run e2e:headed` — Run Playwright tests in headed mode.
- `npm run lint` — Lint with ESLint.
- `npm run format` — Format with Prettier.
- `npm run typecheck` — Type-check with TypeScript.

## Docker

- Build image: `docker build -t datashift:latest .`
- Run container: `docker run -p 3333:3333 -e APP_KEY=your_app_key datashift:latest`
- Compose (app + MySQL): `docker compose up -d`

### Environment variables for Docker

- `APP_KEY` — required. Provide a strong random string.
- `LOG_LEVEL` — optional, defaults to `info`.
- `TZ` — optional, defaults to `UTC`.
- Database (MySQL by default):
  - `DB_HOST` — set to `db` when using compose.
  - `DB_PORT` — `3306`.
  - `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` — defaults are `app`.

### Using docker compose

- Services:
  - `app` — builds from `Dockerfile`, exposes `3333`.
  - `db` — MySQL 8 with persistent volume and healthcheck.
- Steps:
  - Create `.env` (or export env) with at least `APP_KEY`.
  - Start: `docker compose up -d`.
  - Open: `http://localhost:3333`.

### Generating `APP_KEY`

- macOS/Linux: `openssl rand -base64 32`
- Paste into `.env` or pass with `-e APP_KEY=...`.

### Notes

- Container runs with `NODE_ENV=production` and listens on `0.0.0.0:3333`.
- Environment variables are injected at runtime; `.env` is not baked into the image.
- To use PostgreSQL, swap the DB image and ports in `docker-compose.yml` and adjust envs.

## Project Structure

- `app/` — Server-side application files (controllers, middleware, services, models).
- `inertia/` — React frontend components and hooks.
  - `inertia/components/` — UI components.
- `start/` — Server boot files and route registration.
- `database/` — Migrations/seeders (if used).


## Development Tips

- Common commands:
  - Restart dev server: `Ctrl+C` then `npm run dev`
  - Run unit tests: `npm run test`
  - Run E2E tests: `npm run e2e` or `npm run e2e:headed`
  - Lint & format: `npm run lint` and `npm run format`

## Build & Deploy

- Build the project for production:
  - `npm run build`

- Start the built server:
  - `npm start`

- Recommended environment vars for production:
  - `NODE_ENV=production`
  - `APP_KEY` (generated via `node ace generate:key`)
  - Database connection settings if applicable.

## Contributing

- Follow existing code style and component patterns.
- Run `npm run lint` and `npm run format` before submitting changes.

## License

License: MIT. See `LICENSE` for the full text.