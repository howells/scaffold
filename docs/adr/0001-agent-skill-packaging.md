---
title: "Agent skill packaging"
description: "Why Scaffold has one canonical documentation tree and thin platform wrappers."
---

# Agent skill packaging

Project Docs are canonical. One generated Agent Skill Distribution exposes them through thin platform wrappers.

## Considered options

- Maintain separate hand-written skills for each coding assistant.
- Maintain the Project Docs as the source of truth, with generated or adapted Skill Wrappers for each assistant.

Separate hand-written skills were rejected because they would drift as the Scaffold Baseline changes.

## Status

Accepted and partly shipped. `pnpm sync:skill` generates `skills/scaffold/references/` from `docs/`. No generated reference is maintained by hand.

- **Claude Code:** reads `skills/scaffold/SKILL.md` and `skills/scaffold/references/` directly.
- **Codex:** uses `skills/scaffold/agents/openai.yaml`.
- **Cursor:** has no wrapper. A future wrapper should consume the generated references without changing the sync contract.
