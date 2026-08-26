# Four-week portfolio alignment review

**Window:** 2026-07-17 through 2026-08-14, inclusive
**Scope:** direct child Git repositories under `~/Sites`; local Git history, checked-in source, manifests, lockfiles, `AGENTS.md`, `CONTEXT.md`, architecture documents, and CI/deployment configuration only.
**Snapshot:** 42 active repositories, 3,548 commits reachable from their current `HEAD`s. Thirty-six are first-party product, package, or standards repositories (2,821 commits); six are documentation mirrors or collaboration/reference checkouts (727 commits). Minor and patch differences are ignored unless they changed behaviour.

## Verdict

Scaffold matches most current practice: pnpm workspaces, Node 24, Next.js App Router, React 19, Tailwind 4, explicit packages, server-first composition, typed environment boundaries, shared lint and TypeScript configuration, disabled Turbo caching, Drizzle and Neon, explicit agent packages, and browser verification.

Six gaps needed correction:

1. `tRPC` is documented as a default although the portfolio deliberately uses several API shapes and only five active first-party repos depend on it.
2. `drizzle-kit push` is documented as the production migration workflow although mature products use reviewed migrations and runbooks.
3. the AI provider pages disagreed about Vercel AI Gateway and OpenRouter; `@howells/ai` owns a provisional Gateway package default, not a portfolio-wide Gateway requirement.
4. recent production work has raised the bar from “deploy succeeded” to “production proves which commit is serving,” plus recurring operational evidence.
5. pnpm catalog and supply-chain configuration has become a real part of the house toolchain but is barely represented in Scaffold.
6. three current products have native Apple surfaces, which the TypeScript-only archetype list does not help with.

The Arc deprecation edits already present in Scaffold are directionally correct. They should land before the remaining recommendations so the baseline has one clear working model: capable coding assistant, concise repo-local instructions, Matt Pocock's general-development skills, and Daniel's specialist skills on demand.

## Highest-priority changes

### 1. Replace “tRPC by default” with “choose the narrowest typed boundary”

Scaffold currently calls `tRPC` the default in [Overview](../README.md), [Architecture Defaults](../reference/architecture-defaults.md), [Repo Archetypes](../reference/repo-archetypes.md), and [Default Dependencies](../reference/default-dependencies.md). The same docs already admit the measured reality in [Stack in Practice](../reference/stack-in-practice.md): `tRPC` is deliberately rare.

Only five of the 36 active first-party repos currently declare `@trpc/server`: DesignRound, Materia, Materialdesk, MaterialGraph, and Rulework. Recent work reinforces three distinct seams:

- app-internal composition can remain Server Components, server actions, or typed fetch;
- same-workspace end-to-end TypeScript can use tRPC;
- separately deployed or non-TypeScript consumers need a versioned HTTP/OpenAPI contract.

Rulework is the clearest new evidence: `api/openapi.yaml` became the source of truth with explicit concurrency and error semantics in `fb67403b`, and `api/conformance.sh` was made part of `pnpm check` in `0dbd2ac`. MaterialGraph's discovery endpoint in `0241b7fed` similarly treats capability/refusal shape as a public product contract.

Replace “tRPC is the default typed API layer” with a decision table. Keep tRPC for same-workspace clients, server composition when no reusable API exists, and OpenAPI, oRPC, or another versioned contract for separate deployables. Remove `trpc` from the default package list.

Evidence: [Rulework OpenAPI](/Users/danielhowells/Sites/rulework/api/openapi.yaml), [Rulework conformance gate](/Users/danielhowells/Sites/rulework/api/conformance.sh), [MaterialGraph operator contract](/Users/danielhowells/Sites/materialgraph/packages/products/src/graph-operators.ts).

### 2. Split database guidance into prototype/local and production paths

[Architecture Defaults](../reference/architecture-defaults.md) currently says `drizzle-kit push` is the workflow and not to hand-author migrations. That is too strong for the systems now being built.

- Foundling explicitly forbids `db:push` against production and requires backup → `drizzle-kit migrate` → smoke test in [AGENTS.md](/Users/danielhowells/Sites/foundling/AGENTS.md).
- Rulework deliberately retired `drizzle-kit generate` and documents hand-written migrations plus a schema drift check (`3e6b58a`).
- MaterialGraph still uses `db:push` for schema synchronisation but also owns numerous attributable, one-purpose production migrations in [packages/db/package.json](/Users/danielhowells/Sites/materialgraph/packages/db/package.json).
- Fieldportrait has a guarded `db:push:verified` that inspects before and after in [packages/db/package.json](/Users/danielhowells/Sites/fieldportrait/packages/db/package.json).

Change the guidance:

- local/prototype database: `drizzle-kit push` is acceptable;
- production with valuable data: checked-in reviewed migration, explicit target, backup/rollback or repair path, pre/post schema verification, and smoke test;
- established databases may use hand-written migrations when generation is not trustworthy, but must keep schema-drift detection;
- never imply that one Drizzle command is safe for every lifecycle stage.

This is a policy correction, not a request to standardise every existing migration mechanism immediately.

### 3. Make provider routing single-source and version-aware

[Stack in Practice](../reference/stack-in-practice.md) said OpenRouter was the default while [Default Dependencies](../reference/default-dependencies.md) said Gateway. The package owns the implementation decision: [the `@howells/ai` AGENTS.md](/Users/danielhowells/Sites/ai/AGENTS.md) records Vercel AI Gateway as its current default route, with OpenRouter and direct providers available per call. Repository history shows that was an April 2026 benchmark decision, not a claim that every project consciously uses Gateway. Commit `e527c47` moved the package to AI SDK 7 and the corresponding provider majors.

Make `@howells/ai` the authority for provider and model selection. Describe Gateway as its provisional package default and keep Gateway, OpenRouter, or direct-provider choice explicit. Do not copy an exact model roster into Scaffold. Start new work on AI SDK 7; migrate SDK 6 products as a compatibility change.

Evidence: [AI provider registry](/Users/danielhowells/Sites/ai/src/providers/registry.ts), [AI model matrix](/Users/danielhowells/Sites/ai/src/models.ts), `ai@e527c47`.

### 4. Add a major-version ledger, not a minor-version matrix

The observed new-work lane is now Node 24, pnpm 11, Next 16, React 19, TypeScript 6, Tailwind 4, Turbo 2, Vitest 4, Storybook 10, and AI SDK 7. Twenty-three of the 34 first-party repos with a root `package.json` pin pnpm 11; nine remain on pnpm 10 and two on pnpm 9. That makes pnpm 11 the sensible new-repo baseline without making a pnpm 10 fleet migration urgent.

Add a reviewed current-majors table to Stack Decisions. Track compatibility-significant majors and adoption dates; keep minor and patch versions in repo catalogs and lockfiles.

Published packages need one additional rule: test every runtime major still claimed in `engines`, even if it is no longer the new-project default. Gauge found that its Node 20 CI lane ran zero tests because of shell glob behaviour (`4d15af9`). Dropping an existing runtime floor should wait for a deliberate package major.

Semantic changes also count. Colorscope correctly shipped family reclassification as 4.0.0 despite an unchanged API (`364873c3`), and Gauge shipped a nullable structured field as 4.0.0 (`e770d7c`). Scaffold should say that persisted classifications, machine-readable output, schema meaning, and nullability can require a major even when function names do not change.

## Additions to the baseline

### pnpm workspace and supply-chain policy

Sixteen first-party repos now use pnpm catalogs. Seven enforce `minimumReleaseAge`; lifecycle-script allow/deny configuration appears in most serious workspaces. Materialdesk codified a 24-hour third-party cooldown in `0f1bf96` and corrected private-package exclusions in `3db63d2`. Rulework and Gauge independently found that pnpm configuration left in `package.json` was being ignored; both moved overrides/patches to `pnpm-workspace.yaml` (`rulework@d0407d5`, `gauge@46c5b5e`).

Add a pnpm policy section and config snippet:

- shared dependency versions live in the workspace catalog;
- pnpm settings, overrides, and patches live in `pnpm-workspace.yaml`;
- lifecycle builds are explicitly allowed, never inherited accidentally;
- serious/public-facing repos cool down new third-party releases;
- first-party/private exclusions are exact and reviewed;
- a frozen-lockfile install is itself tested from a clean checkout.

Evidence: [Materialdesk workspace policy](/Users/danielhowells/Sites/materialdesk/pnpm-workspace.yaml), [Kiln workspace policy](/Users/danielhowells/Sites/kiln/pnpm-workspace.yaml), [Rulework workspace policy](/Users/danielhowells/Sites/rulework/pnpm-workspace.yaml).

### Deployment must prove the running revision

The current uncommitted Launch Checklist additions cover CI, smoke checks, recurring jobs, and repair paths. Keep them, then add deployed-revision proof.

MaterialGraph had twelve green commits that were not running in production. Commit `4bce9fbb1` added a scheduled deployed-SHA freshness check; `5de741092` made the repository deploy `main` and verify production's own version response; `933d3dded` fixed the workflow's action pinning before it could fail silently. This is stronger than checking the provider's build log.

Recommended launch rule: expose a non-secret build identity, verify the primary live surface reports the expected revision after deployment, and run a low-cost scheduled freshness backstop. Scheduled data checks should retain machine-readable evidence and actionable failure output; MaterialGraph's weekly fidelity census in `7e6b92b97` is the current exemplar.

Evidence: [deploy production workflow](/Users/danielhowells/Sites/materialgraph/.github/workflows/deploy-production.yml), [freshness workflow](/Users/danielhowells/Sites/materialgraph/.github/workflows/deploy-freshness.yml), [freshness checker](/Users/danielhowells/Sites/materialgraph/scripts/check-deploy-freshness.mjs).

The statement in [Deployment Defaults](../reference/deployment-defaults.md) that `vercel.ts` is the current portfolio default should be labelled prospective: this survey found 14 first-party repos with tracked `vercel.json` files and none with `vercel.ts`. It may remain the desired new-project choice, but it is not yet a measured convention.

### Gates must demonstrate that they can fail

This recurred too often to remain implicit:

- MaterialGraph's SDK parity test only checked assignability one way and missed five fields; `0b22b4ad0` added key-set parity.
- four production scorers had no tests; `551b54030` added policy cases and a coverage gate that was proved with a deliberately missing scorer.
- Rulework's OpenAPI conformance gate uses a mutation/bites mode so a vacuous checker cannot certify itself (`0dbd2ac`).
- Materialdesk's Playwright suite existed but no CI job invoked it; `2bf0abe` added Chromium and WebKit as an initially non-blocking bell.

Add to testing/launch guidance: every custom guard should have a negative fixture or mutation proving it bites; verify test discovery/counts; and interaction-heavy web apps should run the browser suite in CI, with WebKit as well as Chromium when Safari matters. A new signal can start non-blocking, but it needs an owner and a condition for promotion.

### Add a native Apple-client archetype

Scaffold is explicitly TypeScript-first, but recent first-party product work now includes:

- Ottilie, a native SwiftUI iPhone client with TestFlight distribution and a server-owned claim boundary;
- Monogrove, a native Swift macOS surface over a Go core and checked NDJSON protocol (`038bc8f`);
- Foundling, which maintains iOS and web clients against shared contracts.

Add either a seventh archetype or an explicit companion note:

- SwiftUI client stays thin over a versioned service/domain contract;
- XcodeGen projects are generated, never hand-edited;
- persisted `Codable` models need backwards-compatible decoding and upgrade tests against prior data;
- verification means simulator/device interaction plus the architecture-appropriate CI lane, not a forced Node test shape;
- TestFlight/App Store credentials and distribution have an owned runbook;
- separately deployed APIs must be verified live before the client assumes a merged contract exists.

Evidence: [Ottilie AGENTS.md](/Users/danielhowells/Sites/ottilie/AGENTS.md), [Ottilie context](/Users/danielhowells/Sites/ottilie/CONTEXT.md), [Monogrove native development guide](/Users/danielhowells/Sites/monogrove/docs/development/native-macos.md), `ottilie@3127c93`, `monogrove@038bc8f`.

### Clarify durable workflow adapters

[Agentic Development](../reference/agentic-development.md) currently lists in-process queue and remote Mastra server integration but not a durable execution adapter. MaterialGraph now uses `@mastra/inngest` with explicit suspension, resume, cancellation, progress, and persisted product state in [packages/mastra](/Users/danielhowells/Sites/materialgraph/packages/mastra).

Add “durable adapter” as a third integration shape when a run must outlive a request or process. Keep the framework-selection matrix in Agent Surface rather than duplicating it in Scaffold; Scaffold only needs the invariant: product-owned state and idempotency, typed suspend/resume contracts, bounded retries, cancellation, and visible progress.

## Documentation and agent workflow

The survey found these stable practices:

- all 36 active first-party repos have `AGENTS.md`;
- all 36 make root `CLAUDE.md` a symlink to `AGENTS.md`;
- `CONTEXT.md` is selective (19 repos), used when a project has durable product language or costly operational truths rather than as universal ceremony;
- specialist skills are installed globally rather than vendored into products.

The current Arc-removal edits align with that evidence. One further refinement comes from Ottilie. Commit `3127c93` deleted 221 stale narrative/evidence files and retained one `CONTEXT.md`, executable probes under `scripts/`, and active narrative work in Linear. Scaffold should distinguish:

- `AGENTS.md`: concise operational rules;
- `CONTEXT.md`: durable product model, invariants, and expensive lessons when needed;
- ADR/spec: a lasting decision or contract;
- issue tracker: active narrative and handoff state;
- scripts/artifacts: executable probes and generated evidence;
- temporary handoff: delete or fold into a durable home when the task closes.

This is a useful correction to the broad “plans go in docs” advice. Evidence should be retained because something will consume it, not because a workflow happened to produce it.

## Agent Surface integration

Agent Surface already matches current practice after its 2.2.0 currency pass (`d4f15be`) and July correctness pass: broad framework selection, structured skill routing, a public docs MCP surface, and canonical `AGENTS.md` files.

One pattern should be borrowed into Scaffold: [Agent Surface's docs integrity script](/Users/danielhowells/Sites/agentsurface/scripts/check-docs-integrity.mjs) validates model IDs, manifest/server-card version parity, internal references, and 120-day freshness stamps for fast-decay pages. Scaffold's exact model and platform claims currently have no equivalent freshness mechanism, which is how the Gateway/OpenRouter contradiction survived. Either:

1. remove exact model/provider lists from Scaffold and defer entirely to `@howells/ai`; or
2. add `lastVerified` metadata and a non-blocking freshness gate for `stack-in-practice`, `agentic-development`, and deployment-platform claims.

The first option is simpler and better aligned with Scaffold's role.

## Practices to retain

- lightest repo shape that fits; Fieldstation's deliberate teardown (`81f9f58`) is strong evidence that removal is part of architecture;
- apps do not import apps, reusable behaviour crosses an enforced package or HTTP boundary;
- Turbo caching disabled unless determinism is established (no surveyed root `turbo.json` explicitly enables cache; most relevant tasks explicitly disable it);
- Server Components compose; client leaves own interaction; React Query owns client server-state;
- `@howells/lint`, `@howells/typescript-config`, and `@howells/envy` remain the house configuration seam;
- Base UI is the new primitive default, with unified `radix-ui` as an intentional opt-out;
- `@howells/neon` and runtime-appropriate HTTP/pool selection remain the right database-client direction;
- agent/business logic belongs in product packages, not route handlers;
- Storybook is the visual contract when a repo exports reusable UI;
- Vercel is still the dominant web target, with Railway/Workers for service-heavy shapes;
- storage/generation remain separate boundaries; Motif's private Vercel Blob correction (`cc9237a`) is direct evidence.

One small cleanup remains: [Overview](../README.md) still names Radix as the UI default while the maintained baseline and Stack Decisions use Base UI. Make Overview say Base UI, with unified Radix as the deliberate opt-out.

## Activity inventory

Counts are commits reachable from each repository's current `HEAD` whose commit date falls in the review window.

| Repository | Commits | Repository | Commits |
|---|---:|---|---:|
| agentsurface | 5 | ai | 6 |
| arc | 12 | architizer | 235 |
| candor | 2 | colorscope | 116 |
| designround | 91 | envelope | 5 |
| everydayapparatus | 27 | faceplacer | 1 |
| fieldportrait | 1 | fieldstation | 6 |
| foolscap | 7 | foundling | 79 |
| gauge | 26 | instruments | 1 |
| kiln | 77 | lint | 5 |
| litmus | 35 | mastra | 5 |
| materia | 15 | materialdesk | 323 |
| materialgraph | 616 | materialsinuse | 40 |
| monogrove | 11 | motif | 60 |
| neon | 1 | ottilie | 72 |
| patternmode | 64 | quarry | 58 |
| routerbase | 15 | rulework | 763 |
| scaffold | 1 | skills | 4 |
| stow | 16 | wiredeck | 20 |
| firecrawl-docs | 1 | inngest-docs | 1 |
| kernel-docs | 1 | mastra-docs | 596 |
| mb-search-lab | 127 | openrouter-docs | 1 |

The five rows ending in `-docs`, plus `mb-search-lab`, are retained in the inventory because they are direct child Git repositories with activity, but they were not allowed to set house defaults: the docs repos are mirrors/reference sources and `mb-search-lab`'s window commits are authored by Michael Curti. `kernel-docs` is Daniel's local mirror bootstrap and is likewise not product-architecture evidence.

## Recommended order

1. Land the current Arc deprecation and generated-surface sync.
2. Correct tRPC/API, production migration, AI routing, and Base UI contradictions.
3. Add the major-version ledger and pnpm policy.
4. Extend launch/testing with deployed-SHA proof and “gate must bite.”
5. Add the native-client archetype and durable-workflow adapter note.
6. Borrow Agent Surface's freshness discipline or remove duplicated fast-decay claims.

These changes preserve the project while correcting defaults disproved by the review window.
