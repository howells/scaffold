# Scaffold

Opinionated documentation scaffold for starting a new Howells project.

This repo is docs-first and now ships a small Next.js surface for browsing the canonical Project Docs. The Markdown in `docs/` remains the source of truth; the app reads from it rather than replacing it.

Start with [docs/README.md](docs/README.md). The philosophy behind the baseline lives in [docs/principles.md](docs/principles.md).

## Commands

```sh
pnpm install
pnpm dev
pnpm check
```

## Agent Skill

This repo also contains an installable agent skill at `skills/scaffold`. Use it when a supported coding assistant should apply these docs to a new or existing project.
