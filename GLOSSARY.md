# Scaffold

Scaffold is a docs-first baseline and reusable agent guidance for starting or standardizing Howells projects.

## Language

**Scaffold Baseline**: The shared Howells starting point for project shape, tooling, package boundaries, agent workflow, deployment expectations, and launch readiness. _Avoid_: Starter template, boilerplate

**Project Docs**: The canonical documentation in `docs/` that defines the Scaffold Baseline for humans and agents. _Avoid_: Skill references, generated docs

**Agent Skill**: Reusable agent-facing guidance that helps a supported coding assistant apply the Scaffold Baseline to a new or existing project. _Avoid_: Codex skill, prompt

**Agent Skill Distribution**: The packaged form of the Project Docs for coding assistants such as Codex, Claude Code, and Cursor. _Avoid_: Canonical skill source, prompt

**Skill Wrapper**: A platform-specific packaging layer that exposes the Agent Skill Distribution to a supported coding assistant without changing the underlying Project Docs. _Avoid_: Separate skill, fork
