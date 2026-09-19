# package.json: scripts and versions

A script is a verb a person or a hook runs. Every invariant the repo cares about is a type, a lint rule or a test, and those three are reached through exactly three verbs. Anything else in `scripts` is process theatre and gets deleted.

## The vocabulary

Root of a repo:

| script | meaning |
| --- | --- |
| `dev` | run the app(s) locally |
| `build` | produce the artefact |
| `test` | run every test, including the ones that used to be `check:*` |
| `typecheck` | `tsc --noEmit` across the workspace (turbo in a monorepo) |
| `lint` | `howells-check .` (oxlint plus oxfmt, report only) |
| `lint:fix` | `howells-fix .` |
| `prepush` | `pnpm typecheck && pnpm lint` and, only during a baseline burn-down, `pnpm lint:ratchet` |

Plus verbs that do something a human asks for by name: `db:push`, `db:migrate`, `db:studio`, `deploy:<target>`, `seed`, `eval`, `generate:<thing>`, `e2e`, `release`. Each of those must run a real action; none may merely assert.

Packages inside a monorepo carry only the subset they need of `dev`, `build`, `test`, `typecheck`, `lint`, `lint:fix`. Turbo (or `pnpm -r`) fans out from the root verbs.

## Banned

`check`, `check:*`, `check-types`, `verify*`, `validate*`, `audit:*`, `ci:*`, `smoke*`, `sanity`, `doctor`, `guard*`, `gate*`, `format`, `format:check`, `clean`, `precommit*`, `prepush:strict`, `knip` as a named script, and any script whose body is only another script with a flag. Migrate each one:

- It asserts a shape or a boundary in source: a lint rule. House rules go into `@howells/lint`'s policy plugin (`~/Sites/lint/oxlint/howells-policy-plugin.mjs`) so every repo gets them; repo-local ones become an oxlint config entry, not a script.
- It asserts something the compiler can see: a type. Delete the script.
- It asserts a fact about generated output, data, or a built artefact (freshness of a generated file, a tarball's contents, an API's shape, a taxonomy's invariants): a test in the suite. A freshness test regenerates into a temp dir and diffs.
- It runs a real tool over real data for a human to read (a corpus audit, a deployment inventory): keep it, name it by its verb (`audit:corpus` is fine when it produces a report a person reads), and never wire it into a gate.
- `check-types` is `typecheck`. `format` is `lint:fix`. `clean` is `git clean -fdX` or nothing.

`prepare` exists only to run `howells-husky`. `prepack`/`prepublishOnly` exist only in published packages and only to build.

## Versions

- A monorepo pins every external dependency once, in `pnpm-workspace.yaml` under `catalog:`, and every package refers to it as `"name": "catalog:"`. No package names a version of its own. Internal packages are `workspace:*`.
- A single-package repo has no catalog; it pins in its one `package.json`.
- `packageManager` is pinned at the root; `engines.node` states the supported major.
- After any lockfile change, `pnpm install`, and commit the lockfile with the change.

## Shape of a package.json

`name`, `version`, `private` or `publishConfig`, `type`, `packageManager` and `engines` (root only), `exports`/`bin`/`files` (published packages), `scripts`, `dependencies`, `devDependencies`, `peerDependencies`. Keys sorted inside each block. Nothing else unless a tool requires it, and then it is a config block that tool documents (`lint-staged`, `prettier` is never present).
