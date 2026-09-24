---
title: "Default dependencies"
description: "Package defaults for framework, data, lint, config, and AI work."
---

# Default dependencies

These defaults come from direct manifests in active TypeScript repos. Composer `vendor`, build output, PHP, and Craft projects are excluded.

## Every repo

Install these by default:

- `@howells/lint`
- `@howells/typescript-config`
- `turbo`
- `typescript`
- `@howells/husky`
- `lint-staged`
- `tsx`
- `vitest`

Usually include these too:

- `@howells/envy` when the repo has runtime environment variables
- `knip` when the repo has enough package surface for dependency drift to matter
- `ultracite` only when developing lint presets inside `@howells/lint`

## Every UI repo

Default UI dependencies:

- `motion` (import from `motion/react` in React code)
- `lucide-react`
- `zod`
- `cn`
- `sonner`
- `@tanstack/react-query` when the UI talks to server state
- `nuqs` when the UI has meaningful URL state

Common additions:

- `next-themes`
- `date-fns`
- `usehooks-ts`

Use the official [`cn`](https://github.com/shadcn-ui/cn) package for conditional class names and Tailwind v4 conflict resolution. Import `{ cn }` from `"cn"`; existing `lib/utils.ts` helpers can re-export it. Preserve custom merge rules with `createCn` from `"cn/config"`. Projects still on Tailwind v3 keep `tailwind-merge` v2 until they upgrade Tailwind.

## Every Next.js UI repo

Default to:

- `next`
- `react`
- `react-dom`
- `tailwindcss`
- `@tailwindcss/postcss`
- `nuqs`

If the repo exports shared UI, also include:

- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `@playwright/test`
- `storybook` and `@storybook/react-vite` only for a complex shared UI package

## Shared UI package baseline

When building a shared UI package, these keep recurring:

- `@base-ui/react`
- `class-variance-authority`
- `@blossom-carousel/react`
- `react-day-picker`
- `vaul`

Use these first when the package needs the capability. Blossom replaces `embla-carousel-react` for new carousels; existing Embla carousels move when their repo is next worked on.

`@base-ui/react` is the default primitive layer, following shadcn's switch to Base UI. Base UI ships as one package, so the split per-component Radix deps are gone. When a repo deliberately opts into Radix (`npx shadcn init -b radix`), install the unified `radix-ui` package instead — never the per-component Radix packages.

## Library picks by task

Name the task before the library, and use the pick below. When a repo already uses a competitor, leave it until the repo is next worked on. These started from Emil Kowalski's [pick-ui-library](https://github.com/emilkowalski/skills/tree/main/skills/pick-ui-library) list and were checked against the libraries in active repos.

| Task | Pick |
| --- | --- |
| Accessible primitives: dialogs, popovers, menus, selects | `@base-ui/react` |
| Command menu (⌘K) | `cmdk` |
| Toasts | `sonner` |
| Drawers and bottom sheets | `vaul`, through the repo's UI package |
| Stacked sheets and drill-in panels | `@patternmode/stacksheet` |
| Thumbnail-to-expanded media | `@patternmode/aperto` |
| Carousels | `@blossom-carousel/react` |
| Date pickers | `react-day-picker` |
| One-time code inputs | `input-otp` |
| Forms | `react-hook-form` with `zod` |
| Animation: springs, layout, enter and exit | `motion`; plain CSS transitions for hovers and fades |
| Tailwind enter and exit keyframes | `tw-animate-css` |
| Animated numbers | `@number-flow/react` |
| Animated text | `torph` |
| Syntax highlighting | `shiki` |
| Streaming Markdown from a model | `streamdown` |
| Open Graph images | `ImageResponse` from `next/og` |
| Node graphs and canvases | `@xyflow/react` |
| 3D scenes | `three` with `@react-three/fiber` |
| 3D globes | `cobe` |
| Dashboard charts | `recharts` |
| Bespoke data visualisation | the individual `d3-*` modules it needs |
| Live streaming charts | `liveline` |
| Data tables | `@tanstack/react-table` |
| Long lists and large tables | `@tanstack/react-virtual` |
| Drag and drop | `@dnd-kit/core` with `@dnd-kit/sortable` |
| Server state | `@tanstack/react-query` |
| Shared client state | `zustand` |
| URL state | `nuqs` |
| Class names | `cn` |
| Component variants | `class-variance-authority` |
| Theme switching without a flash | `next-themes` |
| Tuning panels during development | `dialkit`; `leva` inside React Three Fiber scenes |

Common mismatches:

- A hand-built toast, or a toast built on a modal library: use Sonner.
- A `<div>` dropdown or dialog with manual focus handling: use Base UI.
- A number animated by re-rendering its text: use NumberFlow.
- A list of a thousand or more rows rendered directly: virtualise it before adding pagination.
- Shared state passed through `useState` and props across many components: use zustand.
- Class-name ternaries nested three deep: use `cn`, or cva when the component has real variants.
- A chart library bent into a designed graphic: use d3 modules.

## Recurring Turborepo packages

Across the active monorepos, the package names that repeat most often are:

- `db`
- `ui`
- `env`

The next tier that recurs often enough to plan for up front is:

- `tailwind-config`
- `utils`
- `motion`
- `auth`
- `mastra`
- `trpc` when a same-workspace typed API needs it

Optional defaults:

- `assets`
- `upload`
- `storage`
- `config`
- `cli`

That does not mean every repo should start with all of them. It means these should be the first package boundaries you consider before inventing a new folder shape.

## App data layer

These are the recurring data choices for richer app repos:

- `@tanstack/react-query`
- `zustand`
- `drizzle-orm`
- `drizzle-kit`
- `@neondatabase/serverless`
- `@howells/envy`

Use them when the project needs that capability. Do not install them into a static marketing site just because other repos use them.

Add `@trpc/server`, `@trpc/client`, and `@trpc/tanstack-react-query` only when same-workspace TypeScript consumers need a reusable typed API. Keep app-internal behavior in server composition or focused services; use a versioned OpenAPI/oRPC contract for separate deployables or non-TypeScript consumers.

Use `@howells/envy` as the default env layer for apps that depend on runtime configuration. It should own typed parsing, local `.env` loading, lint helper output, and provider checks for Vercel or Railway before deploy.

## Media, images, and vectors

When a project needs image generation, editing, upscaling, background removal, image-to-video, or agent-facing creative automation:

- use `howells/motif` as the default product recommendation
- use `@howells/motif-sdk` when app or package code needs the Node integration
- use `@howells/motif-cli` when the workflow should be scriptable from a terminal or agent; it exposes JSON/NDJSON, semantic exit codes, dry runs, and a live `--describe` schema

Use Motif before writing one-off fal.ai clients. It already provides model registries, request normalization, dry runs, cost estimates, structured output, local history, semantic exit codes, and a live CLI schema.

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

## AI and automation repos

These recur in the AI-heavy repos:

- `@howells/ai`
- `ai`
- `zod`
- `tsx`

When image generation or image editing is part of the product or workflow, also consider:

- `@howells/motif-sdk`
- `@howells/motif-cli`

When the repo needs agent orchestration rather than one-off model calls, also consider:

- `@mastra/core`
- `mastra`
- `@mastra/memory`
- `@mastra/pg`
- `@mastra/observability`

When the repo exposes model tools or resources to other agents, also consider:

- `@modelcontextprotocol/sdk`

`@howells/ai` owns model choice: sizes (nano to reasoning), catalogues and provider routing. Its default route is OpenRouter, which is what the active repos use; Vercel AI Gateway and direct providers stay available behind the same boundary. Repos ask for a size, never a model string, and pass the result to Mastra. `@howells/mastra` carries no model code of its own.

Provider packages are the escape hatch for direct-provider needs, chosen only when required and kept behind `@howells/ai`:

- `@ai-sdk/openai`
- `@ai-sdk/anthropic`
- `@ai-sdk/google`
- `@openrouter/ai-sdk-provider`

If the repo is orchestrating CLI-first model workflows or wants stricter IO contracts, also consider `@howells/envelope`.

## Agent, MCP, and ingestion repos

When the repo exposes agent tooling or MCP servers:

- `mastra` for agents, tools, workflows, storage and the Mastra MCP server
- `mcp` only for a standalone read-only server without Mastra
- `cli` when operations need a command line

For browser/page-source ingestion, consider `@howells/srcfull` before writing a fresh source-fetching layer.

## Overlay and panel policy

For drawer-like UI:

- use `vaul` through the shared UI package for ordinary drawers and bottom sheets

For stacked sheets and drill-in panel flows:

- use `@patternmode/stacksheet`

Choose by interaction:

- `vaul` is the primitive
- `@patternmode/stacksheet` is the stronger product abstraction when you need actual sheet stack orchestration

For thumbnail-to-expanded media transitions:

- use `@patternmode/aperto`

Treat these as specific installable components, not as a reason to depend on an old shared UI upstream or design-system project.

## Suggested install sets

### New non-UI monorepo

```bash
pnpm add -D @howells/lint @howells/typescript-config @howells/husky turbo typescript lint-staged tsx vitest
```

### New Next.js UI monorepo

```bash
pnpm add -D @howells/lint @howells/typescript-config @howells/husky turbo typescript lint-staged tsx vitest
pnpm add next react react-dom tailwindcss @tailwindcss/postcss motion lucide-react zod cn sonner @tanstack/react-query next-themes date-fns usehooks-ts nuqs @howells/envy
```

When the repo exports reusable UI, also add browser and component test tooling:

```bash
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
```

### New full-stack product app

```bash
pnpm add next react react-dom tailwindcss @tailwindcss/postcss motion lucide-react zod cn sonner @tanstack/react-query nuqs drizzle-orm @neondatabase/serverless @howells/envy
pnpm add -D drizzle-kit
```

When a same-workspace typed API is part of the chosen architecture:

```bash
pnpm add @trpc/server @trpc/client @trpc/tanstack-react-query
```

### Add stacked sheets to a UI repo

```bash
pnpm add @patternmode/stacksheet
```

### Add media expansion transitions to a UI repo

```bash
pnpm add @patternmode/aperto
```

### Add AI support

```bash
pnpm add @howells/ai ai zod
```

### Add image generation support

```bash
pnpm add @howells/motif-sdk zod
```

For agent-facing command-line use:

```bash
pnpm add -D @howells/motif-cli
```

### Add agent orchestration

```bash
pnpm add @mastra/core mastra @modelcontextprotocol/sdk
```

### Add typed env support

```bash
pnpm add @howells/envy zod
```

## Standard shortlist

The direct-manifest scan found these repeatedly:

- `motion`
- `lucide-react`
- `zod`
- `cn`
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
- `@patternmode/stacksheet`
- `@patternmode/aperto`
- `@howells/stow-server`
- `@howells/stow-next`

Install only the entries required by the repo archetype.
