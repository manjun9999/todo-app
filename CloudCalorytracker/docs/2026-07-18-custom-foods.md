# 2026-07-18 — Custom Foods

Decision log for user-defined foods. Follows the
[adjustable quantities](./2026-07-18-adjustable-quantities.md) work and closes
out the catalog-side roadmap.

## Goal

Let the user add foods that aren't in the built-in catalog — their own name,
serving, and macros — persisted and usable exactly like a built-in food
(searchable, loggable, quantity-adjustable, counted in totals/goal).

## What was built

- **`custom_foods` table** (`CREATE TABLE IF NOT EXISTS`) with
  `getCustomFoods` / `addCustomFood` / `deleteCustomFood` in `lib/db.ts`.
- **`GET`/`POST /api/foods`** and **`DELETE /api/foods/[id]`**.
- **`CatalogFood`** type (`Food` + optional `custom`, `dbId`) as the unified
  shape for built-in and custom foods in the UI.
- **`AddFoodForm`** — a collapsible create form; `FoodCard` widened to
  `CatalogFood` with a "Custom" badge and a Delete affordance.
- **`page.tsx`** merges custom foods (newest first) ahead of the static catalog
  and handles create/delete with optimistic list updates.

## Key technical decisions

### New table, not appended to the static catalog
Built-in foods stay a compile-time constant in `lib/foods.ts`; custom foods live
in `custom_foods`. The UI merges the two into one `CatalogFood[]`. This keeps
the seed data immutable and versioned in code, while user data stays in the DB —
no migration needed to ship new built-ins, no code change to add user foods.

### Unify via `CatalogFood`, tag with `custom`/`dbId`
Rather than a separate rendering path, custom foods are mapped to the same shape
as built-ins with `id: "custom-<n>"`, `category: "Custom"`, `custom: true`, and
`dbId` for deletion. Search, filtering, `FoodCard`, and the add-with-quantity
flow all work unchanged. `Food[]` is assignable to `CatalogFood[]` (the extra
fields are optional), so the static catalog needed no retyping.

### Deleting a food does NOT touch the log
`deleteCustomFood` only removes the catalog row. Log entries snapshot their
macros at log time (a decision from the initial build), so a deleted custom food
leaves history intact — verified explicitly in testing. This is the payoff of
snapshotting over foreign-key references.

### Server owns validation and the emoji default
`POST /api/foods` requires a non-empty `name`, coerces macros to non-negative
numbers, trims the emoji to ≤2 code points, and defaults it to 🍽️. The client
form mirrors the name check for UX, but the server is authoritative.

### FoodCard already a div paid off
Because the quantities work had already turned `FoodCard` from a `<button>` into
a `<div>`, adding a nested Delete button raised no nested-interactive-element
concerns.

## Notable events during the build

- **Emoji looked corrupted (`??`) in the curl test.** Root cause was Git Bash on
  Windows mangling the emoji bytes on the *input* side of `curl -d`, not the app.
  Confirmed by a clean roundtrip of the source-literal default 🍽️ (which never
  passes through the shell), which came back as correct UTF-8. No code change.
- New `custom_foods` table meant the usual dev-server restart so `initDb()` ran
  on a fresh connection (cached on `globalThis` across hot reloads).

## Verification

- `tsc --noEmit` clean.
- Live: create → 201 (`custom: true`, `dbId`); missing name → 400; log with
  quantity 2 → 560 kcal (280×2, scales correctly); **delete the food → its
  logged entry survives**; delete unknown id → 404; emoji default roundtrips as
  UTF-8; page renders the form plus all cards.

## Open items / next steps

- **History view** — the last roadmap item; browse/compare previous days.
- Edit custom foods in place (currently create/delete only).
- Optional category picker for custom foods (all land in "Custom" today).
- Shared request-validation layer (zod) across the log/goal/foods routes.
- Automated tests for the food/scaling/validation paths.
