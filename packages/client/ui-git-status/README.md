---
description: "Git status bar above the composer: repository, branch, upstream offsets, and work-tree counts for the session workspace."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-git-status

## Summary

`dsh-client-ui-git-status` occupies the `conversation.composer.status` seat with a slim work-tree strip directly above the composer. It follows the sessions list and asks the `gitStatus` Remote namespace for the current session's directory whenever the selection or its cwd changes, and on reconnect. The strip shows the repository and branch as copy links, upstream ahead/behind offsets, and the modified/untracked counts (or a Clean label), and stays invisible outside a git work tree.

## Understand the implementation

The plugin registers a locale namespace (`git`, zh/en) and a root `GitStatusBarController` whose snapshot store rides the entry's `hooks` compartment (`useGitStatus`). The seat's registration follows the external-occupant pattern: `ctx.slots.inject('conversation.composer.status', …)` waits for the declaration before registering.

## Model Experience

None: the strip is read-only presentation over a host Remote; nothing model-facing.

## Known Limitations and Deferred Work

- **Single repo of the session cwd** — the bar reports the git work tree of the session directory, not a multi-repo overview; clicking the repository link copies its root path.
- **Refresh on demand and on session/cwd changes** — the bar does not poll the filesystem; edits outside git operations (draft save, tool writes) are reflected on the next refresh or session switch.
