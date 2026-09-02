/**
 * Pure parsing of `git status --porcelain=v1 -b --branch` output into a
 * presentation view for the web GUI. Kept free of I/O so host specs cover the
 * vocabulary without running git.
 */
import type { GithubRemote, GitStatusView } from './types.ts'

/**
 * Parse a GitHub `origin` remote URL (https or ssh forms) into its owner and
 * repository. Anything else answers null so callers can hide the web link.
 * @param url - raw `git remote get-url origin` output, e.g.
 *   `git@github.com:deepseek-ai/deepseek-harness.git`.
 */
export function parseGithubRemote(url: string): GithubRemote | null {
  const match = /github\.com[:/]([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/.exec(url.trim())
  if (match === null) return null
  const owner = match[1]
  const repo = match[2]
  return owner === undefined || repo === undefined ? null : { owner, repo }
}

/** Parsed header of the branch line (`## ...`). */
interface BranchHeader {
  readonly branch: string | null
  readonly ahead: number | null
  readonly behind: number | null
}

/**
 * Parse one porcelain branch header, e.g. `## main...origin/main [ahead 2, behind 1]`
 * or `## HEAD (no branch)`.
 * @param line - the `## `-prefixed header line, with or without the prefix.
 */
export function parseBranchHeader(line: string): BranchHeader {
  const header = line.startsWith('## ') ? line.slice(3) : line
  let ahead: number | null = null
  let behind: number | null = null
  const offsetMatch = /\[(?:ahead (\d+))?(?:, )?(?:behind (\d+))?\]/.exec(header)
  if (offsetMatch !== null) {
    ahead = offsetMatch[1] === undefined ? null : Number(offsetMatch[1])
    behind = offsetMatch[2] === undefined ? null : Number(offsetMatch[2])
  }
  if (header === 'HEAD (no branch)') return { branch: null, ahead, behind }
  const upstream = header.split('...')[0]
  const branch = upstream === undefined ? null : upstream.split(' ')[0] ?? null
  return { branch, ahead, behind }
}

/**
 * Build the presentation view from raw `git status --porcelain=v1 -b` output.
 * @param root - resolved work-tree root, used for the repository name.
 * @param stdout - porcelain output; its first line is the branch header.
 */
export function parseStatus(root: string, stdout: string): GitStatusView {
  const lines = stdout.split(/\r?\n/).filter(line => line !== '')
  const first = lines[0]
  if (first === undefined) {
    return {
      isRepo: true, root, repoName: basenameOf(root), branch: null, ahead: 0, behind: 0,
      modified: 0, deleted: 0, untracked: 0,
    }
  }
  const header = parseBranchHeader(first)
  let modified = 0
  let deleted = 0
  let untracked = 0
  for (const entry of lines.slice(1)) {
    if (entry.startsWith('??')) {
      untracked += 1
    } else if (entry[0] === 'D' || entry[1] === 'D') {
      deleted += 1
    } else {
      modified += 1
    }
  }
  return {
    isRepo: true,
    root,
    repoName: basenameOf(root),
    branch: header.branch,
    ahead: header.ahead ?? 0,
    behind: header.behind ?? 0,
    modified,
    deleted,
    untracked,
  }
}

/** Last path segment, normalizing trailing separators and Windows roots. */
function basenameOf(path: string): string {
  const normalized = path.replace(/[\\/]+$/, '')
  const tail = normalized.split(/[\\/]/).pop()
  return tail === undefined || tail === '' ? normalized : tail
}
