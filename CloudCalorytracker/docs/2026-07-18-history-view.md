# 2026-07-18 — History View + Date Navigation

Decision log for browsing past days. Follows the
[custom foods](./2026-07-18-custom-foods.md) work and completes the original
roadmap. Also includes the app rename to "Calorie Tracker".

## Goal

Let the user view any past day (not just today), compare recent days at a
glance, and backfill-log foods to a day other than today.

## What was built

- **`log_date` column** (local `YYYY-MM-DD`) on `log_entries` — the
  authoritative day-grouping key. Added via `ensureColumn()` and backfilled from
  each row's `logged_at` date portion.
- **`getLog(date?)`** (replaces the today-only query) and **`getHistory(days)`**
  in `lib/db.ts`; `addEntry` takes an optional `date`.
- **`GET /api/log?date=`**, **`POST /api/log`** with optional `date`, and
  **`GET /api/history?days=`**.
- **`lib/dates.ts`** — local-date helpers (`todayStr`, `addDays`,
  `formatDayLabel`, `isValidDateStr`).
- **`DateNav`** (prev/next day, "jump to today", future blocked) and
  **`HistoryPanel`** (last-14-days bars vs. a goal marker, click to open a day).
- `SummaryHeader` shows the selected day's label; `page.tsx` tracks
  `selectedDate` and reloads the log + history when it changes.
- Heading renamed **"CloudCaloryTracker" → "Calorie Tracker"** (h1 + tab title).

## Key technical decisions

### Add an explicit `log_date` column instead of parsing timestamps
The previous code grouped "today" by `substr(logged_at,1,10)` (the **UTC** date
of the ISO timestamp) but computed `todayKey()` from the **local** date — a
latent mismatch that could hide or misplace entries near midnight. A dedicated
`log_date`, written from the local date (or the caller-supplied date), makes
grouping unambiguous, makes date-scoped queries a simple equality, and decouples
the day key from timestamp timezone quirks. Existing rows were backfilled.

### Backfill logging stamps the chosen day, keeps the time-of-day
`addEntry` builds `logged_at` as `logDate + <current time portion>`. A food
added while viewing a past day gets that day's `log_date` and a realistic
time-of-day for display, and `substr(logged_at,1,10)` stays consistent with
`log_date`.

### History is a SQL rollup, scaled in the query
`getHistory` does `SUM(calories * quantity)` (etc.) grouped by `log_date`,
ordered newest-first, `LIMIT days`. Scaling in SQL keeps it a single query; the
per-day rounding is applied in JS to match how single-day totals round.

### Client owns the selected date; server validates it
`selectedDate` lives in `page.tsx`; the log/history reload on change. The server
validates any incoming `date` against a `YYYY-MM-DD` shape and silently falls
back to today on garbage rather than erroring — friendlier for a URL param.

### HistoryPanel scale + goal marker
Bars scale against `max(goal, biggestDay)` so nothing overflows and the goal
line stays meaningful; days over goal render amber, others emerald. Clicking a
bar sets the selected date, tying the two views together.

## Notable events during the build

- New column → the usual dev-server restart so `initDb()` (migration +
  backfill) ran on a fresh connection.
- The `curl` UI check tripped on an apostrophe in a grep pattern (`Today's`);
  reran without it. No code issue.
- Verified date-scoping specifically because live preview data had grown: a
  backfilled test entry landed on 2026-07-16 and was correctly absent from
  today, confirming grouping works. Test entry cleaned up afterward.

## Verification

- `tsc --noEmit` clean.
- Live: migration backfilled existing rows under today; logging to 2026-07-16
  created an entry visible only on that day; `GET /api/history` returned per-day
  rollups newest-first; invalid `?date=` fell back to today; page renders the
  date nav, history panel, renamed heading, and all cards.

## Open items / next steps

- Edit an entry's food/macros (only quantity is editable today).
- Edit custom foods in place.
- Macro goals; tests; a shared zod validation layer across routes.
