# npm publishing

**GitHub Actions exists in these repos to publish to npm. It does nothing else.** No
push triggers, no pull request checks, no scheduled jobs, no deploys. Checks and
deploys run locally. A repo that does not publish an npm package has Actions
switched off entirely.

That rule is a cost control as much as a policy. In 2026 a single `$20` monthly
Actions budget on the `materialinstruments` organization, with stop-usage enabled,
was reached on 12 September by `verify`/`ci`/`automerge` jobs across 28 repos. It
took **every** repo in the organization offline at once, including publishing, and
presented as "the runners are dead". Check the organization budget before blaming a
runner.

## Why publishing cannot be local

npm is closing every path that lets a developer machine publish unattended:

- bypass-2FA is being removed for local publishing
- granular access tokens drop to a seven-day lifetime
- granular tokens lose the ability to publish at all in **January 2027**

What survives is **trusted publishing** over OIDC, which works only from a hosted CI
runner. GitHub Actions, GitLab CI and CircleCI cloud are supported; self-hosted
runners and local machines are not. So publishing moves to a runner, and nothing
else needs to.

## Two halves, and the second one is the gate

A working release needs both:

1. `.github/workflows/release.yml` in the repo
2. a **trusted publisher registered on npmjs.com, per package**

Half two is the part that gets forgotten, and it fails silently in a way that looks
like a workflow bug. `@howells/neon` carried a correct OIDC workflow from July to
September 2026 and never once published: both runs died on
`PUT https://registry.npmjs.org/@howells%2fneon - Not found`. The OIDC token was
minted and carried no rights, because the package had no trusted publisher. All five
published versions had gone out by hand.

### Registering a package

Package page on npmjs.com, **Settings**, **Trusted Publisher**, **GitHub Actions**:

| Field             | Value                                       |
| ----------------- | ------------------------------------------- |
| Label             | `GitHub Actions release`                    |
| Organization      | the GitHub org or user that owns the repo   |
| Repository        | the repo name                               |
| Workflow filename | `release.yml`                               |
| Environment name  | leave blank                                 |
| Allow npm publish | **checked**                                 |

Four things about that form:

- **The fields are frozen once saved.** npm will not let you edit them; changing one
  means deleting the connection and creating a new one. This is why the workflow is
  called `release.yml` in every repo - one value to type, and a rename later breaks
  publishing until every registration is redone.
- **"Allow npm publish" must be checked**, and npm labels it "not recommended".
  Unchecked, publishes go to a staging area a maintainer has to approve with 2FA
  before anything goes live, which reintroduces the person the workflow exists to
  remove. The recommendation assumes you want a human gate.
- **It cannot be scripted.** There is no registry API for it, and npm answers 403 to
  anything that is not a logged-in browser. Every save demands a fresh security-key
  touch, so budget one touch per package.
- **Set Publishing access to "Require two-factor authentication and disallow bypass
  2fa tokens"** while you are on the page. Once trusted publishing is live no token
  needs to reach the package, so the stricter setting costs nothing.

## The workflow

Single-package repo. Monorepos take the same shape with a per-package tag pattern
and a step that resolves the package from the tag.

```yaml
name: Release

# A version tag ships a release. The tag is the record of what went out, and the
# job refuses to run when the tag and the manifest disagree. Renaming this file
# breaks publishing: npm's registration names the workflow by filename.
on:
  push:
    tags: ["v[0-9]+.[0-9]+.[0-9]+"]
  workflow_dispatch:
    inputs:
      dry_run:
        description: Run every check and pack the tarball, but do not publish
        type: boolean
        default: false

permissions:
  contents: read
  id-token: write # what npm exchanges for publish rights

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v7
        with:
          node-version-file: .node-version
          cache: pnpm

      # Node 24.15 ships npm 11.12.1, past the 11.5.1 trusted publishing needs.
      # Assert rather than reinstall: a global npm install is a moving part that
      # buys nothing and can fail on its own.
      - name: Check npm can do trusted publishing
        run: |
          set -euo pipefail
          have=$(npm --version); need=11.5.1
          if [ "$(printf '%s\n%s\n' "$need" "$have" | sort -V | head -1)" != "$need" ]; then
            echo "::error::npm $have predates trusted publishing (need >= $need)"; exit 1
          fi

      - run: pnpm install --frozen-lockfile

      - name: Check the tag matches the version
        run: |
          set -euo pipefail
          version=$(node -p "require('./package.json').version")
          if [ "$GITHUB_EVENT_NAME" = "push" ] && [ "${GITHUB_REF_NAME#v}" != "$version" ]; then
            echo "::error::tag ${GITHUB_REF_NAME#v} does not match package.json $version"; exit 1
          fi
          echo "version=$version" >> "$GITHUB_OUTPUT"

      - run: pnpm check
      - run: pnpm build
      - run: pnpm pack --pack-destination "$GITHUB_WORKSPACE/release-artifacts"

      - name: Publish
        if: ${{ !inputs.dry_run }}
        run: npm publish "$GITHUB_WORKSPACE"/release-artifacts/*.tgz --provenance

      - uses: actions/upload-artifact@v7
        with:
          name: release-${{ steps.version.outputs.version }}
          path: release-artifacts/
          retention-days: 90
```

### Why `--provenance` is passed explicitly

npm documents trusted publishing as attaching a provenance attestation by itself,
without the flag. It does not. Measured as a controlled pair, same account and same
mechanism, one flag apart:

| Package | `--provenance` | Attestations endpoint |
| --- | --- | --- |
| `@instruments/colorscope@9.1.0` | absent | `{"error":"Not found"}` |
| `@howells/lint@3.2.5` | passed | 2 attestations |
| `@howells/lint@3.3.0` | passed | 2 attestations |

Both negative checks were made well after the release became installable, so this is
not ingestion lag. The two attestations are npm's own publish attestation and a SLSA
provenance statement.

Pass the flag. It costs nothing, and a missing attestation is only noticed by someone
who goes looking for one.

### Why it packs first

**Publish the packed tarball, never the workspace directory.** `npm publish` on a
directory ships `catalog:` and `workspace:` specifiers unexpanded and produces an
uninstallable tarball; `pnpm pack` resolves them. This shipped once in colorscope
and was fixed in `237ae755`. It is harmless in a single-package repo with no catalog
dependencies and fatal in a monorepo - `howells/patternmode` has eight `catalog:`
dependencies waiting for it. Pack in every repo so the pattern does not have to be
reasoned about per repo.

`pnpm publish` also resolves specifiers correctly and is a valid alternative.

### Why there is no `--access`

`publishConfig` decides. The flag silently overrides it, npm access is
**package-level rather than version-level**, and getting it wrong takes every
historical version dark to anonymous consumers at once. Give each package
`"publishConfig": { "access": "public" }` instead - without it a brand-new scoped
package publishes restricted on its first publish, because that is npm's default for
a scope.

### Verifying after the publish, patiently

**npm ingests a publish asynchronously and the check must poll.** The CLI says so:
"Your package is being processed and may take a few minutes to become available."
For a 6.9 MB tarball that window was over five minutes, during which the registry
answered 404 for a version it had already accepted. A single check turns a release
that actually shipped into a red run.

**The window is not proportional to tarball size.** `@howells/lint@3.3.0` is 130 kB,
around a fiftieth of that, and its resolver lag was also over five minutes: the
registry document served the new version roughly a minute after the publish step
logged `+ @howells/lint@3.3.0`, while `npm view` and `npm install` kept answering 404
for a further five. Budget the same wait for a small package.

Poll two things, because they lag independently: the registry document, and the
resolver. npm returned `ETARGET` for a version the packument already listed, and a
404 for one the packument served.

A successful publish is not evidence that anyone can install it. Resolve the
published version **anonymously** - fetch it with no `Authorization` header and
install it into a fresh consumer outside the workspace. A restricted package fails
that; it passes a check that only reads an access level.

Do not use `npm access get status` in the workflow. Trusted publishing leaves no
credentials on the runner, so there is nothing to authenticate that call with.

## Repos that do not publish

Turn Actions off at the repo level:

```sh
gh api -X PUT /repos/<owner>/<repo>/actions/permissions --input - <<'JSON'
{"enabled": false}
JSON
```

Check for a GitHub Pages site first (`gh api /repos/<owner>/<repo>/pages`) - Pages
builds run on Actions and disabling it stops them.

For repos that do publish, restrict what they can run:

```sh
gh api -X PUT /repos/<owner>/<repo>/actions/permissions --input - <<'JSON'
{"enabled": true, "allowed_actions": "selected"}
JSON
gh api -X PUT /repos/<owner>/<repo>/actions/permissions/selected-actions --input - <<'JSON'
{"github_owned_allowed": true, "verified_allowed": false, "patterns_allowed": ["pnpm/action-setup@*"]}
JSON
gh api -X PUT /repos/<owner>/<repo>/actions/permissions/workflow --input - <<'JSON'
{"default_workflow_permissions": "read", "can_approve_pull_request_reviews": false}
JSON
```

## Announcing a release

Not automated, and it goes first. Consumers holding data at scale need warning ahead
of the tarball rather than alongside it.

## Where this is deployed

Every repo below publishes over OIDC from `.github/workflows/release.yml`, and each
was proven by a dry run that ran the full gate and packed the tarball without
publishing. Actions is `allowed_actions: selected` on all of them, github-owned plus
`pnpm/action-setup` only, with a read-only workflow token. `mastra` and
`routerbase` also allow `oven-sh/setup-bun`, because a package in each tests
under Bun.

| Repo | Packages |
| --- | --- |
| `materialinstruments/colorscope` | `@instruments/colorscope`, `-client`, `-data` |
| `materialinstruments/taxonomy` | `@instruments/taxonomy`, `-client` |
| `materialinstruments/sustainability` | `@instruments/sustainability` |
| `materialinstruments/visual-grounding` | `@instruments/visual-grounding` |
| `howells/lint` | `@howells/lint` |
| `howells/ai` | `@howells/ai` |
| `howells/boundaries` | `@howells/boundaries` |
| `howells/envy` | `@howells/envy` |
| `howells/husky` | `@howells/husky` |
| `howells/typescript-config` | `@howells/typescript-config` |
| `howells/patternmode` | fifteen `@patternmode/*` and `@howells/motion` |
| `howells/cli` | `@howells/cli` |
| `howells/linearcli` | `@howells/linearcli` |
| `howells/starlingcli` | `@howells/starlingcli` |
| `howells/thingscli` | `@howells/thingscli` (macOS runner) |
| `howells/revolutcli` | `@howells/revolutcli` |
| `howells/wisecli` | `@howells/wisecli` |
| `howells/envelope` | `@howells/envelope` |
| `howells/stacksheet` | `@howells/stacksheet` |
| `howells/srcfull` | `@howells/srcfull` |
| `howells/boubakikid` | `boubakikid` |
| `howells/gauge` | `@howells/gauge` |
| `howells/neon` | `@howells/neon` |
| `howells/wiredeck` | `@howells/wiredeck` |
| `howells/mastra` | `@howells/mastra` |
| `howells/faceplacer` | `@howells/faceplacer` |
| `howells/routerbase` | `@howells/routerbase-mcp` |
| `howells/motif` | `@howells/motif-cli`, `-sdk` |
| `howells/stow` | `@howells/stow-cli`, `-client`, `-next`, `-react`, `-server` |
| `howells/wiretext` | `wiretext`, `@wiretext/mcp` |

### Registrations still outstanding

The workflow is only half of it. These packages have the workflow and no trusted
publisher, so their first publish through it will fail until someone sits down with a
security key:

`@instruments/taxonomy`, `@instruments/taxonomy-client`,
`@instruments/sustainability`, `@instruments/visual-grounding`, `@howells/ai`,
`@howells/boundaries`, `@howells/envy`, `@howells/husky`,
`@howells/typescript-config`.

`@howells/husky` moved from `commoninstruments/husky` to `howells/husky` and its npm
`repository` field still names the old one. Register it against **howells**.

The fifteen patternmode packages were registered against a `patternmode` /
`release.yml` pair while no such file existed. It exists now, so they may need
nothing; confirm one before assuming the rest.

## Traps this rollout actually hit

Each of these turned a green-looking release path into a broken one.

**A repo that cannot run its own checks on a fresh clone.** `typecheck` before
`build` means a package importing its sibling fails with "Cannot find module"; it only
ever passed because a developer machine already had `dist`. Hit `visual-grounding` and
`envy`. Type-aware lint has the same dependency: on a clean clone it resolves sibling
types from built output, so `lint` before `build` reports errors that are not in the
code. Run the repo's own composite gate rather than one leg of it, and give `lint` a
`^build` dependency in `turbo.json` where packages import each other through `dist`.

**A repo that cannot install on a clean machine.** pnpm 11 treats an ignored build
script as an error rather than a warning, so a package whose `esbuild` is not in
`allowBuilds` dies at `pnpm install --frozen-lockfile` before any check runs. It works
locally because the approval is already on disk.

**A dry run that passes by skipping everything.** A multi-package release script that
skips versions already on the registry will skip all of them when nothing has been
bumped, exit green, and never reach the pack step - which is where the `workspace:`
protocol guard lives. Make the rehearsal pack even a published version. For the same
reason, skip the republish guard on a dry run: guarding the current version means a
rehearsal can never run until someone bumps.

**The repo's lint config applies to the release tooling you add.** Three dry runs
failed on `scripts/check-published-package.mjs` before reaching anything real. The
formatters disagree between repos, so run each repo's own fixer rather than copying
one formatted file everywhere.

**A published package with no route.** Audit by manifest, not by memory:
`@instruments/colorscope-data` was published at 0.2.0 and absent from its own repo's
workflow, so it could only go out by hand. `gh api /search/code?q=repo:<owner>/<repo>+filename:package.json+%22publishConfig%22`
finds them.

**A gate wider than the thing being published.** A workspace-wide `pnpm lint` or
`pnpm build` lets an example, a sibling app or a docs site withhold a library it has
nothing to do with, and some of them cannot run on a runner at all - `faceplacer`'s web
app reads `DATABASE_URL` at build time. Scope it: `pnpm --filter "<name>..." run
--if-present <script>` checks the published package and its workspace dependencies and
nothing else.

**A dependency that only exists on the machine you developed on.** `oxlint-tsgolint`
reaches most repos as an *optional peer* of oxlint. It materialised on the Mac and not
on a Linux runner, and type-aware lint failed with "Failed to find tsgolint
executable". Declare it as a real devDependency rather than trusting the peer to be
hoisted.

**A CLI that builds its API client at module load.** `linearcli` constructed the Linear
client for every command but `help` and `schema`, so `create --dry-run` - which never
calls the API - failed without a key, and `issues --limit abc` reported a missing key
rather than the bad limit. `starlingcli` had the same shape: the account token was
resolved before `--fields` was checked, and `--fields` was only validated *after* the
live request. Validate the invocation first; build the client where it is used.

**Tests that assert against a live service.** A publish gate that calls a real bank, a
real Linear workspace or a local Things database asserts nothing on a runner and must
not run there. Gate those blocks on the credential or the file existing - and prove the
condition flips, because a skip that is always true is not a skip, it is a deletion.

**A test that needs git history.** `actions/checkout` clones at depth 1. `gauge`'s
golden test runs `git archive` against a baseline commit to prove the v2 contract is a
fixed point, and at depth 1 that commit is "not a tree object". `fetch-depth: 0`.

**A package that declares a platform.** `@howells/thingscli` sets `"os": ["darwin"]`,
so the fresh-consumer install dies with `EBADPLATFORM` on ubuntu before it can check
anything. npm's `--os` flag steers optional dependency selection rather than the root
install target, so it does not help: run the job on a runner matching the platform the
package targets.

**Removing a CI workflow can lock the branch.** A workflow that is a required status
check leaves the requirement behind when the file goes, and every pull request then
waits forever on a check that can never report. `stow` did this. Delete the requirement
in the same change - branch protection or ruleset, whichever carries it.

**A missing `repository` field fails the publish, and no dry run can tell you.**
npm validates `repository.url` against the OIDC repository before it attaches a
provenance attestation; absent reads as `""` and the publish 422s. A dry run never
reaches Publish, so the gate is green right up to the moment it matters. Check every
manifest that publishes: `@howells/srcfull`, `@howells/wiredeck` and
`@howells/routerbase-mcp` all lacked one.

**A tag filter's `*` does not match `/`.** A monorepo pattern of
`"*@[0-9]+.[0-9]+.[0-9]+"` can never fire for a scoped package - `@howells/stow-cli@3.2.1`
contains a slash. Worse, an unscoped `stow-cli@3.2.1` *does* match, starts a run, and
the resolver then throws on a name no workspace package has. `**` matches `/`. Five
workflows shipped with the broken pattern and nobody noticed, because no repo had ever
pushed a tag.

**`--if-present` makes an absent script look exactly like a passing one.** It is right
for the dependency closure, whose packages legitimately differ, and wrong as a silence
over the package being published. It was hiding that `@howells/routerbase-mcp` named
its type check `check-types`, and that four `@howells/stow-*` packages had no typecheck
at all while building with tsup, which does not typecheck. Name what the gate could not
run, in the log, every time - and expect adding a real typecheck to find real errors:
`@howells/stow-cli` had 31, in a package published at 3.0.5.

