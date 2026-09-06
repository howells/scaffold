# Launch checklist

Use this for a new repo or before releasing an aligned existing repo.

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
- shared versions use the workspace catalog where more than one package consumes them
- pnpm settings, overrides, patches, and lifecycle-build policy live in `pnpm-workspace.yaml`
- dependency build scripts are explicitly allowed or denied
- serious public-facing repos apply a reviewed release-age cooldown to third-party packages
- `turbo.json` is present and small
- `oxlint.config.ts` and `oxfmt.config.ts` use `@howells/lint` presets when the repo needs explicit lint or format configuration
- `tsconfig.json` uses explicit leaf presets
- `components.json` exists for UI repos
- `@howells/husky` is installed and generated hooks are current
- `AGENTS.md` exists and is concise

## UI projects

- the bundled UI baseline is the starting assumption
- shared primitives live in a package, not in the app
- Storybook exists for exported reusable UI
- local wrappers are preferred over primitive forks
- brand expression is handled through tokens and compositions, not component duplication
- `motion`, `lucide-react`, `zod`, `cn`, and `sonner` are installed when the repo is UI-first
- `@tanstack/react-query` is used for client server-state and `nuqs` for meaningful URL state
- `@howells/stacksheet` is used for stacked sheet workflows instead of overextending a basic drawer
- `@howells/aperto` is considered for thumbnail-to-expanded media transitions instead of rebuilding that interaction locally

## Full-stack and AI projects

- Drizzle and Neon are the default persistence choice for TypeScript product apps
- the API uses the narrowest typed boundary that fits: server composition, same-workspace `tRPC`, or a versioned OpenAPI contract
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

## CI and operations

- CI runs the root `check` command from the pinned Node version with a frozen lockfile
- Blacksmith is reserved for measured CI validation and uses the smallest runner that passes; deployments, releases, housekeeping, drift checks, and scheduled maintenance use GitHub-hosted runners
- pull-request CI cancels stale runs and skips draft pull requests
- Vercel performs the single production web build unless a separate CI build proves a distinct contract
- environment preflight validates names and shape without printing secret values
- deployment has a smoke check for the primary user flow and any public agent/API surface
- the deployed app exposes a non-secret build identity and the release workflow verifies that production reports the expected revision
- a low-cost scheduled freshness check catches a green commit that never reached production
- scheduled jobs, queues, and background workers expose failure somewhere actionable instead of failing silently
- production data needed at launch is present, queryable, and covered by a rollback or repair path
- destructive maintenance tasks require an explicit target and support a dry run where practical

## Test the gates

- every custom conformance or policy guard has a negative fixture, mutation mode, or other proof that it can fail
- CI verifies that expected test files and meaningful test counts were actually discovered
- interaction-heavy web apps run their browser suite in CI; include WebKit when Safari behavior matters
- a new non-blocking quality signal has an owner and an explicit condition for becoming blocking

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
