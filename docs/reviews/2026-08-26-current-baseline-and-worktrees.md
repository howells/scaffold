# Current baseline and worktree coordination review

**Date:** 2026-08-26  
**Stage:** production-standard public documentation site, unconfirmed  
**Scope:** Scaffold source and documentation; direct manifests and recent Git history under `~/Sites`; selected Codex and Claude logs where they contained package, framework, or worktree decisions; current package registry metadata; official framework documentation.

## Verdict

Scaffold's architecture is still valid. The major-version lane remains Node 24, pnpm 11, Next.js 16, React 19, TypeScript 6, Tailwind CSS 4, Turbo 2, Vitest 4, Storybook 10, and AI SDK 7. Fumadocs on Next.js remains a sensible docs shape, and the generated skill mirror is a strong single-source boundary.

The drift was concentrated in six current-state claims and in delivery hygiene:

1. Next.js 16.2.10 was behind the [August 2026 security release](https://nextjs.org/blog/august-2026-security-release), which requires 16.3.3 on the active 16.x line.
2. Scaffold still recommended `@howells/motif-mcp` after Motif removed the package and deprecated it on npm in `motif@c76f31d`.
3. The baseline still installed raw `husky`, although `@howells/husky` now owns the immutable house hooks and appears in fourteen direct root manifests.
4. The full-stack archetype still said Clerk by default. The active portfolio has converged on WorkOS for the serious app lane; Clerk remains a deliberate lighter opt-out.
5. Dependency counts in Stack Decisions were inflated by counting nested package manifests as separate projects; one line duplicated TypeScript entirely.
6. Codex and Claude had machine configuration but no repository-owned, root-level worktree policy tying all accounts and harnesses to one coordinated umbrella.

## Evidence

The direct-root manifest scan covered 54 local Git checkouts declaring TypeScript, including first-party products, client repositories, and documentation mirrors. It is useful for relative recurrence, not for claiming 54 independent product choices. The strongest direct-root signals were:

| Package                      | Repositories |
| ---------------------------- | -----------: |
| `typescript`                 |           54 |
| `@howells/lint`              |           44 |
| `@howells/typescript-config` |           32 |
| `turbo`                      |           31 |
| `lint-staged`                |           29 |
| `vitest`                     |           25 |
| `husky`                      |           21 |
| `tsx`                        |           20 |
| `zod`                        |           19 |
| `react`                      |           18 |
| `tailwindcss`                |           16 |
| `next`                       |           14 |
| `@howells/husky`             |           14 |
| `@howells/envy`              |           12 |

Recent history supplied the more important directional evidence:

- `@howells/lint` 2.0 retired the Biome lane; 2.1 is the current package release.
- `@howells/husky` 0.2 is now the owned hook surface.
- Motif retired its MCP server because the agent-friendly CLI already exposes JSON, semantic exit codes, and a live `--describe` schema; the duplicate surface had no demonstrated audience.
- `@howells/ai` still intentionally defaults language-model calls to Vercel AI Gateway while deriving routing preference from the workload. Scaffold should defer to that package, not copy model rosters.
- DesignRound dropped DuckDB from its current app path, Materia removed Search Lab while retaining evaluation data, and Architizer removed Vercel Analytics from its production surface. None of those project-local removals justify a new global prohibition.
- Claude logs recorded a real shared-branch collision in Motif after concurrent work overwrote uncommitted edits. That supports isolated task worktrees and owner-controlled cleanup, not more aggressive automatic pruning.

The Codex and Claude log sample was used only as corroboration. Current manifests, Git history, package metadata, and executable checks remain the source of truth.

## Baseline score

This is the pre-remediation score using the medium-project survey axes.

| Axis | Score | Reason |
| --- | --: | --- |
| Security | 1/3 | No secret finding, but the direct Next.js dependency was behind a security patch and production audit reported high-severity dependency findings. |
| Performance | 2/3 | Static generation, local fonts, and a small client boundary are sound; there is no explicit performance budget. |
| Architecture | 3/3 | `docs/` is canonical, generated surfaces are checked for drift, and the app/package boundary is small. |
| Quality | 2/3 | Build, lint, and typecheck passed, but several maintained pages contradicted current packages and measured practice. |
| Tests | 0/3 | No test script or content-integrity suite existed. |
| Resilience | 2/3 | The site is mostly static and failure-light, but integrity depended on build coverage and manual review. |
| Operations | 1/3 | The Vercel project was linked, but there was no CI workflow enforcing `pnpm check`. |
| **Total** | **11/21** |  |

## Changes made from the review

- Added [Worktree Coordination](../reference/worktree-coordination.md) as the canonical cross-harness and cross-account policy.
- Updated the Next.js security patch and current docs-site dependencies without changing the major lane.
- Moved `shadcn` to development dependencies because it is a scaffolding CLI, not a runtime dependency.
- Replaced live Motif MCP recommendations with the SDK and agent-readable CLI.
- Made `@howells/husky` the new-project hook default.
- Made WorkOS the serious full-stack default while retaining Clerk as an explicit lighter opt-out.
- Replaced inflated project counts with a scoped, deduplicated direct-root snapshot.
- Added a content-integrity test and a GitHub Actions gate for `pnpm check` plus production dependency audit.

The post-remediation score is **17/21**: Security 3, Performance 2, Architecture 3, Quality 3, Tests 2, Resilience 2, and Operations 2. The remaining points are deliberately not claimed without a performance budget, broader failure-path coverage, and deployed-revision automation for Scaffold itself.

## Remaining judgement calls

- Scaffold itself continues to omit Git hooks under ADR 0002. CI now supplies the missing remote gate, so that local deviation remains proportionate.
- `vercel.ts` remains a prospective new-project preference, while `vercel.json` is still the measured portfolio norm.
- Exact provider and model choices remain owned by `@howells/ai`; exact media capability and model choices remain owned by Motif.
- This review does not turn project-local removals such as DuckDB or Vercel Analytics into blanket bans.

## Review cadence

Re-run this review when a house package publishes a compatibility-significant major, a default service is deliberately retired, or a framework security release affects the current major lane. Otherwise, review the major-version table and direct-root manifest snapshot quarterly. Historical reviews stay under `docs/reviews`; maintained recommendations stay under `docs/reference`.
