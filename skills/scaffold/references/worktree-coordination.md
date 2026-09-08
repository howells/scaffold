# Checkout coordination

Codex and Claude work directly in the existing project checkout, normally `~/Sites/<project>`. Do not create a Git worktree, isolated clone, or worktree-based subagent for a task unless Daniel explicitly requests that isolation. Branches and pull requests remain available in the existing checkout.

This page is canonical; `~/Sites/WORKTREES.md` remains a compatibility symlink so existing instruction links keep working. It replaces the previous mandatory-worktree policy.

## One writer per project

Before editing, identify the checkout's current branch, local changes, and any session already editing the project. One lead session owns edits and Git operations for a project at a time, across Codex, Claude, humans, and other harnesses. An idle window is not proof that its work is abandoned.

Parallel work across different projects is fine. Within one project, use read-only assistance or explicitly assigned non-overlapping file edits under the lead session; helpers must not switch branches, stage, commit, reset, stash, or clean up independently. Do not start a second independent editing session against the same checkout. Coordinate a handoff or wait for the current owner.

Never switch branches, stash, discard, reset, or move someone else's changes to make room for a new task. A branch belongs to the checkout, not to a terminal tab. Inspect and preserve existing changes before pulling or switching; never automatically reset to main at startup. Follow the repository's PR and release rules.

## Starting Claude and Codex

- Codex: choose Local for new tasks and use the saved project checkout. Do not select Worktree, request a worktree fork/handoff, or configure a scheduled job with worktree execution unless explicitly requested. When using task-creation tools, select the local environment explicitly.
- Claude Code: run ordinary `claude` from the project directory. Do not use `claude-worktree`, `--worktree`/`-w`, EnterWorktree, or agent `isolation: worktree` by default. The old automatic creation hook is retired.
- Claude Desktop: keep the new-session worktree option off. If a Desktop flow requires isolation, use terminal Claude in the project checkout instead; do not manufacture a second checkout as a workaround.
- Existing sessions already in worktrees may finish there. Do not move their files, change their working directory, or terminate them as part of changing defaults.

OpenCode's installed launcher/configuration is outside this Claude/Codex settings change. It must still respect the single-writer and preservation rules; do not use it to bypass ownership of a project.

## Handoffs and preservation

Record checkout path, branch and commit, owner, dirty/untracked state, checks already run, and the exact remaining action. A stash is emergency transport rather than durable task state. Never apply or drop an unfamiliar stash until its repository, base, files, and owner are understood.

Before retiring unique work, preserve original refs in a verified bundle and save binary diffs, untracked files, and needed ignored artifacts outside the checkout. Recheck source state immediately before replacement or deletion so new edits are preserved.

## Existing worktrees and explicit exceptions

Worktrees under `~/Sites/.worktrees/` and older locations are existing work, not automatic cleanup targets. Git's registry (`git worktree list --porcelain`) is authoritative. Do not delete or relocate an active checkout to enforce this new default.

When a worktree is explicitly requested, use an unused harness-specific path under `~/Sites/.worktrees/<harness>/<project>/<task>` and a unique branch from the agreed base. Never share its Git operations between independent sessions.

Automatic cleanup stays off. Remove an old worktree only after its owner is finished, its work is integrated or intentionally retired with a recovery archive, there are no unresolved dirty/untracked/stashed artifacts, and no live session or process needs its path. Use Git's worktree removal for registered linked trees. Never delete the primary checkout. Delete retired branches only after checking integration evidence and current remote tips; squash merges need more than ancestry checks. Prune metadata only after safe removal.
