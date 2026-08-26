# Repo archetypes

Choose one of these shapes for new TypeScript or native Apple work. PHP and Craft maintenance projects follow their existing architecture.

## 1. Full-stack product app

Use this for:

- authenticated product apps
- dashboard-style products
- apps with real database-backed behavior
- products with both UI and backend logic

Default stack:

- Next.js App Router
- the narrowest typed API boundary that fits the consumers
- React Query when the client owns server-state
- Drizzle
- Neon
- WorkOS by default; Clerk only when a lighter existing or consumer-oriented app has a concrete reason
- bundled UI baseline
- `@howells/envy` when runtime env exists
- `@howells/ai`, Mastra, and MCP packages when agent behavior is product behavior

Typical workspace:

```text
apps/
  web/
  storybook/        # only if shared UI exists
packages/
  db/
  trpc/             # only for a same-workspace typed API
  ui/
  typescript-config/
  tailwind-config/
  env/
  motion/
  auth/             # when auth is shared
  ai/               # only for repo-specific logic above @howells/ai
  mastra/           # when Mastra owns agent/workflow runtime behavior
  agents/           # when agent behavior is shared
  mcp/              # when the repo exposes MCP tools or resources
  assets/           # when multiple surfaces share assets
  upload/           # only if needed
```

## 2. UI system or design-system repo

Use this for:

- shared UI foundations
- component libraries
- token systems
- motion and transition primitives

Default stack:

- scaffold UI-baseline monorepo shape
- Storybook
- playground or docs app

Typical workspace:

```text
apps/
  playground/
  storybook/
  web/              # optional docs/system site
packages/
  ui/
  typescript-config/
  tailwind-config/
  motion/
  transition/
```

Use this model for new shared UI work.

## 3. Docs or content site

Use this for:

- product docs
- developer docs
- editorial or content-led sites with light app behavior

Default stack:

- Next.js
- Fumadocs when the site is really documentation
- plain markdown only when the surface is still small

Typical workspace:

```text
apps/
  web/
packages/
  ui/               # optional shared site components
  content/          # optional if content transforms are non-trivial
```

Do not install a huge application architecture unless the site actually needs it.

## 4. Published package

Use this for:

- OSS packages
- reusable libraries
- packages with their own docs/demo site

Default stack:

- package at repo root or minimal monorepo
- `tsup` or repo-specific build tooling if needed
- docs/demo site only if the package benefits from one
- Node 24 for development and CI
- Node `>=22` as the runtime floor only when the library does not need Node 24 APIs

Examples in your ecosystem:

- `@howells/stacksheet`
- `@howells/aperto`
- `@howells/envelope`
- `@howells/envy`
- `@howells/lint`
- `@howells/typescript-config`

This archetype should stay lean. Do not force app-style monorepo complexity into a package repo.

## 5. Worker or service-heavy system

Use this for:

- multi-service backends
- cron-heavy systems
- background jobs and ingestion pipelines
- systems with multiple deployable runtimes

Default shape:

- `pnpm` monorepo
- shared packages for core logic
- services or workers as their own deployable units
- Railway-style deployment when the system stops fitting a pure Vercel shape

Typical workspace:

```text
apps/
  web/              # optional
  api/              # optional
packages/
  db/
  core/
  jobs/
  storage/
services/
  workers/
  crons/
```

## 6. AI pipeline or research repo

Use this for:

- ingestion pipelines
- model orchestration
- generation workflows
- classifier or embedding jobs

Default stack:

- `tsx`
- `zod`
- `ai`
- `@howells/ai`
- Motif's SDK or agent-readable CLI when image generation, editing, media utilities, or creative automation are central
- Mastra when the repo needs agent orchestration, workflow state, memory, or observability
- `@modelcontextprotocol/sdk` when the repo exposes MCP tools or resources
- Drizzle if persistence is needed
- the house media storage packages if generated assets are stored
- `mastra`, `agents`, `mcp`, or `cli` packages when the repo exposes reusable agent tooling
- `@howells/srcfull` if browser or page-source ingestion is central

Define script and data-pipeline conventions explicitly.

## 7. Native Apple client

Use this for:

- SwiftUI iPhone, iPad, or macOS products
- a native client paired with an existing service or domain core
- TestFlight or App Store distribution

Default shape:

- keep the SwiftUI client thin over a versioned service or domain contract
- generate Xcode projects with XcodeGen when the repo uses it; do not hand-edit generated project files
- keep persisted `Codable` models backwards-compatible and test upgrades against earlier stored data
- verify real simulator or device interaction and run the architecture-appropriate native CI lane
- own TestFlight/App Store credentials and distribution in a runbook
- verify a separately deployed API is live before the client assumes a merged contract exists

Do not force Node scripts or a web package graph onto a native repo just to resemble the TypeScript archetypes.

## Choose an archetype

Use these defaults:

- product app: full-stack product app
- shared components: UI system repo
- docs-first surface: docs or content site
- reusable library: published package
- multiple workers/services: worker or service-heavy system
- model workflows and ingestion: AI pipeline or research repo
- SwiftUI product or native companion: native Apple client

If two archetypes apply, choose the dominant one and add only the secondary capabilities needed.
