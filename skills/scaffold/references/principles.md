# Principles

These principles explain why the Scaffold Baseline makes the choices it does. The reference chapters and ADRs are where those choices are applied; this page is the reasoning underneath them.

## Decide once, reuse everywhere

Toolchain basics — package manager, linting, formatting, TypeScript config, task runner — are settled once at the baseline level and reused across repos. Re-litigating them in every project produces config drift, where each repo lands on a slightly different version of the same answer and none quite matches the next. The Scaffold Baseline exists so setup is fast and the defaults are shared. The goal is not lockstep; it is the absence of the same decision being made, differently, in ten repos.

## The Project Docs are the source of truth

The Project Docs in `docs/` are canonical. Every supported coding assistant receives the same guidance through a generated Skill Wrapper rather than a hand-written fork, so the Scaffold Baseline stays coherent as it changes and no distribution surface drifts from the docs it came from. [ADR-0001](/docs/adr/0001-agent-skill-packaging) records this decision: separate hand-maintained skills were rejected because they would rot the moment the baseline moved.

## Correctness over cleverness

Prefer the plain, correct implementation to the clever one. Cleverness that saves a few lines but obscures behavior is a poor trade in a codebase read by both people and agents, where the cost of misreading intent is paid again on every change. When a simpler shape is correct, it wins — the baseline optimizes for code that is obvious before it optimizes for code that is smart.

## The lightest shape that fits

Start from the smallest repo archetype that fits the work and add machinery only when the repo has earned it. A single-package content site does not need workspace orchestration, hook systems, and a test runner it will never exercise; importing that apparatus up front leaves dead configuration that rots and misleads readers about what it is for. Choose the shape deliberately from [Repo Archetypes](./repo-archetypes.md), and let the repo grow into heavier structure when a real second concern appears.

## Deviations are recorded, not smuggled

A repo may deviate from the baseline when the baseline genuinely does not fit, but the deviation is written down with its reason, not left as silent divergence a future reader has to reverse-engineer. A recorded deviation is a decision; an undocumented one is drift. [ADR-0002](/docs/adr/0002-scaffold-repo-deviations) is this repository's own record — scaffold is a docs site, so it drops machinery the baseline assumes and says exactly why.

## Shared primitives without flattening identity

Shared UI, tokens, and motion live in packages so projects do not each reinvent them, and so a fix in one place lands everywhere. Sharing primitives is not the same as flattening every project into one look: the baseline supplies the common foundation, and each project keeps its own character on top of it. Reuse the substrate; do not homogenize the surface.

## Agents are assets, not entropy generators

Coding assistants are meant to reduce work, not manufacture sludge. A repo carries a short `AGENTS.md` that states the constraints easy for an agent to violate and changes behavior without becoming documentation of its own, plus clear, predictable workflows agents can rely on. The [Agent Workflow](./agent-workflow.md) baseline keeps this surface small and direct — a large repo-local rule corpus bolted onto a repo still finding its shape is entropy, not leverage.

## One lifecycle owner, independent specialists

Arc owns the software delivery lifecycle — vision, ideation, implementation, testing, review, audit, launch, refactor, and commit — so structured work runs through one consistent set of workflows. Reusable specialist skills such as brand systems, UI direction, browser QA, package extraction, prose cleanup, and boundary enforcement stay independent, installed for the assistant doing the work rather than vendored into every product repo. One owner for the lifecycle; independent tools for the specialties, and no copies of either living inside each codebase.

## Hooks stop breakage, not run CI

Git hooks exist to catch obvious breakage before it lands, not to reproduce continuous integration on every local commit. The default hook lints, formats staged files, and typechecks; heavier verification belongs in CI where it does not tax every commit. The governing rule: if hooks become slow enough that developers bypass them, the hooks are wrong. A bypassed hook protects nothing.

## Review hunts regressions, not taste

Agent-driven review prioritizes the failures that ship bugs — regressions, behavior changes, missing validation, test gaps, and config drift — over taste-based nitpicks. Review attention is finite, and spending it on preference-level formatting quibbles buries the findings that actually matter. The stance is deliberate: hunt for what breaks, not for what merely differs from how a reviewer would have written it.

## Environment access is centralized

Environment access is centralized, not scattered as ad-hoc `process.env` reads across the codebase. Repos with runtime env use typed parsing through `@howells/envy`, keep server-only and client-safe variables separated, hold `.env.example` in sync, and check provider env before deploying. Centralizing env turns a class of runtime surprises into checkable, typed configuration a deploy can gate on.

## Docs describe the present

Documentation describes the current system, not the path taken to reach it. Migration stories, superseded decisions, and outdated caveats are archaeology; left in the docs, they mislead readers about how the system works now. Keep progress logs and plans lightweight and real, capturing decisions rather than every keystroke, and let the docs reflect the present state — the record of how things used to be belongs in git history, not in the guidance.
