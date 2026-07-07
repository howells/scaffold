---
title: "Scaffold Repo Deviations"
description: "The scaffold repository deliberately deviates from its own published baseline because it is a single-app documentation site, not a product monorepo. It drops the workspace, orchestration, hook, and test machinery the baseline assumes, and gates on a static build instead of a test suite. Getting Started step 8 asks every repo to record intentional deviations early; this ADR is scaffold's own record."
---

# Scaffold Repo Deviations

The scaffold repository deliberately deviates from its own published baseline because it is a single-app documentation site, not a product monorepo. It drops the workspace, orchestration, hook, and test machinery the baseline assumes, and gates on a static build instead of a test suite. [Getting Started step 8](../getting-started.md) asks every repo to record intentional deviations early rather than re-deciding the same defaults each time; this ADR is scaffold's own record.

## Considered Options

- Adopt the full published baseline verbatim (turbo, husky/lint-staged, vitest, workspace packages, `oxlint.config.ts`).
- Deviate deliberately for a single-app content site, and record the deviations here.

Full-baseline compliance was rejected because most of that machinery orchestrates or protects concerns this repo does not have: no second package to build, no shared test surface, no high-volume multi-author commit stream. Carrying it unused would be dead configuration that rots and misleads readers about what the baseline is _for_.

## Deviations

- **No `turbo` / `turbo.json`.** Turbo orchestrates work across packages. This is a single package, so there is nothing to orchestrate.
- **No `husky` / `lint-staged`.** `pnpm check` is the local gate. The repo is single-author and low commit volume, so a staged-file pre-commit hook adds friction without protecting anything a manual `check` does not already cover.
- **No `vitest` / `test` script; `check` gates on `build` instead of `test`.** For a content site the meaningful correctness gate is that every docs page still statically generates. `pnpm check` therefore runs `lint && typecheck && build && sync:skill --check` — the build _is_ the test.
- **`pnpm-workspace.yaml` with empty `packages`.** The workspace file exists for pnpm settings (build allowlists, minimum-release-age exclusions), but declares no workspace packages because there are none.
- **No `oxlint.config.ts`.** Lint targets are passed as CLI arguments instead: `howells-check src next.config.mjs source.config.ts`. Scoping on the command line keeps the small, fixed set of lint targets visible in `package.json` without a separate config file.
- **The `format` script enumerates root files explicitly.** It runs `howells-oxfmt --write AGENTS.md README.md package.json pnpm-workspace.yaml next.config.mjs source.config.ts postcss.config.mjs tsconfig.json src` rather than the directory form `howells-fix .`. This is intentional: it formats exactly the tracked source directory plus the specific root config files, and avoids sweeping generated output (`.next`, build artifacts) or vendored reference trees. The explicit list is the deliberate scope, not an oversight to migrate.

## Consequence

These deviations are scoped to the fact that scaffold is a docs site. They do not weaken the published baseline for product repos, which should still adopt turbo, hooks, a real test suite, and workspace packages where those concerns apply.
