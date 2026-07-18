# CloudCaloryTracker

A simple, single-page calorie and macro tracker. Search a catalog of common
foods, tap to add them to today's log, and watch your running calorie/macro
totals at the top. No login, no accounts — just open it and track.

## What it does

- **Search bar** filters a built-in catalog of 25 common foods (chicken, rice,
  eggs, banana, …) by name or category.
- **Tap to add** — one click logs a food with its calories, protein, carbs,
  fat, and serving size.
- **Daily log** lists what you've eaten today (newest first) with a per-item
  remove button.
- **Summary header** shows today's total calories and macro breakdown, updating
  as you add or remove foods.
- **Persistent** — the log is saved to a local SQLite database, so it survives
  page refreshes and server restarts. The log is scoped per calendar day.

## Tech stack

| Layer     | Choice                                        |
| --------- | --------------------------------------------- |
| Framework | Next.js 14 (App Router)                       |
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

## Folder structure

```
CloudCalorytracker/
├── app/
│   ├── layout.tsx            Root layout + metadata
│   ├── page.tsx              Main single-page UI (client component)
│   ├── globals.css           Tailwind entry + base styles
│   └── api/
│       └── log/
│           ├── route.ts      GET (today's log + totals), POST (add entry)
│           └── [id]/route.ts DELETE (remove entry by id)
├── components/
│   ├── SummaryHeader.tsx     Calorie total + macro tiles
│   ├── SearchBar.tsx         Food search input
│   ├── FoodCard.tsx          Tappable food card
│   └── DailyLog.tsx          Log list + remove buttons
├── lib/
│   ├── types.ts              Shared domain types (Food, LogEntry, Totals)
│   ├── foods.ts              Static catalog of 25 common foods
│   └── db.ts                 SQLite connection, schema, queries
├── data/                     SQLite database file (gitignored, auto-created)
├── docs/                     Decision log(s)
└── CLAUDE.md                 This file
```

## Data model

- **Food** (static, `lib/foods.ts`): `id, name, emoji, category, serving,
  calories, protein, carbs, fat` — nutrition per one serving.
- **LogEntry** (SQLite table `log_entries`): a snapshot of a food at the moment
  it was logged, plus `id` and `loggedAt`. Snapshotting means editing the
  catalog later never rewrites past log history.

## API

| Method | Route            | Purpose                                  |
| ------ | ---------------- | ---------------------------------------- |
| GET    | `/api/log`       | Today's entries + computed totals        |
| POST   | `/api/log`       | Add an entry `{ foodName, serving, ... }`|
| DELETE | `/api/log/[id]`  | Remove an entry by id                    |

Totals are always computed server-side so the client can't drift out of sync.

## What's coming next

- **Custom foods** — add foods not in the catalog, with your own macros.
- **Adjustable servings / quantities** — log "2 eggs" or "1.5 cups rice".
- **Daily calorie goal** — set a target and show progress against it.
- **History view** — browse and compare previous days, not just today.
- **Edit entries** — currently entries can only be added or removed.
- **Tests** — unit tests for `lib/db.ts` totals math and API route validation.

## Known limitations

- Nutrition values are rounded approximations from standard references, not
  clinical data.
- Single-user and single-device: the database is a local file, not synced.
- "Today" uses the server's local timezone.
