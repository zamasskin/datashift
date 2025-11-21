# DataShift

DataShift is a Node.js + React + Vite application for configuring and monitoring data migrations and sources. This README covers project overview, local setup, available scripts, internationalization (i18n), and development tips.

## Overview

- Frontend: `React` + `Inertia` with `Vite` for bundling and HMR.
- UI: `Tailwind`, `Radix UI`, `Lucide/Tabler` icons.
- Databases: MySQL, PostgreSQL, SQLite supported.
- Testing: `@japa/*` for unit/integration and `Playwright` for e2e.
- Internationalization: JSON-based dictionaries with a client hook for translations.

## Current Capabilities

- Migrate and monitor data between systems.
- Database connectors: MySQL, PostgreSQL, SQLite.
- Global search across navigation, migrations, sources, and errors.
- Notifications center with mute and clear-all actions.
- Language toggle (EN/RU) and dot-path keys for translations.

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

## Project Structure

- `app/` — Server-side application files (controllers, middleware, services, models).
- `config/i18n.ts` — i18n configuration (default locale, loaders).
- `inertia/` — React frontend components and hooks.
  - `inertia/components/` — UI components.
  - `inertia/hooks/useI18nLocal.tsx` — Client hook for translations.
- `resources/lang/{locale}/` — JSON translation dictionaries per locale.
- `start/` — Server boot files and route registration.
- `database/` — Migrations/seeders (if used).

## Internationalization (i18n)

This project uses server-side locale detection and a simple client hook to access translations within React components.

### Server-side

- Locale is determined from the `locale` cookie or the `Accept-Language` header. If neither is available, it falls back to `config/i18n.ts` → `defaultLocale`.
- Translations for the selected locale are shared to the client so the interface renders with the correct language on first load.

### Client-side

- Use the `useI18nLocal` hook to access translations in React:

  ```tsx
  import { useI18n } from '~/inertia/hooks/useI18nLocal'

  export function Example() {
    const { t, locale } = useI18n('help') // optional namespace
    return <h1>{t('title', 'Help')}</h1>
  }
  ```

- The hook supports dot-path keys and optional fallbacks:
  - `t('globalSearch.placeholder')`
  - `t('notifications.title', 'Notifications')`

### Changing Language

- In the UI, use the language toggle (RU/EN) which posts to `POST /settings/locale`.
- The server sets a `locale` cookie valid for one year and redirects back.
- On next render, locale detection picks the cookie and the UI updates to the selected language.

### Default Locale

- The default locale is configured in `config/i18n.ts` via `defaultLocale`.
- To change default to English:
  - Open `config/i18n.ts`
  - Set `defaultLocale: 'en'`
  - Restart the dev server.

### Adding Translations

1. Create a JSON file under `resources/lang/{locale}/` (e.g., `resources/lang/en/notifications.json`).
2. Use nested objects or dot-paths for organization:

   ```json
   {
     "notifications": {
       "title": "Notifications",
       "empty": "No notifications yet"
     }
   }
   ```

3. In your component, reference the keys with `t()`:

   ```tsx
   const { t } = useI18n('notifications')
   <h3>{t('title')}</h3>
   <p>{t('empty')}</p>
   ```

4. Provide translations for each supported locale (`en`, `ru`, etc.). Missing keys will fall back to the provided default string when using `t(key, fallback)`.

## Localization Examples

- `GlobalSearch` (`inertia/components/global-search.tsx`)
  - Translation files: `resources/lang/en/globalSearch.json`, `resources/lang/ru/globalSearch.json`
  - Keys include groups (navigation, migrations, sources, errors), placeholder, statuses, and messages.

- `NotificationsButton` (`inertia/components/errors/notifications-button.tsx`)
  - Translation files: `resources/lang/en/notifications.json`, `resources/lang/ru/notifications.json`
  - Keys include button `aria-label`, popover title, empty state message, mute, clear-all.

## Development Tips

- If language changes don’t reflect immediately:
  - Confirm the `locale` cookie updated (via DevTools → Application → Cookies).
  - Ensure the translation file for the selected locale exists and contains the referenced keys.
  - Use dot-path keys consistently (e.g., `notifications.title`).
  - Reload the page after switching locale to ensure server middleware shares updated translations.

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

- Keep translations synchronized across locales when updating UI copy.
- Prefer `t(key, fallback)` to ensure graceful behavior when a key is temporarily missing.
- Follow existing code style and component patterns; run `npm run lint` and `npm run format` before submitting changes.

## License

This project is private and unlicensed.