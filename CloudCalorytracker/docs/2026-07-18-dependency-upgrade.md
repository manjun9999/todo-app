# 2026-07-18 — Dependency Upgrade (Next 16 / React 19)

Decision log for clearing the outstanding `npm audit` advisories.

## Goal

Resolve the two open advisories with no known-vulnerable dependencies remaining,
while keeping the app building and running.

## Starting point

`npm audit` reported:

- **next** (high) — a batch of Next.js CVEs (DoS via Image Optimizer, RSC
  request DoS, request smuggling in rewrites, cache poisoning, several XSS,
  SSRF via WebSocket upgrades, …).
- **postcss** (moderate) — XSS via unescaped `</style>` in CSS stringify output,
  pulled in transitively **inside** Next's own `node_modules`.

We were already on the latest 14.2.x patch (14.2.35); these fixes only exist in
Next 15/16. So a major upgrade was the only real remedy — `audit fix` itself
suggested `next@16.2.10`.

## What was done

- **next 14.2.35 → 16.2.10**, **react/react-dom 18.3.1 → 19.2.7**,
  **@types/react(-dom) 18 → 19**.
- **postcss**: added an `overrides` entry pinning `^8.5.19` so Next's nested
  copy (was 8.4.31) is forced onto a patched version; bumped our direct devDep
  to match.

Result: `npm audit` → **0 vulnerabilities**.

## Breaking changes handled

Next 15/16 changed two things our code relied on:

1. **Config rename.** `experimental.serverComponentsExternalPackages` →
   top-level `serverExternalPackages` in `next.config.mjs` (keeps
   `better-sqlite3` out of the bundle).
2. **Async route `params`.** Dynamic route handlers now receive
   `params: Promise<...>`. Updated `app/api/log/[id]/route.ts` (PATCH, DELETE)
   and `app/api/foods/[id]/route.ts` (DELETE) to `await params`.

React 19 needed no component changes here. Next auto-reconfigured `tsconfig.json`
on first build (`jsx: "react-jsx"`, added a `.next/dev/types` include) — expected
and left as-is.

## Decisions

### Upgrade rather than suppress
The advisories could have been ignored (most are DoS/edge/image-optimizer issues
with little bearing on a local single-user app), but the ask was to fix them, and
staying on 14.2.x left no patched path. Upgrading to the version `audit` itself
targets (16.2.10) is the durable fix.

### `overrides` for the nested postcss
The postcss advisory lived under `node_modules/next/node_modules/postcss`, which
our direct dependencies can't move. `audit fix --force` nonsensically proposed
downgrading Next to 9.3.3. An npm `overrides` pin is the correct tool: postcss
8.5.x is a backward-compatible minor over 8.4.x, so forcing it tree-wide is safe.

### Leave `sharp` unapproved
Next 16 pulls `sharp` as an optional image-optimization dependency with a native
install script. The app doesn't use `next/image`, so build and runtime are fine
without it; the script stays unapproved to avoid an unnecessary native build.
Documented how to enable it if `next/image` is ever added.

## Verification

- `tsc --noEmit` clean; `npm run build` green (all six API routes present, `/`
  static).
- Runtime on Next 16 / React 19: page + `GET /api/log` + `GET /api/history` all
  200; the migrated async-`params` routes exercised live — `PATCH /api/log/[id]`
  scaled 100→300 kcal at qty 3, `DELETE /api/log/[id]` and
  `DELETE /api/foods/[id]` returned 200; no server errors logged.
- `npm audit`: **0 vulnerabilities**.

## Open items / next steps

- Keep an eye on Next 16 patch releases; re-run `npm audit` periodically.
- If `next/image` is introduced, approve `sharp`'s install script.
