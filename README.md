# Zmanim App

A BeeZee-style zmanim (Jewish prayer times) application with three deployment modes: **local** (desktop), **self-hosted** (Docker), and **SaaS** (Vercel + Supabase).

## Features

- **Zmanim calculations** — Dawn, sunrise, latest Shema/Tefillah, Mincha, Plag, sunset, nightfall, candle lighting, Havdalah
- **Halachic opinions** — Multiple authorities (MGA, Tukachinsky, etc.)
- **Schedule groups** — Organize zmanim into display groups
- **Calendar engine** — Jewish calendar, holidays, special dates
- **BeeZee import** — Import data from BeeZee (BZS format)
- **Multi-mode deployment** — Local, cloud, or hybrid with sync

## Tech Stack

- **Monorepo** — npm workspaces + Turbo
- **Core** — TypeScript, kosher-zmanim, Luxon
- **Web** — Next.js 19, React 19, Tailwind CSS
- **Desktop** — Electron
- **Database** — Prisma (SQLite / PostgreSQL)
- **UI** — Shared `@zmanim-app/ui` package

## Quick Start

### Local (Desktop / Dev)

```bash
npm install
npm run dev
```

Runs the web app at [http://localhost:3000](http://localhost:3000) and starts all workspace dev servers.

### Self-Hosted (Docker)

```bash
docker compose up
```

Starts the web app and PostgreSQL. Access at [http://localhost:3000](http://localhost:3000).

> **Note:** For PostgreSQL, update `packages/db/prisma/schema.prisma` to use `provider = "postgresql"` and run migrations before or during deployment.

### Authentication (Clerk)

The web app uses [Clerk](https://clerk.com) for sign-in (Google, GitHub, email, etc.). Configure it in the Clerk dashboard, then create `apps/web/.env.local` from `apps/web/.env.example`:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Publishable key
- `CLERK_SECRET_KEY` — Secret key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/admin`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/admin`

**Without** these variables, the app still builds and runs: `/admin` and protected APIs are open (development only). **With** Clerk configured, `/admin`, `/api/org/*`, and `/api/sync/*` require a signed-in user.

### Deploy to Vercel

1. Push the repo to GitHub (see below).
2. In [Vercel](https://vercel.com), **Import** the repository.
3. Set **Root Directory** to `apps/web`.
4. Vercel reads [apps/web/vercel.json](apps/web/vercel.json): install runs from the monorepo root (`cd ../.. && npm install`), build runs `turbo` for the web app.
5. Add the **Clerk** environment variables above in the Vercel project settings (Production & Preview).

The demo uses an in-memory API store — no database is required for the hosted demo.

### SaaS (Vercel + Supabase) — optional DB

For a persistent database later, create a Supabase project and set `DATABASE_URL` (and run Prisma migrations). The current web API uses in-memory data by default.

### Git & GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USER/zmanim-app.git
git push -u origin main
```

## Project Structure

```
zmanim-app/
├── apps/
│   ├── web/          # Next.js web app
│   └── desktop/      # Electron desktop app
├── packages/
│   ├── core/         # Zmanim engine, calendar, halachic opinions
│   ├── db/           # Prisma schema, models
│   ├── ui/           # Shared React components
│   ├── export/       # Export utilities
│   └── importer/     # BeeZee (BZS) importer
├── docker-compose.yml
├── .env.example
└── README.md
```

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite: `file:./data/zmanim.db` or PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for NextAuth (cloud mode) |
| `NEXTAUTH_URL` | Public URL of the app |
| `APP_MODE` | `local` \| `cloud` \| `hybrid` |
| `SYNC_SERVER_URL` | Sync server URL (hybrid mode) |
| `SYNC_POLL_INTERVAL` | Poll interval in ms (default: 30000) |

## BeeZee Import

The app can import data from BeeZee (BZS format):

1. **Desktop:** Use the Import Wizard in the admin UI. Provide the path to your BeeZee data folder (e.g. `C:\BeeZee\data` or `/path/to/beezee`).
2. **Web:** Import via API (requires file-system access). For self-hosted deployments, the import path must be accessible from the server.

The importer reads:

- Styles, settings, zmanim definitions
- Schedule groups, calendar entries
- Yahrzeits, RTF content

## Development

```bash
# Install dependencies
npm install

# Run all packages in dev mode
npm run dev

# Build all packages
npm run build

# Lint
npm run lint

# Clean build artifacts
npm run clean
```

### Package Scripts

- **@zmanim-app/core** — `npm run build` / `npm run dev` (tsc)
- **@zmanim-app/db** — `npm run db:generate`, `npm run db:push`, `npm run db:migrate`
- **@zmanim-app/web** — `npm run dev`, `npm run build`, `npm run start`
- **@zmanim-app/desktop** — `npm run dev`, `npm run build`, `npm run package`

## License

Copyright © 2026
