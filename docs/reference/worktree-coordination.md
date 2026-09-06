---
title: "Worktree coordination"
description: "The machine-wide worktree policy shared by Codex, Claude Code, OpenCode, their account profiles, and manual Git work."
---

# Worktree coordination

All managed worktrees live under one machine-wide umbrella:

```text
~/Sites/.worktrees/
  codex/<project>/<task>/
  claude/<project>/<task>/
  opencode/<project>/<task>/
  manual/<project>/<task>/
  .control/
```

This page is canonical. `~/Sites/WORKTREES.md` symlinks here so people and all three harnesses read the same policy.

The umbrella coordinates paths; it does not share working directories. Codex, Claude Code, and OpenCode never write to the same worktree. Each task owns one branch, worktree, and harness namespace.

## Why the namespaces matter

Git already records every worktree in the repository's common Git directory, regardless of where it lives. Putting paths under one umbrella makes that state inspectable across harnesses without making either harness responsible for the other's lifecycle.

The namespace answers who created the tree:

- `codex/` is owned by Codex Desktop or Codex CLI work.
- `claude/` is owned by Claude Desktop or Claude Code work.
- `opencode/` is owned by OpenCode.
- `manual/` is for deliberate human-created worktrees.
- `.control/` contains shared hooks or scripts, never project work.

Existing worktrees outside the umbrella are grandfathered. Don't move or remove them solely to make the directory tree look tidy; finish or recover their work first.

## Machine configuration

### Codex

Set the root-level Codex Desktop worktree settings to:

```toml
[desktop]
git-worktree-root = "~/Sites/.worktrees/codex"
worktree-auto-cleanup-enabled = false
worktree-keep-count = 15
worktree-upstream-refresh-mode = "best-effort"
```

Use the absolute expanded path if the settings UI or installed Codex version does not expand `~`. The Desktop **Worktree root** field is the root setting: it applies to managed Codex worktrees for every saved project on that macOS profile.

Rotated Codex accounts on one macOS user share `~/.codex/config.toml`. If a launcher uses another Codex home, symlink its config to that file.

### Claude Code

Set `worktree.baseRef` to `fresh` and use a global `WorktreeCreate` hook that creates the target under `~/Sites/.worktrees/claude/<project>/<task>`. The hook should:

1. resolve the repository's common Git directory rather than assuming the current directory is the primary checkout;
2. fetch and prune `origin` without prompting;
3. resolve the current remote default branch and start from its fetched commit; stop on refresh failure; use committed `HEAD` only for a repository with no remotes;
4. fail if the target path or branch already exists;
5. copy only explicitly ignored files selected by `.worktreeinclude`.

Keep the hook in `~/Sites/.worktrees/.control/`. Every rotated Claude account home should symlink its `settings.json` to the canonical `~/.claude/settings.json`, so new accounts cannot silently lose the hook.

### CLI launchers and OpenCode

Use `claude-worktree <task>` or `opencode-worktree <task>` from the project to create and launch a new task. Both use the same creator in `.control/create-task-worktree.py`, the freshly fetched remote default branch, and a `<harness>/<task>` branch. Both preserve dirty source files, refuse collisions, and retain the task checkout on exit. Resume Claude from inside the existing tree; resume OpenCode with `opencode <existing-worktree-path>`.

OpenCode loads `.control/opencode-worktrees.md` through the global config's `instructions` array. It must reuse the task's existing tree or create one before implementation, and target that absolute path in every tool. A shell `cd` cannot move another tool's workspace.

Claude's native `--worktree` creation hook uses the same creator, but native mode still owns its exit cleanup. Use `claude-worktree` for the shared retain-until-cleanup behaviour. OpenCode has no native worktree-root setting; the launcher and global instructions provide that routing.

Codex Desktop uses its native Worktree mode and may start detached with generated directory names. Its configured namespace and disabled automatic cleanup still apply. Before implementation, verify the fetched default-branch base and attach a unique `codex/<task>` branch; do not silently treat a failed refresh as current. Respect an explicitly requested starting branch or commit. Do not create a second tree inside one already owned by the task.

These settings govern Git isolation. Task selection, specifications, validation and PR delivery belong to the selected skill, including `next`.

### Claude Desktop

Set the Worktrees custom root to `~/Sites/.worktrees/claude`. Disable age-based archive cleanup and automatic archive-on-PR-close. Claude Desktop and Claude Code share the namespace but still create distinct task directories and branches.

## Starting work

Before creating a tree:

1. run `git worktree list --porcelain` from any checkout of the repository;
2. inspect `git status --short` in the intended source checkout;
3. fetch and prune the remote;
4. choose a unique task name and harness-prefixed branch, such as `codex/current-baseline`, `claude/auth-cleanup`, or `opencode/search-fix`;
5. create the tree from the freshest trustworthy base.

One task owns one branch and one worktree. A subagent may work inside its assigned tree, but branch, worktree, stash, and cleanup operations stay with the coordinating session.

## Handoffs and stashes

A stash is emergency transport, not durable task state. Prefer a focused commit and push when work must survive a session or move between harnesses.

A handoff records:

- worktree path;
- branch and current commit;
- owner or harness;
- clean or dirty state;
- validation already run;
- exact remaining work.

Never apply or drop a stash you did not create until its repository, base commit, files, and owner are understood.

## Cleanup

Automatic deletion stays off. A worktree can be removed only when all of these are true:

1. its owner is known and finished;
2. `git status --short` is clean;
3. its branch is merged, intentionally abandoned, or safely pushed;
4. no stash or untracked artifact depends on it;
5. no live process or agent session is using its path.

Then remove it through Git, delete the local branch only when safe, and run `git worktree prune`. Never use age, directory count, or a merged pull request as the only deletion signal.

## Audit commands

```bash
git worktree list --porcelain
git branch --format='%(refname:short) %(worktreepath) %(upstream:short) %(upstream:track)'
git stash list --date=local
```

Run these per repository when tidying. The Git registry is authoritative; the umbrella directory is the human-readable map.
