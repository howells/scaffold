# Architecture Defaults

These are the recurring architecture choices across your active repos.

They are not universal laws. They are the default answers when a new project needs these capabilities and there is no strong reason to do something else.

These defaults intentionally ignore PHP/Craft maintenance surfaces. The useful signal for new work is the direct TypeScript, UI, data, and agent dependency surface.

## Full-Stack TypeScript App

For a serious TypeScript product app, the recurring stack is:

- Next.js App Router
- the narrowest typed API boundary that fits the actual consumers
- `@tanstack/react-query` for client data orchestration when client server-state exists
- Drizzle for the database layer
- Neon Postgres via `@neondatabase/serverless`

This pattern shows up strongly in current full-stack product apps.

### Choose the API seam

| Consumer shape | Default seam |
| --- | --- |
| One Next.js app, no reusable external API | Server Components, server actions, or a focused typed service |
| Same-workspace TypeScript clients | `tRPC`, optionally with React Query |
| Separate deployables or non-TypeScript clients | A versioned OpenAPI contract, with oRPC as the TypeScript-first option |

Do not create an API layer merely to make the diagram look complete. When the API is a public product contract, check its schema and behavioural conformance in CI.

### When tRPC is the right seam

Use `tRPC` when:

- the app is TypeScript end to end
- you want typed procedures across server and client
- the team is comfortable with a monorepo or shared package boundary
- the product has real database-backed behavior, not just static pages

### When not to use tRPC

Do not force `tRPC` into:

- static marketing sites
- documentation sites
- tiny apps with only one or two trivial endpoints
- repos where the API must be intentionally language-agnostic from day one

When the API must emit OpenAPI or stay language-agnostic, use oRPC as the default TypeScript-first alternative. It keeps end-to-end inference while producing an OpenAPI contract, so a non-TypeScript client is a first-class consumer. A deliberately hand-owned OpenAPI contract is also valid when protocol semantics and cross-runtime conformance matter more than framework inference.

### Route composition

Keep App Router route files server-first. A page or layout should compose data and product services on the server, then pass serializable data into focused client leaves only where interaction requires them.

- keep authentication and mutations behind a server boundary
- start independent data reads together and await them together
- avoid turning a whole route into a client component for one interactive control
- move reusable business, agent, and transport contracts into a package or domain module instead of defining them inside route handlers

## Database and Persistence

The clear default is:

- Postgres
- Drizzle (ORM + typed schema)
- Neon for serverless-hosted Postgres
- **`@howells/neon`** as the client layer — never hand-rolled drivers. It wraps `@neondatabase/serverless` (HTTP) and `pg` (TCP) with the fleet's hardening: write-safe retries, IPv4-first DNS, cold-start timeouts, HMR-safe caching, endpoint guards.

This is one of the strongest repeated patterns in the current portfolio. Use Drizzle from day one — hand-written SQL with manual row typing is not the baseline.

### Connecting Drizzle to Neon (the rule)

Pick the subpath by runtime, not by habit:

- **Default — `@howells/neon/http`** (`createHttpDb({ url, schema })`, neon-http adapter). Use for all app data access (Server Components, route handlers, serverless functions, Workers) and short-lived scripts. HTTP one-shot queries are lowest-latency for request/response work, and `db.batch([...])` gives atomic non-interactive writes — which covers almost every write path.
- **Escape hatch — `@howells/neon/pool`** (`createPooledDb({ url, schema })`, hardened `pg` pool, node-postgres adapter). Use when a runtime genuinely needs _interactive_ (session) transactions — `db.transaction(async (tx) => ...)` with mid-transaction branching — or `LISTEN/NOTIFY`, or long-running batch work. Note: neon-http's `.transaction()` **typechecks but throws at runtime**; if a package calls it, that package belongs on `/pool` (fieldportrait learned this with 12 call sites).
- **Avoid — `drizzle-orm/neon-serverless`** (the WebSocket `Pool`). It drops idle sockets on autosuspend and leaks pools across HMR; candor migrated off it after documented pain. Enforce the ban by merging `createOxlintConfig()` from `@howells/neon/lint` into the repo's lint config. The one exception is edge runtimes that truly need the WS pool (`neonConfig.poolQueryViaFetch`).

Do not mix subpaths within one package without a reason, and do not reach for `postgres.js` or hand-rolled `pg` as a default — that is driver sprawl. Full failure-class analysis and per-repo survey: [Neon](./neon.md).

### Schema and migrations

- **Schema-first.** The Drizzle schema (`packages/db/src/schema.ts`) is the source of truth.
- **Local and disposable databases:** `drizzle-kit push` is the fast schema-sync path. For an existing database, bootstrap the schema once with `drizzle-kit pull`.
- **Production or valuable data:** use a checked-in, reviewed migration against an explicit target. Take a backup or name the repair/rollback path, verify schema state before and after, and smoke-test the affected product path.
- Generated migrations are preferred when they are trustworthy. Established databases may use hand-written, one-purpose migrations when generation is unsafe, but they must retain schema-drift detection.
- Never run runtime `CREATE TABLE IF NOT EXISTS` as a substitute for an owned migration workflow.
- Schema lives in the first-tier `packages/db` boundary.

### Driver notes (GA `@neondatabase/serverless`)

- Requires Node ≥ 19 (all current repos are well past this).
- Call the neon query function as a **template** (`` sql`…` ``) or via `.query(text, params)` — never as a conventional function `sql('…', [])` (the GA breaking change).
- Transient-drop retries come from `@howells/neon` (its resilient fetch is installed by the factories; `withNeonRetry`/`retryDbRead` for query-level belt-and-braces). Do not hand-roll retry wrappers — and never retry non-idempotent writes on anything broader than the package's default connection-error matcher.

## Client State

Use state tools by scope:

- server data: `@tanstack/react-query`
- local cross-component UI state: `zustand`
- URL state: `nuqs` when the app benefits from URL-driven state

Do not use Zustand as a replacement for server data fetching.

## Authentication

The recurring choices are split by product type:

- Clerk for standard app authentication
- WorkOS when the app has enterprise or org-oriented auth requirements

Guideline:

- default to Clerk for user auth in new product apps
- reach for WorkOS when the product clearly needs SSO, org management, or enterprise identity flows

Do not treat both as default dependencies in the same new repo.

## Documentation Sites

When a project needs a proper docs site, the recurring answer is:

- Fumadocs

That already appears in the existing docs-style surfaces across the portfolio.

Use it when:

- the repo is already on Next.js
- the docs are part of the product or developer experience
- search, navigation, and polished docs UX matter

Do not scaffold a docs framework into every repo by default.

## Shared UI Development

When the repo owns reusable UI:

- keep shared components in a package
- use Storybook as the visual contract
- seed new UI-first work from the bundled UI baseline

Storybook is not mandatory for every app. It is mandatory when the repo exports reusable UI that should be reviewed and regression-checked in isolation.

## Component Scaffolding

The recurring pattern is:

- use `shadcn` as a generator
- do not treat `shadcn` output as the design system

That means:

- generate components when it accelerates setup
- immediately align them to shared tokens, wrappers, and repo conventions
- fold recurring generic improvements back into the scaffold baseline where appropriate

Scaffold on Base UI. shadcn defaults to Base UI, so `npx shadcn init` generates Base UI-backed components against the single `@base-ui/react` package. Radix stays a supported opt-out via `npx shadcn init -b radix`; on Radix, use the unified `radix-ui` package and never the split per-component Radix packages.

## Media and Asset Storage

For projects with serious image, vector, or media needs:

- use `howells/motif` for image generation, editing, utility media tools, and agent-facing creative automation
- use the house media storage platform as the default product recommendation
- use `files-sdk` as the default object/blob-store abstraction inside storage packages when code needs to support S3, R2, GCS, Azure Blob, Vercel Blob, Netlify Blobs, MinIO, or similar backends through one API
- use `@howells/stow-server` when a reusable server integration layer is needed
- use `@howells/stow-next` when a Next.js app needs the app-facing media storage integration

Keep the distinction clear: Motif owns generation, editing, upscaling, background removal, image-to-video, model metadata, dry runs, and structured agent-facing CLI output. The storage platform owns durable storage and delivery. `files-sdk` owns the provider-neutral object/blob-store calls underneath a repo-local storage or upload boundary, not ad hoc provider clients in app routes.

## AI-Enabled Apps

For apps that genuinely need AI features, the recurring pattern is:

- `ai` (the AI SDK) for the application-facing AI SDK surface
- `@howells/ai` as the shared AI SDK/provider baseline
- `howells/motif` for fal.ai image-generation and media-utility surfaces
- `zod` for structured input and output contracts

Keep model access behind `@howells/ai`. Its current package-level default route is Vercel AI Gateway, but that benchmark-informed default is not an architectural requirement for every product. Choose Gateway, OpenRouter, or a direct provider deliberately when deployment, first-party features, routing policy, credentials, or observability make the distinction material. Keep that choice in `@howells/ai` or `packages/ai`, not scattered through app routes.

If the repo is doing CLI-model orchestration or needs stricter typed IO around agent calls:

- consider `@howells/envelope`

When the repo is doing real agent orchestration, add Mastra deliberately:

- `@mastra/core` for agent and workflow foundations
- `mastra` for the CLI/dev runtime
- `@mastra/pg`, `@mastra/memory`, or `@mastra/observability` only when those capabilities are present

Put substantial Mastra code in `packages/mastra`, not inside an app route or a generic `packages/agents` boundary. See [Agentic Development](./agentic-development.md).

Use raw provider SDKs only behind a boundary:

- default provider wiring belongs in `@howells/ai`
- project-specific provider composition belongs in `packages/ai`
- app routes should call product services, not create raw OpenAI, Anthropic, or OpenRouter clients inline

## Runtime Environment

Use `@howells/envy` when an app depends on runtime env.

The default shape is a `packages/env` boundary that owns schema definition, parsing, generated Next.js server/client modules, lint helper config, and provider preflight checks. App code should import typed env exports rather than reading `process.env` directly.

## Agent and MCP Surfaces

Recent agent-heavy repos are converging on explicit package boundaries for tool surfaces:

- `packages/ai` for repo-specific model/provider composition above `@howells/ai`
- `packages/mastra` for Mastra runtime code, agents, tools, workflows, storage, memory, observability, scorers, and runtime routes
- `packages/agents` for reusable non-Mastra agent definitions, evaluators, prompts, and tool wiring
- `packages/mcp` or `packages/mcp-server` for MCP server contracts and transport code
- `packages/cli` when the agent or ingestion surface needs a first-class command line

Use `zod` for tool and transport schemas, and keep provider plumbing behind `@howells/ai` instead of scattering raw AI SDK clients through app code.

Use `@modelcontextprotocol/sdk` when the repo exposes MCP tools or resources. Do not bury MCP tool contracts inside a Next.js route unless the route is the only consumer and there is no expected CLI, test, or agent reuse.

## Ingestion and Enrichment

For source-heavy or scraper-heavy repos:

- use a dedicated `ingestion`, `enrichment`, or `scraper` package when pipeline behavior becomes substantial
- consider `@howells/srcfull` for browser/page-source extraction before building a fresh source-fetching layer

## Overlay Model

Use the overlay primitives deliberately:

- ordinary drawer or sheet: shared `vaul`-backed drawer layer
- stacked sheets or nested panel drills: `@howells/stacksheet`
- thumbnail-to-expanded image or video transitions: `@howells/aperto`

This avoids the common mistake of stretching a simple drawer primitive into a multi-layer workflow it was not designed to own.

## Short Version

For a new product app, the default answer is usually:

- Next.js
- the API seam appropriate to the consumers
- React Query
- Drizzle
- Neon
- Clerk
- the bundled UI baseline
- `@howells/ai` plus Mastra/MCP packages when agent behavior is part of the product
- Envy if runtime env exists
- Storybook if shared UI exists
- Fumadocs if the repo needs docs
- the house media storage packages if the repo needs media storage

Only deviate when the product constraints actually justify it.

See also:

- [Repo Archetypes](./repo-archetypes.md)
- [Package Boundaries](./package-boundaries.md)
- [Deployment Defaults](./deployment-defaults.md)
