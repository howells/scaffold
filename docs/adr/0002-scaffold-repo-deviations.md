---
title: "Scaffold repo deviations"
description: "Why this single-app documentation site omits parts of the product baseline."
---

# Scaffold repo deviations

Scaffold is a single-app documentation site, so it omits product-monorepo machinery. This ADR records those choices as required by [Getting started, step 8](../getting-started.md).

## Considered options

- Adopt the full published baseline verbatim (Turbo, `@howells/husky`/lint-staged, Vitest, workspace packages, `oxlint.config.ts`).
- Deviate deliberately for a single-app content site, and record the deviations here.

The full baseline would add unused configuration. This repo has one package, no shared test surface, and low commit volume.

## Deviations

- **No `turbo` / `turbo.json`.** Turbo orchestrates work across packages. This is a single package, so there is nothing to orchestrate.
- **No `@howells/husky` / `lint-staged`.** `pnpm check` is the local gate. The repo is single-author and low commit volume, so a staged-file pre-commit hook adds friction without protecting anything a manual `check` does not already cover.
- **No `vitest`.** The documentation-integrity script and static build are the test surface.
- **`pnpm-workspace.yaml` with empty `packages`.** The workspace file exists for pnpm settings (build allowlists, minimum-release-age exclusions), but declares no workspace packages because there are none.
- **No `oxlint.config.ts`.** Lint targets are passed as CLI arguments instead: `howells-check src next.config.mjs source.config.ts`. Scoping on the command line keeps the small, fixed set of lint targets visible in `package.json` without a separate config file.
- **The `format` script names its targets.** This excludes generated output and vendored reference trees.

## Consequence

These deviations apply only to this documentation site. Product repos still adopt Turbo, hooks, tests, and workspace packages when needed.
