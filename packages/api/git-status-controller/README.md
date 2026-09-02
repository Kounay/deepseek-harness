---
description: "Read-only git work-tree facts for the session workspace, served to the web GUI over the Typert Remote namespace gitStatus."
kind: "package-reference"
---

# @deepseek-ai/dsh-api-git-status-controller

## Summary

`dsh-api-git-status-controller` exposes one read-only Remote namespace, `gitStatus`, whose `read(dir, signal)` resolves the directory's git work-tree root (`git rev-parse --show-toplevel`) and returns the parsed porcelain status: repository name, current branch (or a detached HEAD marker), commits ahead/behind the tracked upstream, and the counts of modified and untracked files. A directory outside any repository answers `isRepo: false` instead of failing. The git binary runs through `execFile` (never a shell) with a 10-second probe timeout.

## Understand the implementation

`GitStatusController extends TypertRemoteService` and registers the `gitStatusController` service with namespace `gitStatus`. Parsing lives in the pure `parser.ts` so host specs exercise the vocabulary without running git; the controller's git runner is injectable for specs and defaults to `execFile('git', …)`.

## Model Experience

None: the controller is a browser-surface host service and registers nothing model-facing.

## Known Limitations and Deferred Work

- **Probes the tracked working tree only** — submodules and ignored files are not classified beyond `git status --porcelain=v1` semantics (renames count once, submodule dirt appears as one modified entry).
- **Runs `git` via `execFile`** rather than the `ctx.subprocess` seam; a future change may move the runner onto that seam for executable resolution and environment scrubbing.
