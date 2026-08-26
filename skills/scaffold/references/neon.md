# Neon

This July 2026 survey covered 50 repos in `~/Sites` and checked its conclusions against Neon's documentation. Twenty-two repos reference Neon; 19 use it. Six repeated failure modes explain the reported development instability. The shared configuration below combines the fixes already proven in those repos.

## Development failure modes

Each failure appears in project code.

### F1: IPv6 connection stall

Neon endpoints publish both AAAA (IPv6) and A (IPv4) DNS records. On networks that advertise IPv6 but can't actually route it to AWS, Node races a dead IPv6 connection alongside IPv4 and the query stalls or dies at connect (`EHOSTUNREACH`, ~14s hangs).

Evidence from three repos:

- materialsinuse (`packages/foundation/src/infra/neon-fetch.ts`): `setDefaultAutoSelectFamily(false)` + `setDefaultResultOrder("ipv4first")` — comment: *"proven to turn that 14s failure into a 1.6s success."*
- everydayapparatus (`scripts/with-env.mjs`): forces `NODE_OPTIONS=--dns-result-order=ipv4first` on every script.
- architizer (`packages/db/src/core/canonical-client.ts:12`): `setDefaultResultOrder("ipv4first")` at module scope.

Because the failure depends on the local network and AWS route, every Neon project carries the fix.

### F2: Autosuspend and short connection timeouts

Free/Launch-plan computes suspend after **5 minutes idle** (Neon default). Suspension **terminates existing connections**, and the next connection pays a cold start. Postgres clients default to a ~5s connect timeout, which the cold-start round trip can blow through. Neon's official guidance: set `connect_timeout` (or `connectionTimeoutMillis`) to **10–15s or more**, and retry with backoff ([connection-latency docs](https://neon.com/docs/connect/connection-latency)).

This explains the failed first query after a pause. Candor recorded the same sequence before migrating drivers: *"The previous WebSocket-based `@neondatabase/serverless` Pool dropped its socket when idle, which surfaced as intermittent failures on the first authenticated request after a pause."*

### F3: HMR pool leaks in `next dev`

Every hot reload can re-evaluate the db client module. A plain module-level singleton (`let cached`) is re-created per re-evaluation; each stale pool keeps its connections until Neon's limit is hit. architizer's comment names it: *"reuse ONE pool instead of leaking a fresh 10-connection pool per reload until Neon's limit is hit — the single biggest cause of the recurring 'connection reset' death spiral."*

Only three of 19 repos cache on `globalThis`: architizer, quarry, and Materia's Mastra store. Module-level `let` does not survive HMR. This affects stateful TCP and WebSocket pools; the HTTP driver holds no connections.

### F4: Idle connections terminate the process

Neon (and its pooler) drops quiet connections server-side. `pg.Pool` then emits `'error'` on the idle client; without a listener, Node treats it as an uncaught exception and **kills the process**. everydayapparatus: *"it crashed the backfill"*. architizer, materialgraph, and everydayapparatus all attach `pool.on("error", ...)` handlers now; fieldportrait's Neon `Pool` has none.

The complementary fix (everydayapparatus): set `idleTimeoutMillis` *below* Neon's server-side drop — *"Close idle connections before Neon's pooler drops them server-side, so we rarely hand out a dead one."*

### F5: Transient HTTP failures

The `neon()` HTTP driver is one fetch per query with no built-in retry; a single transient network blip surfaces as `fetch failed` / `UND_ERR_*` and kills the request. materialsinuse: *"a single 'fetch failed' kills the request mid-pipeline."* Five repos built retry wrappers independently (materialsinuse, kiln, candor, materia, materialgraph) with near-identical transient-error signature lists — but coverage is patchy (kiln wraps one store out of three; scripts routinely bypass the wrappers).

### F6: Connection budgets and endpoint misuse

Most repos run **two or three DB stacks against one endpoint** (app client + `@mastra/pg` storage + `PgVector`), each with its own pool. Direct (non-`-pooler`) endpoints have `max_connections` tied to compute size (104 at 0.25CU); stacking pools on a direct endpoint burns that fast. candor runs ~4 pools against a **direct** endpoint. materialgraph learned the inverse lesson under load: *"Using DIRECT here was the cause of the 'Neon is contended' page errors"* — and pinned app runtime to the pooler.

Use pooled endpoints for app traffic. Use direct endpoints for migrations, administration, and long-lived single tools. Four repos point app traffic at direct hosts: candor, materialsinuse, routerbase, and Materia. Materia records a Vercel Fluid and `attachDatabasePool` exception.

## Shared configuration

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

### Use `@howells/neon`

[`@howells/neon`](https://github.com/howells/neon) packages all six fixes: a write-safe retry matcher, IPv4-first DNS, cold-start connection timeouts, `globalThis` caching, idle-error handling, and endpoint assertions. Do not copy its client logic into consuming repos.

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

Candor established three constraints: `max` must be at least two because a single-client pool deadlocks `@mastra/pg` batch writes; options-style `@mastra/pg` config drops `connectionTimeoutMillis`; and `PgVector` cannot accept an injected pool. `createMastraPool` therefore builds the pool and keeps both clients on one pooled configuration. If serverless cannot hold storage connections, follow MaterialGraph: move Mastra storage to Upstash and keep domain data in Postgres.

### Dev workflow

The single biggest un-adopted improvement: **17 of 19 active repos dev directly against the production database.** tensile does it explicitly ("using one DB for dev/prod"); materialgraph-demo shares materialgraph's primary DB; materialdesk and materialdesk-md6 share credentials. Nobody uses Neon branches, neonctl, or Neon Local in a dev loop; only materialgraph even has an opt-in local Postgres compose file.

Guidance:

- For valuable data, create a long-lived `dev` branch in Neon and point local `.env` at it: `neonctl branches create --name dev`. Copy-on-write isolates destructive development schema changes.
- Throwaway experiments: cloud-direct against the primary is fine — the hardened client absorbs the reliability issues.
- Neon Local (Docker proxy with ephemeral branches) exists but adds a Docker dependency for a problem branches already solve; skip unless per-PR ephemeral DBs become a need.
- Autosuspend cold starts in dev are handled by retries + `connect_timeout=15`, not by disabling suspend. (Paid plans can raise the suspend timeout; do that only for daily-driver projects.)

### Version pinning

Fleet standard: `@neondatabase/serverless` 1.1.0, `drizzle-orm` 0.45.2, `drizzle-kit` 0.31.x, `pg` 8.22.x. Fix tensile (driver 1.0.2, drizzle 0.44.6) and pin quarry's `latest` specifiers. Since driver 0.9, `fetchConnectionCache` is deprecated and always on; delete any reference. Call `neon()`'s result as a tagged template or `.query()`, never `sql("...", [])`.

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

Ordered by impact:

1. ~~**fieldportrait**~~ **DONE (July 2026).** Migrated to `@howells/neon/pool`. The original survey was wrong: fieldportrait has **12 production `.transaction()` call sites** across `packages/memory` and `packages/db`. The HTTP driver's `.transaction()` typechecks but throws at runtime.
2. **Module-level singletons with stateful pools** (candor, colophon, everydayapparatus, foolscap, litmus). Migrate to `@howells/neon`; its factories provide `globalThis` caching.
3. **App-on-direct-endpoint** (candor, materialsinuse, routerbase). Point app runtime at the `-pooler` host; candor should also consolidate about four pools.
4. **Dead dependencies.** `@neondatabase/serverless` is unused in materia, colophon, and designmilk; `ws` and `webSocketConstructor` wiring are unused in routerbase and materia; `drizzle-orm` is unused in foolscap and designmilk.
5. **litmus.** `DIRECT_DATABASE_URL` in `.env.local` points at the pooler; nothing reads the `NEON_*` variables; region and database names differ across `.env`, `.env.local`, and `.env.example`; `getDocuments` swallows all query errors.
6. **tensile.** Upgrade driver 1.0.2 to 1.1.0 and Drizzle 0.44 to 0.45. Create a dev branch instead of sharing one database across dev and production. An orphan script imports undeclared `postgres`.
7. **quarry.** Pin `latest` specifiers. Its `globalThis` caching and pooled/unpooled split otherwise match the standard.
8. **kiln** — extend `withNeonRetry` to all three stores; the drizzle schema is defined but orphaned from both querying and migrations (drift risk vs. runtime `CREATE TABLE IF NOT EXISTS` DDL).
9. **figura** — per-request `createDb(process.env["DATABASE_URL"] ?? "")` defers failure to query time; use the shared singleton.
10. **materialgraph-demo / materialdesk-md6** — demo checkouts sharing production databases/credentials with their parents; give them branches.

## Scaffold reconciliation

Resolved in July 2026:

- **`architecture-defaults.md`**: the old "never raw `pg` / neon-serverless as escape hatch" rule was inverted by the portfolio evidence and Neon's current docs. Now: `@howells/neon/http` default, `@howells/neon/pool` (hardened `pg`) the sanctioned escape hatch, WebSocket driver avoided.
- **`config-snippets.md`**: the hand-rolled db client snippet was replaced with the `@howells/neon` factories.
- Lint enforcement: merge `createOxlintConfig()` from `@howells/neon/lint` into a repo's oxlint config; a fleet-wide preset in `@howells/lint` (re-exporting the same rules) is the follow-up that reaches every repo without per-repo wiring.
