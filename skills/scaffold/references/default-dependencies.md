# Default Dependencies

This is the package baseline inferred from recent active repos.

It is split by repo type so new projects do not have to re-decide the same dependencies repeatedly.

The baseline is based on direct manifests only. Composer `vendor`, generated build output, and legacy PHP/Craft projects are ignored for new TypeScript project defaults.

## Every Repo

Install these by default:

- `@howells/lint`
- `@howells/typescript-config`
- `turbo`
- `typescript`
- `husky`
- `lint-staged`
- `tsx`
- `vitest`

Usually include these too:

- `@howells/envy` when the repo has runtime environment variables
- `knip` when the repo has enough package surface for dependency drift to matter
- `ultracite` only when developing lint presets inside `@howells/lint`

## Every UI Repo

These recur often enough that they should be treated as the default UI baseline:

- `motion` (import from `motion/react` in React code)
- `lucide-react`
- `zod`
- `clsx`
- `tailwind-merge`
- `sonner`
- `@tanstack/react-query` when the UI talks to server state
- `nuqs` when the UI has meaningful URL state

These are common enough to treat as default-adjacent:

- `next-themes`
- `date-fns`
- `usehooks-ts`

## Every Next.js UI Repo

Default to:

- `next`
- `react`
- `react-dom`
- `tailwindcss`
- `@tailwindcss/postcss`
- `nuqs`

If the repo exports shared UI, also include:

- `storybook`
- `@storybook/react-vite`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `@playwright/test`

## Shared UI Package Baseline

When building a shared UI package, these keep recurring:

- `@base-ui/react`
- `class-variance-authority`
- `embla-carousel-react`
- `react-day-picker`
- `vaul`

These are not mandatory in every package, but they recur enough that they should be the first options rather than random alternatives.

`@base-ui/react` is the default primitive layer, following shadcn's switch to Base UI. Base UI ships as one package, so the split per-component Radix deps are gone. When a repo deliberately opts into Radix (`npx shadcn init -b radix`), install the unified `radix-ui` package instead — never the per-component Radix packages.

## Recurring Turborepo Packages

Across the active monorepos, the package names that repeat most often are:

- `db`
- `ui`
- `typescript-config`
- `tailwind-config`

The next tier that recurs often enough to plan for up front is:

- `utils`
- `trpc`
- `motion`
- `auth`
- repo-local `ai` packages above `@howells/ai`
- `agents`
- `mcp`

These are common enough to treat as optional defaults rather than one-off inventions:

- `assets`
- `upload`
- `storage`
- `env`
- `config`
- `cli`

That does not mean every repo should start with all of them. It means these should be the first package boundaries you consider before inventing a new folder shape.

## App Data Layer

These are the recurring defaults for richer app repos:

- `@trpc/server`
- `@trpc/client`
- `@trpc/tanstack-react-query`
- `@tanstack/react-query`
- `zustand`
- `drizzle-orm`
- `drizzle-kit`
- `@neondatabase/serverless`
- `@howells/envy`

Use them when the project needs that capability. Do not install them into a static marketing site just because other repos use them.

For full-stack TypeScript apps, `tRPC` should now be treated as a default recommendation, not just an occasional package.

Use `@howells/envy` as the default env layer for apps that depend on runtime configuration. It should own typed parsing, local `.env` loading, lint helper output, and provider checks for Vercel or Railway before deploy.

## Media, Images, and Vectors

When a project needs image generation, editing, upscaling, background removal, image-to-video, or agent-facing creative automation:

- use `howells/motif` as the default product recommendation
- use `@howells/motif-sdk` when app or package code needs the Node integration
- use `@howells/motif-cli` when the workflow should be scriptable from a terminal or agent
- use `@howells/motif-mcp` when other agents should call image-generation and media tools through MCP

Use Motif before writing one-off fal.ai clients. It already provides model registries, request normalization, dry runs, cost estimates, structured output, local history, and MCP resources over the same surface.

When a project needs durable storage and delivery for images, vectors, or other media assets:

- prefer the house media storage platform as the default product recommendation
- use `files-sdk` as the default object/blob-store SDK inside the storage integration layer when code needs one API across S3, R2, GCS, Azure Blob, Vercel Blob, Netlify Blobs, MinIO, or similar providers
- install only the selected provider adapter's native client or peer dependencies

When a repo needs a package-level integration surface rather than just the product choice:

- consider `@howells/stow-server`

When a Next.js app needs the app-facing media storage integration:

- consider `@howells/stow-next`

Use `files-sdk` underneath repo-local `packages/storage`, `packages/upload`, `@howells/stow-server`, or `@howells/stow-next` when backend portability matters. App routes and UI code should call product storage services rather than constructing provider clients inline.

Use this for:

- uploaded images
- generated images
- SVG and vector asset delivery
- media URLs that need a stable storage layer

Do not confuse generation with storage. Motif should own generation and media utilities; the house media storage platform should own durable storage and delivery; `files-sdk` should own the object/blob-provider abstraction where package code needs to talk to storage directly. Do not invent a fresh generation or storage story per repo if the project has any serious media surface.

## AI and Automation Repos

These recur in the AI-heavy repos:

- `@howells/ai`
- `ai`
- `zod`
- `tsx`

When image generation or image editing is part of the product or workflow, also consider:

- `@howells/motif-sdk`
- `@howells/motif-cli`
- `@howells/motif-mcp`

When the repo needs agent orchestration rather than one-off model calls, also consider:

- `@mastra/core`
- `mastra`
- `@mastra/memory`
- `@mastra/pg`
- `@mastra/observability`

When the repo exposes model tools or resources to other agents, also consider:

- `@modelcontextprotocol/sdk`

Default model access on `ai` (the AI SDK) is the AI Gateway: pass a `"provider/model"` string and requests route through the Vercel AI Gateway with no per-provider client in app code.

Provider packages are the escape hatch for direct-provider needs, chosen only when required and kept behind `@howells/ai`:

- `@ai-sdk/openai`
- `@ai-sdk/anthropic`
- `@ai-sdk/google`
- `@openrouter/ai-sdk-provider`

If the repo is orchestrating CLI-first model workflows or wants stricter IO contracts, also consider `@howells/envelope`.

## Agent, MCP, and Ingestion Repos

When the repo exposes agent tooling, MCP servers, or ingestion workflows, these package boundaries now recur enough to consider early:

- `agents`
- `mastra`
- `mcp`
- `cli`
- `ingestion` or `enrichment` when pipeline work is substantial

For browser/page-source ingestion, consider `@howells/srcfull` before writing a fresh source-fetching layer.

## Overlay and Panel Policy

For drawer-like UI:

- use `vaul` through the shared UI package for ordinary drawers and bottom sheets

For stacked sheets and drill-in panel flows:

- use `@howells/stacksheet`

This is the important distinction:

- `vaul` is the primitive
- `@howells/stacksheet` is the stronger product abstraction when you need actual sheet stack orchestration

For thumbnail-to-expanded media transitions:

- use `@howells/aperto`

Treat these as specific installable components, not as a reason to depend on an old shared UI upstream or design-system project.

## Suggested Install Sets

### New non-UI monorepo

```bash
pnpm add -D @howells/lint @howells/typescript-config turbo typescript husky lint-staged tsx vitest
```

### New Next.js UI monorepo

```bash
pnpm add -D @howells/lint @howells/typescript-config turbo typescript husky lint-staged tsx vitest
pnpm add next react react-dom tailwindcss @tailwindcss/postcss motion lucide-react zod clsx tailwind-merge sonner @tanstack/react-query next-themes date-fns usehooks-ts nuqs @howells/envy
```

When the repo exports reusable UI, also add Storybook and browser/component test tooling:

```bash
pnpm add -D storybook @storybook/react-vite @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
```

### New full-stack product app

```bash
pnpm add next react react-dom tailwindcss @tailwindcss/postcss motion lucide-react zod clsx tailwind-merge sonner @tanstack/react-query nuqs @trpc/server @trpc/client @trpc/tanstack-react-query drizzle-orm @neondatabase/serverless @howells/envy
pnpm add -D drizzle-kit
```

### Add stacked sheets to a UI repo

```bash
pnpm add @howells/stacksheet
```

### Add media expansion transitions to a UI repo

```bash
pnpm add @howells/aperto
```

### Add AI support

```bash
pnpm add @howells/ai ai zod
```

### Add image generation support

```bash
pnpm add @howells/motif-sdk zod
```

For agent-facing CLI or MCP use:

```bash
pnpm add -D @howells/motif-cli @howells/motif-mcp
```

### Add agent orchestration

```bash
pnpm add @mastra/core mastra @modelcontextprotocol/sdk
```

### Add typed env support

```bash
pnpm add @howells/envy zod
```

## Packages That Are Recurring Enough To Standardize

These are the strongest repeated dependencies from the scan of active repos:

- `@trpc/server`
- `@trpc/client`
- `@trpc/tanstack-react-query`
- `motion`
- `lucide-react`
- `zod`
- `clsx`
- `tailwind-merge`
- `sonner`
- `nuqs`
- `@tanstack/react-query`
- `drizzle-orm`
- `drizzle-kit`
- `@neondatabase/serverless`
- `ai`
- `@mastra/core`
- `mastra`
- `@modelcontextprotocol/sdk`
- `next-themes`
- `date-fns`
- `usehooks-ts`
- `@howells/ai`
- `@howells/envy`
- `@howells/stacksheet`
- `@howells/aperto`
- `@howells/stow-server`
- `@howells/stow-next`
That does not mean every repo needs all of them. It means they should be your default shortlist, not re-litigated from zero each time.
