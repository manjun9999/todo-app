# 2026-07-18 — Initial Build

Decision log for the first working version of CloudCaloryTracker.

## Goal

Build a single-page calorie tracker from scratch: search 20+ common foods, add
them with one tap, see a daily log with a running calorie/macro total, and
persist the log locally so it survives refreshes. No login, no accounts. Must
run with `npm run dev` at `localhost:3000`.

## What was built

- Next.js 14 App Router project (TypeScript strict, Tailwind CSS 3).
- Static catalog of **25 common foods** (`lib/foods.ts`) across six categories
  (Protein, Grains, Fruit, Vegetables, Dairy, Snacks), each with serving size
  and calories/protein/carbs/fat.
- SQLite persistence via `better-sqlite3` (`lib/db.ts`) with a `log_entries`
  table, day-scoped queries, and server-side totals.
- Three Route Handlers: `GET`/`POST /api/log` and `DELETE /api/log/[id]`.
- UI: `SummaryHeader`, `SearchBar`, `FoodCard`, `DailyLog`, composed in
  `app/page.tsx` (client component) with optimistic delete.
- `CLAUDE.md` project doc; `.gitignore` updated for `.next/`, `data/`, `*.db`.

## Key technical decisions

### Next.js App Router + Route Handlers
Chosen per the stack requirement. The App Router's colocated Route Handlers let
the API and UI live in one project with no separate server, and keep the DB
access strictly server-side (the browser only sees JSON).

### SQLite (`better-sqlite3`) over localStorage
The brief said "local database … persists across page refreshes." localStorage
would satisfy refresh-persistence but isn't a database and is client-only. A
real SQLite file (`data/tracker.db`) is a genuine local DB, survives server
restarts too, and keeps a clean client/server split. `better-sqlite3` is
synchronous — simpler than async wrappers and a good fit for tiny, fast local
queries. It's a native module, so it's marked in `next.config.mjs`
(`serverComponentsExternalPackages`) to stay out of the bundle, and a single
connection is cached on `globalThis` to survive dev hot-reloads.

### Totals computed server-side
`GET /api/log` returns both entries and totals. The client never sums numbers
itself, so the displayed total can't drift from the persisted data. After every
add/delete the client re-fetches for the authoritative state.

### Snapshot nutrition into each log entry
`log_entries` stores the food's macros at log time rather than referencing a
food id. Editing or removing a catalog food later won't rewrite historical log
data. Cost: no automatic back-fill if a catalog value is corrected — acceptable
for a personal tracker.

### Day-scoped log
Entries are filtered by local calendar day (`substr(logged_at,1,10)`). The app
shows "today," matching the single-day summary in the brief. History across days
is stored but not yet surfaced (see next steps).

### Optimistic delete, confirmed add
Deletes update the UI immediately and roll back on failure (removal is safe to
predict). Adds wait for the server then re-fetch, since the new row's id and the
recomputed totals are authoritative.

## Notable events during the build

- Replaced an earlier Express API scaffold that occupied the folder (preserved
  in git history at commit `849e616`) with this Next.js app.
- `npm install` pulled `next@14.2.15`, flagged for a security advisory; bumped to
  the patched **14.2.35**.
- `better-sqlite3`'s native install script was blocked by the sandbox; approved
  it (recorded under `allowScripts` in `package.json`) and verified the module
  builds and runs.

## Verification

- `npm run build` — compiled, linted, types valid; `/` static, API routes
  dynamic.
- Live round-trip against the running dev server: empty log → add two foods
  (totals 370 kcal / 35.3 g protein, correct) → validation rejects missing
  `foodName` with 400 → delete recomputes totals to 205 kcal. DB file confirmed
  written to `data/tracker.db`.

## Open items / next steps

- Custom foods and adjustable quantities/servings.
- Daily calorie goal with progress indicator.
- Multi-day history view and per-entry editing.
- Automated tests for totals math and route validation.
- Resolve remaining `npm audit` advisories from transitive dependencies.
