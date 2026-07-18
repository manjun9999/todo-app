# 2026-07-18 — Daily Calorie Goal + Progress

Decision log for adding an editable daily calorie goal with a progress
indicator. Follows the [initial build](./2026-07-18-initial-build.md).

## Goal

Let the user set a daily calorie target and see progress against it: how much of
the goal is used, how much remains, and a clear signal when they go over.

## What was built

- **`settings` table** (`lib/db.ts`) — a generic key/value store; first use is
  `daily_calorie_goal`. `getGoal()` / `setGoal()` accessors added.
- **`GET`/`PUT /api/goal`** route handler. The goal is also folded into the
  `GET /api/log` response so the UI fetches log + totals + goal in one call.
- **`SummaryHeader`** now shows `consumed / goal kcal`, a progress bar, and
  "N kcal left" (or "N kcal over goal"). Became a client component to host
  inline goal editing.
- **`page.tsx`** — `updateGoal()` with optimistic update + rollback, mirroring
  the existing delete flow.

## Key technical decisions

### Store the goal in SQLite, not localStorage
Consistency with the existing persistence model: the log already lives in
SQLite, so the goal does too. It survives restarts and keeps all state
server-authoritative. A generic `settings(key, value)` table was chosen over a
dedicated column so future single-value preferences (e.g. macro targets, units)
don't each need a schema change.

### Clamp on the server (500–10000 kcal)
`setGoal()` clamps and rounds before persisting, and returns the stored value so
the client re-syncs to whatever was actually saved. The API rejects
non-numeric/≤0 input with 400; out-of-range-but-valid numbers are clamped rather
than rejected, which is friendlier for a slider/stepper input.

### Goal rides along in `GET /api/log`
Rather than make the page issue a second fetch on load, the log response carries
`goal`. `PUT /api/goal` remains separate for updates. One fetch on mount, no
loading flicker between totals and goal.

### Progress bar caps at 100% width but color-flips when over
The fill width is clamped to 100% so the bar never overflows, but crossing the
goal switches the fill to amber and the label to "over goal" — the information
isn't lost just because the bar is full.

## Notable events during the build

- **Stale dev DB connection.** After adding the `settings` table, live requests
  500'd with `no such table: settings`. Cause: the dev server caches the
  `better-sqlite3` connection on `globalThis` to survive hot-reload, so the
  already-open connection never re-ran `initDb()` with the new `CREATE TABLE`.
  Schema code was correct; restarting the dev server resolved it. (For real
  schema evolution this is a signal to add migrations — noted below.)
- **Build vs. running dev server.** Running `npm run build` while `npm run dev`
  was live shared/overwrote `.next/` and left the dev server serving broken
  chunks. Restarted dev after building. Lesson: don't build against a live dev
  server; either stop it first or build in a clean checkout.

## Verification

- `tsc --noEmit` clean; `npm run build` compiled with `/api/goal` registered.
- Live round-trip: default goal 2000 → `PUT 2200` persists → invalid `-5`
  rejected with 400 → `99999` clamped to 10000 → goal coexists with log totals.
- Progress bar and "kcal left" confirmed present in server-rendered HTML.

## Open items / next steps

- **Schema migrations.** The stale-connection incident shows we need a real
  migration step (or a versioned schema) rather than relying on
  `CREATE TABLE IF NOT EXISTS` + process restarts.
- Goal is global, not per-day; a future history view may want per-day goals.
- Macro targets (protein/carbs/fat goals) could reuse the same `settings` table.
