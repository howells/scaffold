---
title: "Principles"
description: "Howells development principles: strict types, enforced boundaries, and one source of truth."
---

# Principles

These rules come from active projects. They describe current practice, including the rules I still break.

Constraints help people and agents make consistent choices. Prefer types, closed options, and boundaries that tools can enforce.

## Correctness & failure

### Make the wrong thing impossible to compile

Use discriminated unions for exclusive options, group fields that must occur together, and narrow `unknown` at system boundaries. Parse request bodies, environment variables, and third-party responses before use.

Strict types also constrain coding agents. If only the correct call compiles, the compiler catches plausible but invalid code before review. Type-aware linting extends that protection beyond the type system.

### Fail loud, never fall back silently

Throw with the cause. Do not turn billing, authentication, configuration, or data failures into plausible output. Empty catches and silent defaults hide the trace needed to fix the problem. Fail where the error occurs. Use [`/fail-fast`](https://github.com/howells/skills/tree/main/fail-fast) to find masked failures.

## Shape & structure

### Design from the data model up

Start with domain entities, relationships, and constraints. Screens, states, and queries should follow the model. For Drizzle projects, treat the schema as the blueprint and design it before the UI hardens around accidental data shapes.

### The lightest shape that fits

Start with the smallest structure that fits. A single-purpose tool may not need a monorepo, task runner, workspace boundaries, or a test harness. Add each when the work requires it, and remove machinery that no longer pays for itself.

I tend to scaffold the full system too early. This rule exists to check that instinct.

### Don't over-optimise

Try the simplest tool already present. Measure a query before adding a cache; test Postgres before adding a vector database; feel repeated pain before extracting an abstraction. Optimising early spends complexity before the requirement is known.

### Boundaries are mechanical, not conventional

Enforce dependency direction with lint or build rules. Apps do not import apps; packages do not import apps; shared infrastructure is reached through a workspace package or versioned API. Keep domain logic in the domain layer, app clients thin, and orchestration focused on coordination.

### One source of truth; derive the rest

Give each enum, schema, config value, capability list, and version one canonical home. Generate copies with a script or build step.

Shared data belongs in a versioned service for separate deployables or an owned package within one workspace. Consumers cross that boundary instead of copying the data or reaching into another component's internals.

### Many small files, budgeted

Keep files focused, usually with one main export. Separate meaningful subcomponents when doing so improves independent reading, testing, or movement.

Enforce size and complexity budgets with lint rules: warn in the low hundreds of lines and set a hard cap around 600-800. Split a module that exceeds the budget; do not raise the limit by default.

### Promote repetition into one canonical component, then delete the copies

When a pattern appears three times, move it to the shared package and delete the copies. Keep product-specific UI in the app. A useful shared component provides one place to fix behaviour or appearance without collecting product exceptions.

### Offer a closed set of options and force the choice

Offer named typography roles, semantic colour tokens, and approved components. Enforce the set where possible. Closed options reduce inconsistent one-offs and give people and agents the same choices.

## Language & naming

### Fix the ubiquitous language first

Keep a short glossary of preferred domain terms and rejected synonyms. Use those terms in code, UI, APIs, and agent instructions. A rename updates the glossary, schema, and tests in one change.

Use [`/domain-model` and `/grill-with-docs`](https://www.aihero.dev/skills) to test the language before implementation.

### Name after meaning, not implementation

Name the concept, not its implementation: `Deck`, not `CardStack`; `Source Record`, not `articles`. If a name is awkward in a sentence about the system, reconsider it.

Names can change. Treat a rename as tested migration work across data, API, and UI.

## Toolchain & operation

### Decide the toolchain once, reuse everywhere

Settle the package manager, linter, formatter, TypeScript config, and task runner in shared pinned packages. Exact-pin fast-moving frameworks and apply a short release cooldown. Record exceptions with a removal path.

A shared toolchain reduces relearning and makes fleet-wide changes cheap. The current packages are [`@howells/lint`](https://github.com/howells/lint) and [`@howells/typescript-config`](https://github.com/howells/typescript-config).

### A small, consistent command surface at the root

Expose `dev`, `build`, `lint`, `typecheck`, `test`, and `check` at the root. Put one-off operations in script files instead of crowding `package.json`. Keep Git hooks quick enough that nobody needs to bypass them.

### One typed env boundary

Parse environment variables through one typed schema at a deliberate runtime boundary. Separate server secrets from client-safe values and keep deployment mode out of `.env`. Never write secrets to Git or logs.

Use [`@howells/envy`](https://github.com/howells/envy) to catch missing or malformed values before deployment.

### Always work against the current docs

Check current primary documentation before using a library, model, or API. Keep a local clone when the source matters often. Treat aggregators and model memory as leads, then verify the exact surface you call.

### When you do it three times, build the tool

On the third manual repetition, make the work repeatable with a script, package, skill, or component. Publish it when others can reuse it. Examples include [`@howells/*`](https://github.com/howells), [`howells/skills`](https://github.com/howells/skills), and [patternmode](https://patternmode.com).

## Building forward

### Steal good ideas

Read strong open-source implementations before designing a new structure. Copy a proven mechanism only after understanding the constraint it solves. Adaptation beats invention when the constraints match.

### Build for people and agents

Design CLIs and APIs that people and agents can inspect and rehearse. Provide schema introspection, dry-run modes, JSON output, structured errors, recovery hints, and meaningful exit codes.

Each repo keeps one short `AGENTS.md` with commands, constraints, and non-goals. Other assistant configs point to it. More guidance lives at [agentsurface.dev](https://agentsurface.dev).
