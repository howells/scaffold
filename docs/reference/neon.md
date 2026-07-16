---
title: "Neon"
description: "How Neon Postgres is actually configured across the portfolio, why it fails during dev, and the canonical hardened setup for new projects."
---

# Neon

This is the portfolio-wide analysis of Neon Postgres configuration, produced from a survey of all 50 repos in `~/Sites` (July 2026) cross-checked against Neon's current official documentation. 22 repos reference Neon; 19 use it actively. The goal: one de facto configuration that stops the recurring "Neon craps out during dev" failures.

The short version: **the flakiness is not random.** It decomposes into six specific failure classes, every one of which has been independently hit, diagnosed, and worked around in at least one repo — but the fixes never propagated. The de facto config below is the union of those battle-tested fixes.

## Why Neon "craps out during dev" — the failure taxonomy

Each of these is verified in project code, not hypothetical.

### F1 — IPv6 happy-eyeballs stall (the network one)

Neon endpoints publish both AAAA (IPv6) and A (IPv4) DNS records. On networks that advertise IPv6 but can't actually route it to AWS, Node races a dead IPv6 connection alongside IPv4 and the query stalls or dies at connect (`EHOSTUNREACH`, ~14s hangs).

**Three repos rediscovered this independently:**

- materialsinuse (`packages/foundation/src/infra/neon-fetch.ts`): `setDefaultAutoSelectFamily(false)` + `setDefaultResultOrder("ipv4first")` — comment: *"proven to turn that 14s failure into a 1.6s success."*
- everydayapparatus (`scripts/with-env.mjs`): forces `NODE_OPTIONS=--dns-result-order=ipv4first` on every script.
- architizer (`packages/db/src/core/canonical-client.ts:12`): `setDefaultResultOrder("ipv4first")` at module scope.

Three independent rediscoveries means this is environmental (local network + AWS), and every project that talks to Neon should carry the fix by default.

### F2 — Compute autosuspend vs. tight connect timeouts

Free/Launch-plan computes suspend after **5 minutes idle** (Neon default). Suspension **terminates existing connections**, and the next connection pays a cold start. Postgres clients default to a ~5s connect timeout, which the cold-start round trip can blow through. Neon's official guidance: set `connect_timeout` (or `connectionTimeoutMillis`) to **10–15s or more**, and retry with backoff ([connection-latency docs](https://neon.com/docs/connect/connection-latency)).

This is the direct mechanism behind "first query after a pause fails" — candor documented exactly this before migrating drivers: *"The previous WebSocket-based `@neondatabase/serverless` Pool dropped its socket when idle, which surfaced as intermittent failures on the first authenticated request after a pause."*

### F3 — HMR pool leaks in `next dev`

Every hot reload can re-evaluate the db client module. A plain module-level singleton (`let cached`) is re-created per re-evaluation; each stale pool keeps its connections until Neon's limit is hit. architizer's comment names it: *"reuse ONE pool instead of leaking a fresh 10-connection pool per reload until Neon's limit is hit — the single biggest cause of the recurring 'connection reset' death spiral."*

**Only 3 of 19 repos cache on `globalThis`** (architizer, quarry, materia's Mastra store). Most use module-level `let`, which does not survive HMR. Note this only matters for *stateful* clients (TCP/WebSocket pools) — the HTTP driver holds no connections, which is a real argument for it in dev.

### F4 — Idle-connection drops killing the process

Neon (and its pooler) drops quiet connections server-side. `pg.Pool` then emits `'error'` on the idle client; without a listener, Node treats it as an uncaught exception and **kills the process**. everydayapparatus: *"it crashed the backfill"*. architizer, materialgraph, and everydayapparatus all attach `pool.on("error", ...)` handlers now; fieldportrait's Neon `Pool` has none.

The complementary fix (everydayapparatus): set `idleTimeoutMillis` *below* Neon's server-side drop — *"Close idle connections before Neon's pooler drops them server-side, so we rarely hand out a dead one."*

### F5 — Transient `fetch failed` on the HTTP driver

The `neon()` HTTP driver is one fetch per query with no built-in retry; a single transient network blip surfaces as `fetch failed` / `UND_ERR_*` and kills the request. materialsinuse: *"a single 'fetch failed' kills the request mid-pipeline."* Five repos built retry wrappers independently (materialsinuse, kiln, candor, materia, materialgraph) with near-identical transient-error signature lists — but coverage is patchy (kiln wraps one store out of three; scripts routinely bypass the wrappers).

### F6 — Connection budget exhaustion / endpoint misuse

Most repos run **two or three DB stacks against one endpoint** (app client + `@mastra/pg` storage + `PgVector`), each with its own pool. Direct (non-`-pooler`) endpoints have `max_connections` tied to compute size (104 at 0.25CU); stacking pools on a direct endpoint burns that fast. candor runs ~4 pools against a **direct** endpoint. materialgraph learned the inverse lesson under load: *"Using DIRECT here was the cause of the 'Neon is contended' page errors"* — and pinned app runtime to the pooler.

Rule of thumb from the evidence: **app traffic → pooled endpoint; migrations/admin/long-lived single tools → direct endpoint.** Four repos currently point app runtime at direct hosts (candor, materialsinuse, routerbase, materia — materia deliberately, for Vercel Fluid + `attachDatabasePool`, which is a defensible exception).

## The de facto configuration

### Environment variables

Two URLs, always, validated with envy:

| Var | Host | Used by |
|---|---|---|
| `DATABASE_URL` | pooled (`-pooler`) | app runtime, Mastra storage, scripts |
| `DIRECT_DATABASE_URL` | direct | `drizzle-kit push`, studio, `pg_dump`, admin |

Connection-string params on both: `sslmode=verify-full&channel_binding=require&connect_timeout=15`.

Four repos (candor, foolscap, litmus, materia) upgrade `sslmode=require` → `verify-full` in code at connect time — bake it into the URL instead and delete the normalizers. `connect_timeout=15` is Neon's own cold-start guidance; the default 5s is too tight (F2).

### Driver decision table

| Situation | Driver | Adapter |
|---|---|---|
| **Default** — Next.js app code, serverless, Cloudflare Workers, short scripts | `neon()` HTTP from `@neondatabase/serverless` with the resilient fetch below | `drizzle-orm/neon-http` |
| Long-running Node service, interactive/session transactions, `LISTEN/NOTIFY`, heavy batch work | `pg` hardened pool (below) | `drizzle-orm/node-postgres` |
| **Avoid** | `Pool`/`Client` over WebSockets from `@neondatabase/serverless` | `drizzle-orm/neon-serverless` |

The WebSocket mode is the empirically worst option in the portfolio: candor migrated off it after idle-socket drops (F2/F4), and it combines the fragility of a stateful connection with none of `pg`'s maturity. Neon's own current guidance puts persistent processes on a standard TCP driver ([choose-connection](https://neon.com/docs/connect/choose-connection)); the WS driver's remaining niche (interactive transactions on edge runtimes) doesn't occur anywhere in the portfolio — no repo uses edge runtime near the DB.

The HTTP driver stays the default despite Neon's TCP-for-persistent-processes guidance because it's the only mode that (a) cannot leak connections across HMR (F3), (b) cannot hold an idle connection for autosuspend to kill (F2/F4), and (c) runs identically in `next dev`, Vercel serverless, and Workers. Its one real failure mode (F5) is fully covered by the retry layer. Repos that need real transactions get the hardened `pg` pool — that's the sanctioned second driver, not sprawl.

### Canonical client — use `@howells/neon`

All six failure-class fixes are packaged in **[`@howells/neon`](https://github.com/howells/neon)** — do not copy-paste hand-rolled clients any more. The package encodes: resilient fetch (F5) with a **write-safe narrow retry matcher** by default, IPv4-first DNS (F1), cold-start-sized connect timeouts (F2), `globalThis` caching (F3), idle-drop error listeners and sub-drop idle timeouts (F4), and pooled/direct endpoint assertions (F6).

HTTP default (app data access):

```ts
// packages/db/src/client.ts
import { createHttpDb } from "@howells/neon/http";
import { getDatabaseUrl } from "@your-scope/env";
import * as schema from "./schema";

export const db = createHttpDb({ url: getDatabaseUrl(), schema });
export type Db = typeof db;
```

Hardened `pg` pool (sessions, interactive transactions, `LISTEN/NOTIFY`):

```ts
// packages/db/src/client.ts
import { createPooledDb } from "@howells/neon/pool";
import { getDatabaseUrl } from "@your-scope/env"; // pooled URL
import * as schema from "./schema";

export const db = createPooledDb({ url: getDatabaseUrl(), schema });
```

On Vercel Fluid Compute, pass `onPoolCreated: attachDatabasePool` from `@vercel/functions` — unless the code relies on `SET LOCAL` continuity, which it breaks (materialgraph documents rejecting it for exactly that reason; materia uses it happily).

**Retry safety** (the package's most important design decision): the default matcher retries only connection-establishment failures — the request provably never reached the server, so writes can't double-apply. The broad matcher (mid-flight drops like `fetch failed`/`ECONNRESET`) is opt-in via `retryDbRead` or `createResilientFetch({ isRetryable: isTransientNeonError })` and is only safe for reads/idempotent work. Non-connection SQLSTATEs are never retried.

### Migrations

`drizzle-kit push` against `DIRECT_DATABASE_URL` — never the pooler. quarry's config has the right comment: *"UNPOOLED (direct host, not PgBouncer) is required for schema migrations."* `@howells/neon/kit` enforces this with an assertion:

```ts
// drizzle.config.ts
import { neonKitConfig } from "@howells/neon/kit";

export default neonKitConfig({
  directUrl: process.env.DIRECT_DATABASE_URL ?? "",
  schema: "./packages/db/src/schema.ts",
});
```

### Mastra storage

Use `@howells/neon/mastra`:

```ts
import { createMastraPool, mastraPoolOptions } from "@howells/neon/mastra";

const storage = new PostgresStore({ id: "app-storage", pool: createMastraPool({ url }), schemaName: "mastra" });
const vectors = new PgVector({ connectionString: url, pgPoolOptions: mastraPoolOptions({ url }) });
```

The hard-won rules it encodes (candor): **`max` ≥ 2** (a single-client pool deadlocks `@mastra/pg` batch writes); `@mastra/pg` **silently drops `connectionTimeoutMillis`** from options-style config, so `createMastraPool` builds the pool itself; `PgVector` accepts **no injected pool** — one config, two pools that can't drift is the best the API allows. Point both at the **pooled** URL. If serverless can't hold storage connections at all, the materialgraph precedent is to move Mastra storage to Upstash and keep Postgres for domain data.

### Dev workflow

The single biggest un-adopted improvement: **17 of 19 active repos dev directly against the production database.** tensile does it explicitly ("using one DB for dev/prod"); materialgraph-demo shares materialgraph's primary DB; materialdesk and materialdesk-md6 share credentials. Nobody uses Neon branches, neonctl, or Neon Local in a dev loop; only materialgraph even has an opt-in local Postgres compose file.

Guidance:

- Anything with real users or data you'd mind losing: create a long-lived `dev` **branch** in the Neon project and point local `.env` at it (`neonctl branches create --name dev`). Copy-on-write, instant, free-tier friendly, and `drizzle-kit push --force` accidents stop being scary.
- Throwaway experiments: cloud-direct against the primary is fine — the hardened client absorbs the reliability issues.
- Neon Local (Docker proxy with ephemeral branches) exists but adds a Docker dependency for a problem branches already solve; skip unless per-PR ephemeral DBs become a need.
- Autosuspend cold starts in dev are handled by retries + `connect_timeout=15`, not by disabling suspend. (Paid plans can raise the suspend timeout; do that only for daily-driver projects.)

### Version pinning

Fleet standard: `@neondatabase/serverless` 1.1.0, `drizzle-orm` 0.45.2, `drizzle-kit` 0.31.x, `pg` 8.22.x. Outliers to fix: tensile (driver 1.0.2, drizzle 0.44.6), quarry (`latest` specifiers — pin them). Driver ≥ 0.9 note: `fetchConnectionCache` is deprecated/always-on — delete any reference; call `neon()`'s result as a tagged template or `.query()`, never `sql("...", [])`.

## Survey snapshot (July 2026)

| Project | Driver (app) | Adapter | App endpoint | Retries | globalThis cache | Dev DB |
|---|---|---|---|---|---|---|
| ai (benchmark) | neon() HTTP | raw sql | pooled | none | no (module) | prod |
| architizer | pg TCP | node-postgres | pooled | none (keepAlive/ipv4/pool instead) | **yes** | prod |
| candor | pg TCP | node-postgres | **direct** ⚠ | **yes** (conn-retry) | no | prod |
| colophon | postgres.js | postgres-js | pooled | none | no (module) | prod |
| designmilk | pg via Payload | payload | n/a locally | none | payload-managed | local pg fallback |
| everydayapparatus | postgres.js + @mastra/pg | raw sql | pooled | pool-error handler, ipv4, tuned idle | no (module) | prod |
| faceplacer | neon() HTTP | neon-http | pooled | none | no (module) | prod |
| fieldportrait | ~~neon WS Pool~~ → **@howells/neon/pool** ✓ | node-postgres | pooled | **yes** (via package) | **yes** (via package) | prod (CI: local pg) |
| figura | neon() HTTP | neon-http | pooled | none | no (**per-request**) ⚠ | prod |
| foolscap | neon WS Pool (max:1) | raw sql | pooled | none | no (module) | prod |
| kiln | neon() HTTP | raw sql | pooled | partial (1 of 3 stores) | no (module) | prod |
| litmus | postgres.js | raw sql | pooled | none (errors swallowed ⚠) | no (module) | prod |
| materia | pg TCP | node-postgres | **direct** (deliberate: Fluid + attachDatabasePool) | **yes** | mastra store only | prod |
| materialdesk / -md6 | — (planned) | — | — | — | — | shared creds ⚠ |
| materialgraph | neon() HTTP + pg (transactions) | neon-http + node-postgres | pooled (direct caused contention) | **yes** (1-shot + instrumentation) | no (module Proxy) | prod (opt-in local pg) |
| materialgraph-demo | same as materialgraph | same | pooled | yes | no | **shares materialgraph prod DB** ⚠ |
| materialsinuse | neon() HTTP | neon-http + raw | **direct** ⚠ | **yes** (fetch + query layers, FORCE_IPV4) | no (module) | prod |
| planchette | neon() HTTP → **@howells/neon/http** ✓ | neon-http | pooled | **yes** (via package) | **yes** (via package) | prod |
| quarry | neon() HTTP + WS Pool (2 txns) | neon-http + neon-serverless | pooled (+unpooled for migrations ✓) | none | **yes** | prod |
| routerbase | neon() HTTP | neon-http | **direct** ⚠ | none | no (eager module) | prod |
| tensile | neon() HTTP | neon-http | unknown (no .env) | none | no (eager module) | prod = dev (explicit) |

## Per-repo cleanup backlog

Highest value first:

1. ~~**fieldportrait**~~ **DONE (July 2026)** — migrated to `@howells/neon/pool`. Correction to the original survey: fieldportrait has **12 production `.transaction()` call sites** across `packages/memory` and `packages/db` (the initial "no interactive-transaction usage" claim was wrong), which is why it went to the hardened pg pool, not neon-http — the HTTP driver's `.transaction()` typechecks but throws at runtime.
2. **Everyone on module-level singletons with stateful pools** (candor, colophon, everydayapparatus, foolscap, litmus) — migrate to `@howells/neon` (its factories carry the `globalThis` caching, F3).
3. **App-on-direct-endpoint** (candor, materialsinuse, routerbase) — repoint app runtime at the `-pooler` host; candor additionally consolidates ~4 pools.
4. **Dead dependencies** — `@neondatabase/serverless` unused in materia, colophon, designmilk; `ws` + `webSocketConstructor` wiring unused in routerbase and materia; `drizzle-orm` unused in foolscap and designmilk.
5. **litmus** — `DIRECT_DATABASE_URL` in `.env.local` actually points at the pooler; `NEON_*` vars read by nothing; region/db-name disagreements between `.env`, `.env.local`, and `.env.example`; `getDocuments` swallows all query errors.
6. **tensile** — upgrade driver 1.0.2 → 1.1.0 and drizzle 0.44 → 0.45; create a dev branch instead of "one DB for dev/prod"; orphan script imports undeclared `postgres`.
7. **quarry** — pin `latest` specifiers. (Otherwise closest to the de facto config: globalThis caching plus correct pooled/unpooled split.)
8. **kiln** — extend `withNeonRetry` to all three stores; the drizzle schema is defined but orphaned from both querying and migrations (drift risk vs. runtime `CREATE TABLE IF NOT EXISTS` DDL).
9. **figura** — per-request `createDb(process.env["DATABASE_URL"] ?? "")` defers failure to query time; use the shared singleton.
10. **materialgraph-demo / materialdesk-md6** — demo checkouts sharing production databases/credentials with their parents; give them branches.

## Reconciliation with existing scaffold docs

Two existing docs need amending to match this analysis:

Resolved July 2026 — both docs now defer to `@howells/neon`:

- **`architecture-defaults.md`**: the old "never raw `pg` / neon-serverless as escape hatch" rule was inverted by the portfolio evidence and Neon's current docs. Now: `@howells/neon/http` default, `@howells/neon/pool` (hardened `pg`) the sanctioned escape hatch, WebSocket driver avoided.
- **`config-snippets.md`**: the hand-rolled db client snippet was replaced with the `@howells/neon` factories.
- Lint enforcement: merge `createOxlintConfig()` from `@howells/neon/lint` into a repo's oxlint config; a fleet-wide preset in `@howells/lint` (re-exporting the same rules) is the follow-up that reaches every repo without per-repo wiring.
