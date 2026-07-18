# CloudCaloryTracker

A simple, single-page calorie and macro tracker. Search a catalog of common
foods, tap to add them to today's log, and watch your running calorie/macro
totals at the top. No login, no accounts — just open it and track.

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
- **Persistent** — the log and goal are saved to a local SQLite database, so
  they survive page refreshes and server restarts. The log is scoped per
  calendar day.

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
│       ├── log/
│       │   ├── route.ts      GET (today's log + totals + goal), POST (add entry)
│       │   └── [id]/route.ts PATCH (change quantity), DELETE (remove entry)
│       ├── goal/route.ts     GET / PUT the daily calorie goal
│       └── foods/
│           ├── route.ts      GET (list custom foods), POST (create)
│           └── [id]/route.ts DELETE (remove a custom food)
├── components/
│   ├── SummaryHeader.tsx     Calorie total, macro tiles, goal + progress bar
│   ├── SearchBar.tsx         Food search input
│   ├── AddFoodForm.tsx       Collapsible form to create a custom food
│   ├── FoodCard.tsx          Food card with quantity stepper + Add button
│   ├── DailyLog.tsx          Log list with quantity steppers + remove buttons
│   └── QuantityStepper.tsx   Reusable −/+ quantity control
├── lib/
│   ├── types.ts              Shared domain types (Food, CatalogFood, LogEntry)
│   ├── foods.ts              Static catalog of 25 common foods
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
  it was logged, plus `id`, `quantity`, and `loggedAt`. Snapshotting means
  editing the catalog later never rewrites past log history. The macro columns
  store **per-serving** values; the eaten amount is `value × quantity`, computed
  on read — so quantity can be edited later without losing precision.
- **Settings** (SQLite table `settings`): a small key/value store; currently
  holds `daily_calorie_goal` (default 2000, clamped to 500–10000).

## API

| Method | Route            | Purpose                                       |
| ------ | ---------------- | --------------------------------------------- |
| GET    | `/api/log`       | Today's entries + computed totals + goal      |
| POST   | `/api/log`       | Add an entry `{ foodName, serving, quantity, ... }` |
| PATCH  | `/api/log/[id]`  | Change an entry's quantity `{ quantity }`     |
| DELETE | `/api/log/[id]`  | Remove an entry by id                         |
| GET    | `/api/goal`      | Current daily calorie goal                    |
| PUT    | `/api/goal`      | Set the daily calorie goal `{ goal }`         |
| GET    | `/api/foods`     | List user-defined custom foods                |
| POST   | `/api/foods`     | Create a custom food `{ name, serving, ... }` |
| DELETE | `/api/foods/[id]`| Delete a custom food (keeps past log entries) |

Totals are always computed server-side so the client can't drift out of sync.
`GET /api/log` also returns the goal, so the UI gets everything in one fetch.

## What's coming next

- **History view** — browse and compare previous days, not just today.
- **Edit entries** — currently entries can only be added or removed.
- **Tests** — unit tests for `lib/db.ts` totals math and API route validation.

## Known limitations

- Nutrition values are rounded approximations from standard references, not
  clinical data.
- Single-user and single-device: the database is a local file, not synced.
- "Today" uses the server's local timezone.
