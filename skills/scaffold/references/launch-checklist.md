# Launch Checklist

Use this when starting a new repo or standardizing an existing one.

## Baseline

- `packageManager` pinned to the settled house pnpm line
- Node engine pinned to `>=24 <25` for apps and services
- `.node-version` pins the current Node 24 LTS patch
- `turbo` pinned
- `typescript` pinned
- `lint-staged` pinned
- `@howells/lint` installed
- `@howells/typescript-config` installed
- `@howells/envy` installed when runtime env exists
- `tsx` and `vitest` installed unless the repo has no script or test surface
- workspace layout uses `apps/*` and `packages/*`

## Config

- root `package.json` uses the standard script contract
- `pnpm-workspace.yaml` is present
- `turbo.json` is present and small
- `oxlint.config.ts` and `oxfmt.config.ts` use `@howells/lint` presets when the repo needs explicit lint or format configuration
- `tsconfig.json` uses explicit leaf presets
- `components.json` exists for UI repos
- `.husky/pre-commit` is installed
- `AGENTS.md` exists and is concise

## UI Projects

- the bundled UI baseline is the starting assumption
- shared primitives live in a package, not in the app
- Storybook exists for exported reusable UI
- local wrappers are preferred over primitive forks
- brand expression is handled through tokens and compositions, not component duplication
- `motion`, `lucide-react`, `zod`, `clsx`, `tailwind-merge`, and `sonner` are installed when the repo is UI-first
- `@tanstack/react-query` is used for client server-state and `nuqs` for meaningful URL state
- `@howells/stacksheet` is used for stacked sheet workflows instead of overextending a basic drawer
- `@howells/aperto` is considered for thumbnail-to-expanded media transitions instead of rebuilding that interaction locally

## Full-Stack and AI Projects

- Drizzle and Neon are the default persistence choice for TypeScript product apps
- `tRPC` is the default typed app API boundary unless the API needs to be language-agnostic
- `@howells/envy` owns env access and provider preflight checks
- `@howells/ai` is used before adding raw provider SDKs directly to app code
- `howells/motif` packages are used before adding raw fal.ai clients for image generation or media utilities
- `files-sdk` is used behind a storage/upload boundary when object/blob storage needs provider portability or agent-facing file operations
- Mastra is added only when the repo has real agent/workflow structure
- MCP contracts live in `packages/mcp` or `packages/mcp-server`, not hidden in app routes
- `zod` validates model IO, tool schemas, env schemas, and API boundaries where appropriate

## Verification

- `pnpm install` succeeds cleanly
- `pnpm lint` succeeds
- `pnpm typecheck` succeeds
- `pnpm build` succeeds
- `pnpm test` succeeds or is intentionally not present yet
- hooks run without surprising side effects

## Guardrails

- cache is disabled by default in Turbo tasks
- task-level env is scoped narrowly
- env parsing and provider checks use `@howells/envy` when the repo has runtime env
- there is no direct `oxlint`, `oxfmt`, Biome, Prettier, or ESLint dependency drifting away from `@howells/lint`
- there is no generic local tsconfig base hiding runtime assumptions
- there is no duplicate component system growing beside `packages/ui` in a new UI repo
- there is no second local motion/transition mini-framework appearing without a strong reason
- there is no local clone of `@howells/stacksheet` or `@howells/aperto` behavior without a strong product-specific reason
- there are no raw AI provider clients scattered through app routes
- there are no new-project defaults derived from legacy PHP/Craft dependencies
