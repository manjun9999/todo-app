# Calorie Tracker

A simple, single-page calorie and macro tracker. Search a catalog of common
foods, tap to add them to the day's log, and watch your running calorie/macro
totals at the top. No login, no accounts — just open it and track.

> The app displays as **"Calorie Tracker"**; the repo/package name is
> `cloud-calory-tracker` and the directory is `CloudCalorytracker`.

## What it does

- **Search bar** filters a built-in catalog of 25 common foods (chicken, rice,
  eggs, banana, …) by name or category.
- **Tap to add** — one click logs a food with its calories, protein, carbs,
  fat, and serving size.
- **Adjustable quantities** — pick how many servings before adding (e.g. 2 eggs,
  1.5 cups rice), and adjust the quantity on any logged entry afterward. Macros
  and totals scale automatically.
- **Custom foods** — define your own food (name, serving, macros); it's saved to
  the database and appears in the catalog/search alongside built-ins, marked
  "Custom". Deleting a custom food leaves already-logged entries intact.
- **Daily log** lists what you've eaten today (newest first) with a per-item
  quantity stepper and remove button.
- **Summary header** shows today's total calories and macro breakdown, updating
  as you add or remove foods.
- **Daily goal** — set a calorie target; the header shows a progress bar,
  remaining calories, and flips to "over goal" once you pass it.
- **History view** — navigate to any past day (with a "Last 14 days" panel that
  compares each day's calories against your goal), and backfill-log foods to the
  day you're viewing.
- **Persistent** — the log and goal are saved to a local SQLite database, so
  they survive page refreshes and server restarts. Entries are grouped by
  local calendar day (`log_date`).

## Tech stack

| Layer     | Choice                                        |
| --------- | --------------------------------------------- |
| Framework | Next.js 16 (App Router)                       |
| UI        | React 19                                      |
| Language  | TypeScript (strict)                           |
| Styling   | Tailwind CSS 3                                |
| Database  | SQLite via `better-sqlite3` (synchronous)     |
| Runtime   | Node.js                                        |

## Running it

```bash
npm install       # installs deps; approves better-sqlite3's native build
npm run dev       # start dev server at http://localhost:3000
```

Other scripts:

```bash
npm run build     # production build (also typechecks + lints)
npm run start     # serve the production build
```

> **Note:** `better-sqlite3` is a native module. If `npm install` reports its
> install script was blocked, run `npm approve-scripts better-sqlite3` (already
> recorded in `package.json` under `allowScripts`).
>
> **`sharp`:** Next 16 lists `sharp` as an optional image-optimization
> dependency; its install script is left unapproved because the app doesn't use
> `next/image`. If you add `next/image`, run `npm approve-scripts sharp`.
>
> **postcss** is pinned via `overrides` to `^8.5.19` so Next's nested copy stays
> on a patched version (see the 2026-07-18 dependency-upgrade decision log).

## Folder structure

```
CloudCalorytracker/
├── app/
│   ├── layout.tsx            Root layout + metadata
│   ├── page.tsx              Main single-page UI (client component)
│   ├── globals.css           Tailwind entry + base styles
│   └── api/
│       ├── log/
│       │   ├── route.ts      GET (today's log + totals + goal), POST (add entry)
│       │   └── [id]/route.ts PATCH (change quantity), DELETE (remove entry)
│       ├── goal/route.ts     GET / PUT the daily calorie goal
│       ├── foods/
│       │   ├── route.ts      GET (list custom foods), POST (create)
│       │   └── [id]/route.ts DELETE (remove a custom food)
│       └── history/route.ts  GET per-day rollups
├── components/
│   ├── SummaryHeader.tsx     Calorie total, macro tiles, goal + progress bar
│   ├── DateNav.tsx           Prev/next day + "jump to today"
│   ├── SearchBar.tsx         Food search input
│   ├── AddFoodForm.tsx       Collapsible form to create a custom food
│   ├── FoodCard.tsx          Food card with quantity stepper + Add button
│   ├── DailyLog.tsx          Log list with quantity steppers + remove buttons
│   ├── HistoryPanel.tsx      Last-N-days bars vs goal
│   └── QuantityStepper.tsx   Reusable −/+ quantity control
├── lib/
│   ├── types.ts              Shared domain types (Food, CatalogFood, LogEntry)
│   ├── foods.ts              Static catalog of 25 common foods
│   ├── dates.ts              Local-date helpers (YYYY-MM-DD)
│   └── db.ts                 SQLite connection, schema, queries
├── data/                     SQLite database file (gitignored, auto-created)
├── docs/                     Decision log(s)
└── CLAUDE.md                 This file
```

## Data model

- **Food** (static, `lib/foods.ts`): `id, name, emoji, category, serving,
  calories, protein, carbs, fat` — nutrition per one serving. **Custom foods**
  (SQLite table `custom_foods`) share this shape and are surfaced as
  `CatalogFood` (`custom: true`, `dbId`) merged into the same catalog.
- **LogEntry** (SQLite table `log_entries`): a snapshot of a food at the moment
  it was logged, plus `id`, `quantity`, `log_date`, and `loggedAt`. Snapshotting
  means editing the catalog later never rewrites past log history. The macro
  columns store **per-serving** values; the eaten amount is `value × quantity`,
  computed on read — so quantity can be edited later without losing precision.
  `log_date` (local `YYYY-MM-DD`) is the authoritative day-grouping key.
- **Settings** (SQLite table `settings`): a small key/value store; currently
  holds `daily_calorie_goal` (default 2000, clamped to 500–10000).

## API

| Method | Route            | Purpose                                       |
| ------ | ---------------- | --------------------------------------------- |
| GET    | `/api/log?date=` | A day's entries + totals + goal (default today) |
| POST   | `/api/log`       | Add an entry `{ foodName, quantity, date?, ... }` |
| PATCH  | `/api/log/[id]`  | Change an entry's quantity `{ quantity }`     |
| DELETE | `/api/log/[id]`  | Remove an entry by id                         |
| GET    | `/api/history?days=` | Per-day rollups, newest first (default 14) |
| GET    | `/api/goal`      | Current daily calorie goal                    |
| PUT    | `/api/goal`      | Set the daily calorie goal `{ goal }`         |
| GET    | `/api/foods`     | List user-defined custom foods                |
| POST   | `/api/foods`     | Create a custom food `{ name, serving, ... }` |
| DELETE | `/api/foods/[id]`| Delete a custom food (keeps past log entries) |

Totals are always computed server-side so the client can't drift out of sync.
`GET /api/log` also returns the goal, so the UI gets everything in one fetch.

## What's coming next

The original roadmap (quantities, goal, custom foods, history) is complete.
Remaining ideas:

- **Edit entries** — quantity is editable, but not the food/macros of an entry.
- **Edit custom foods** in place (currently create/delete only).
- **Macro goals** — protein/carbs/fat targets alongside the calorie goal.
- **Tests** — unit tests for `lib/db.ts` scaling/totals math and route validation.
- **Shared validation** — a zod layer to replace hand-rolled parsing across routes.

## Known limitations

- Nutrition values are rounded approximations from standard references, not
  clinical data.
- Single-user and single-device: the database is a local file, not synced.
- Day grouping uses the server's local timezone (`log_date`), so logging from a
  very different timezone than the server could land an entry on an unexpected
  day.
