---
title: "Agent Skill Packaging"
description: "Scaffold's Project Docs should remain the source of truth, with one agent skill distribution surface exposed to Codex, Claude Code, and Cursor through platform-specific Skill Wrappers. This keeps the Scaffold Baseline coherent across supported coding assistants while still allowing each platform to use its own metadata, command, rules, or install conventions."
---

# Agent Skill Packaging

Scaffold's Project Docs should remain the source of truth, with one agent skill distribution surface exposed to Codex, Claude Code, and Cursor through platform-specific Skill Wrappers. This keeps the Scaffold Baseline coherent across supported coding assistants while still allowing each platform to use its own metadata, command, rules, or install conventions.

## Considered Options

- Maintain separate hand-written skills for each coding assistant.
- Maintain the Project Docs as the source of truth, with generated or adapted Skill Wrappers for each assistant.

Separate hand-written skills were rejected because they would drift as the Scaffold Baseline changes.

## Status

Accepted, and shipped in part. The single-source-of-truth decision holds: `scripts/sync-skill.ts` (run via `pnpm sync:skill`) is the sync mechanism, generating `skills/scaffold/references/` from `docs/` so no distribution surface is hand-maintained. Not every assistant surface envisioned above ships yet, so this records what actually exists.

- **Claude Code is served natively.** The skill directory itself is the Claude Code skill format: `skills/scaffold/SKILL.md` plus `skills/scaffold/references/` _is_ a valid Claude Code skill. Claude Code needs no separate wrapper — the absence of one is not a gap.
- **Codex is served through `skills/scaffold/agents/openai.yaml`.** This is the one platform-specific wrapper that ships today.
- **Cursor has no wrapper yet.** Cursor wrapper generation is deferred as future platform work. It is deliberately _not_ bolted onto `scripts/sync-skill.ts`, which stays focused on producing the shared `references/` tree from `docs/`; a Cursor surface can be layered on later without reshaping the sync contract.
