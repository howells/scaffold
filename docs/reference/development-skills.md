---
title: "Development skills"
description: "How to route development work through the installed engineering, specialist, and stack-specific skills."
---

# Development skills

This map was checked on 26 August 2026 against `~/.agents/skills`, `~/.codex/skills`, and `~/Sites/skills`. Skill availability changes; verify the installed name before relying on it in automation.

The coding assistant still owns the normal development loop. Use a skill when its method changes the work, not merely because it is installed.

## Selection rules

- Start with the assistant's native investigation, planning, implementation, testing, review, and verification.
- Choose one primary skill for the task. Add a supporting skill only for a distinct concern.
- Respect each skill's invocation policy. A skill marked explicit-only remains explicit-only.
- Do not vendor global skills into product repos or copy their full instructions into `AGENTS.md`.
- Use framework and provider skills only when the project has chosen that stack.
- Use `ask-matt` explicitly when the user wants help choosing among Matt Pocock's engineering flows.

## Engineering flow

| Need | Skills | Route |
| --- | --- | --- |
| Establish language and decisions | `domain-modeling`, `grilling`, `grill-with-docs` | Use when terminology, invariants, ADRs, or unresolved product decisions are the work. |
| Gather evidence | `research`, `prototype`, `to-questionnaire` | Research current primary sources, prototype to answer a named design question, or ask an external expert for missing facts. |
| Plan work larger than one session | `wayfinder` | Create decision tickets before implementation when the route is still unclear. |
| Configure the full tracker workflow | `setup-matt-pocock-skills` | Run only when the user wants its issue-tracker, triage-label, and domain-doc conventions. |
| Publish work to the tracker | `to-spec`, `to-tickets`, `triage` | Synthesize a settled conversation, split tracer-bullet tickets, or move incoming work through triage. |
| Design module seams | `codebase-design`, `improve-codebase-architecture` | Use deep-module vocabulary for interface and architecture work. |
| Implement | `implement`, `implement-spec`, `tdd` | Use the explicit implementation flows when requested; use `tdd` for a test-first seam. |
| Diagnose | `diagnosing-bugs` | Use for hard failures, regressions, or performance problems that need an evidence loop. |
| Review and integrate | `code-review`, `requesting-code-review`, `receiving-code-review`, `resolving-merge-conflicts` | Review against standards and spec, handle feedback rigorously, and preserve both intents in conflicts. |
| Close or transfer work | `retro`, `handoff`, `claude-handoff` | Record environment improvements or pass compact live context to another session. |
| Guide human-only setup | `wizard` | Build a temporary guided procedure when credentials, dashboards, or cutovers require human steps. |

## Howells specialists

- **Understand and recover:** `survey` for a codebase-wide health audit, `inquest` for intent or provenance, `muster` for concurrent work, `memento` for one task, and `salvage` for at-risk Git state.
- **Structure:** `aperture` for package extraction, `componentize` for repeated UI, `heathen` for overloaded modules, `fenceline` for enforced boundaries, and `fail-fast` for hidden fallback behaviour.
- **Implement and verify:** `foreman` for substantial delegated implementation when delegation is authorized, `fieldtest` for rendered browser QA, and `product-description` for an outside-in behavioural specification.
- **Code and docs quality:** `marginalia` for public API documentation, `writing-for-agents` for skills and agent instructions, `unslop` for behaviour-neutral code ceremony, and `deslop` for synthetic prose.
- **Design and naming:** `foundry` for brand systems, `chiaroscuro` for screen-level UI direction, and `nomen` for names and current availability checks.
- **Agent-facing systems:** `surface` for agent legibility, `agent-dx-cli-scale` for CLI review, `mastraudit` for Mastra audits, and `polyplugin` for cross-host plugin packaging.

These skills remain independent packages. Scaffold documents when to use them; it does not embed their procedures.

## Stack-specific skills

Use these only when their technology is present:

- `turborepo` for workspace tasks, package graphs, cache, filters, and environment configuration
- `vercel-react-best-practices` and `vercel-composition-patterns` for React and Next.js implementation or review
- `shadcn` and `storybook-story-writing` when those tools are installed
- `add-dark-mode`, `make-responsive`, `canonicalize-tailwind`, and `markup-from-image` for those specific UI transformations; use `chiaroscuro` for broader visual direction
- `ai-elements` for an adopted AI chat interface and `react-email` for React email templates
- `agent-browser`, `playwright`, or `playwright-interactive` for browser automation and UI debugging; `fieldtest` remains the evidence-backed product QA route
- `web-perf` for Core Web Vitals and runtime performance; `web-design-guidelines` for interface and accessibility review
- `workos` for WorkOS authentication and enterprise features
- `ai-agent-design`, `llm-app-development`, and `a2a-protocol` for agent products that need those architectures
- `mastra` for current Mastra implementation guidance and `mastraudit` for an existing implementation
- `firecrawl-build-search`, `firecrawl-build-scrape`, and `firecrawl-build-interact` when product code integrates Firecrawl
- `workflow-orchestration-patterns` for a project that has chosen Temporal; `workflow-patterns` only for Conductor's own tracked workflow format
- `wxt-browser-extensions` for WXT extension work
- the relevant Cloudflare skill, such as `workers-best-practices`, `durable-objects`, or `wrangler`, only for Cloudflare work
- `vercel-deploy` when the user explicitly asks for a Vercel deployment
- `use-railway` when the project is deployed on Railway

Provider-specific skills supplement the project's recorded architecture; they do not choose providers for it.

## Explicit opt-ins and conflicts

- `setup-pre-commit` installs a generic Husky, Prettier, typecheck, and test setup. Scaffold defaults to `@howells/husky`, `@howells/lint`, and Oxfmt, so adapt the intent rather than running it unchanged.
- `setup-ts-deep-modules` installs dependency-cruiser. Scaffold's default TypeScript boundary route is `@howells/boundaries` with `fenceline`; use dependency-cruiser only as a recorded exception.
- `git-guardrails-claude-code` blocks push, destructive reset, clean, and branch deletion. Because rotated Claude accounts share one settings file, install it only when the user wants those operations blocked for every Claude account; it conflicts with owner-controlled release and cleanup work.
- `migrate-to-shoehorn` applies only to test fixtures that need partial typed data. It is not a default dependency.
- Full tracker flows, delegated implementation, external mutations, and deployments still require the authority implied by the user's request. A skill does not grant it.
