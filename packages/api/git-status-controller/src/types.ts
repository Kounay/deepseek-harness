/**
 * Browser-safe failure and result vocabulary of the git-status surface. Types
 * only: runtime behavior lives in `index.ts` and the parser.
 *
 * @module @deepseek-ai/dsh-api-git-status-controller/types
 */

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    /** The requested directory was missing or empty. */
    'gitStatus/bad-request': Record<string, never>
    /** `git` failed to resolve or read the work tree. */
    'gitStatus/read-failed': { readonly dir: string }
  }
}

/** GitHub identity parsed from an `origin` remote URL. */
export interface GithubRemote {
  /** Repository owner, e.g. `deepseek-ai`. */
  readonly owner: string
  /** Repository name, e.g. `deepseek-harness`. */
  readonly repo: string
}

/** Working-tree facts shown by the status bar. */
export interface GitStatusView {
  /** Whether the queried directory belongs to a git work tree. */
  readonly isRepo: boolean
  /** Resolved work-tree root path. */
  readonly root?: string
  /** Repository directory name (the work-tree root's basename). */
  readonly repoName?: string
  /** Current branch, or null on a detached HEAD. */
  readonly branch?: string | null
  /** Commits ahead of the tracked upstream, when one is configured. */
  readonly ahead?: number
  /** Commits behind the tracked upstream, when one is configured. */
  readonly behind?: number
  /** Tracked files with staged or unstaged changes, excluding deletions. */
  readonly modified: number
  /** Tracked files staged or unstaged as deletions. */
  readonly deleted: number
  /** Untracked files and directories. */
  readonly untracked: number
  /** GitHub identity of the `origin` remote, when the remote is GitHub. */
  readonly github?: GithubRemote | null
}
