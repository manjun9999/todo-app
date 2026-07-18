# 2026-07-18 — Adjustable Quantities

Decision log for logging foods in multiples/fractions of a serving. Follows the
[daily goal](./2026-07-18-daily-goal.md) work.

## Goal

Let the user log more than one serving — "2 eggs", "1.5 cups rice" — both when
adding a food and by adjusting an already-logged entry. Macros and daily totals
must scale accordingly.

## What was built

- **`quantity` column** on `log_entries` (default 1), added via an idempotent
  migration helper `ensureColumn()`.
- **`clampQty()` / `updateQuantity()`** in `lib/db.ts`; `addEntry` now stores a
  quantity.
- **`PATCH /api/log/[id]`** to change an entry's quantity; `POST /api/log`
  accepts an optional `quantity` (defaults to 1).
- **`QuantityStepper`** reusable −/+ control, used in both `FoodCard`
  (choose-before-add, with a live scaled-calorie preview) and `DailyLog`
  (adjust-after-log, with a `×N` badge).
- **`changeQuantity()`** in `page.tsx` with optimistic scaling + rollback.

## Key technical decisions

### Store per-serving values + quantity, scale on read
The macro columns (`calories/protein/carbs/fat`) keep the **per-serving** base
values; the eaten amount is `base × quantity`, computed in `rowToEntry()`. The
alternative — storing already-scaled macros — would make editing quantity lossy
(you'd divide to recover the base and accumulate rounding error). Keeping the
base normalized means quantity edits are a single-column update with no drift.

Trade-off: totals math sums the *scaled+rounded* per-entry values, so a total
can differ by ≤1 kcal from summing raw bases first. Acceptable for a tracker,
and it keeps "what each row shows" and "what the total shows" consistent.

### Idempotent migration instead of restart-and-pray
The daily-goal work flagged the need for real migrations. `ensureColumn()`
checks `PRAGMA table_info` and only `ALTER TABLE ADD COLUMN` when the column is
missing — so existing databases (the 8 preview entries) gain `quantity = 1`
without data loss, and re-running is a no-op. Still requires a dev-server
restart because the connection is cached on `globalThis` across hot reloads.

### PATCH for quantity, not a full replace
Quantity is the only mutable field on a log entry, so `PATCH /api/log/[id]` with
`{ quantity }` is the minimal surface. It returns the updated (scaled) entry.
The client re-fetches afterward for authoritative totals rather than trusting
its optimistic estimate.

### Reusable stepper with a tone prop
`QuantityStepper` is shared to avoid divergent −/+ behavior. A `tone`
(`light`/`dark`) prop lets it sit on white cards or a colored surface without
forking the component. Step 0.5 / min 0.5 in the UI; the API clamps to
[0.25, 100] so hand-crafted requests can't store absurd values.

### FoodCard is no longer a single button
Adding a stepper (which contains buttons) inside the card meant the card could
no longer *be* a button (no nested interactive elements). It became a `div` with
a dedicated "Add" button, which also reads better for accessibility.

## Verification

- `tsc --noEmit` clean.
- Live round-trip: migration set existing rows to `quantity: 1`; 2 eggs →
  144 kcal / 12.6 g protein; 1.5 cups rice → 308 kcal / 6.5 g protein (correct
  rounding); PATCH to qty 3 → 615 kcal; invalid quantity `0` → 400; unknown id →
  404. Page renders 25 cards each with an Add button and stepper.

## Open items / next steps

- Custom foods (with user-entered macros) — the last catalog-side gap.
- History view across days.
- A typed request-validation layer (e.g. zod) would DRY up the hand-rolled
  numeric parsing now repeated across the log/goal routes.
- Automated tests for the scaling math and route validation.
