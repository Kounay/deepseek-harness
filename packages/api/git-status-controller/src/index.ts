/**
 * GitStatusController: read-only git work-tree facts for the session's
 * workspace, exposed to the web GUI over Typert Remote (`ctx.remote.gitStatus`).
 */
import { execFile } from 'node:child_process'
import type { Context } from '@deepseek-ai/cordis'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { parseGithubRemote, parseStatus } from './parser.ts'
import type { GitStatusView } from './types.ts'

export type { GitStatusView } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Host owner of the `gitStatus` Remote namespace. */
    gitStatusController: GitStatusController
  }
}

/** Raw outcome of one `git` invocation. */
export interface GitRunResult {
  /** Process exit code; `git` fails a non-repository with 128. */
  readonly code: number
  /** Captured stdout. */
  readonly stdout: string
  /** Captured stderr. */
  readonly stderr: string
}

/** How one `git` command runs; host specs substitute a fake runner. */
export type GitRunner = (cwd: string, args: readonly string[], signal: AbortSignal) => Promise<GitRunResult>

/** Timeout a single git probe waits before the controller gives up. */
const GIT_TIMEOUT_MS = 10_000

/**
 * Run `git` in one directory through `execFile`; never a shell, so arguments
 * cannot be interpreted. A probe gives up after {@link GIT_TIMEOUT_MS} or when
 * the caller aborts.
 */
async function runGitProcess(cwd: string, args: readonly string[], signal: AbortSignal): Promise<GitRunResult> {
  return await new Promise((resolve) => {
    const controller = new AbortController()
    const timer = setTimeout(() => { controller.abort() }, GIT_TIMEOUT_MS)
    const onAbort = (): void => { controller.abort() }
    if (signal.aborted) {
      controller.abort()
    } else {
      signal.addEventListener('abort', onAbort, { once: true })
    }
    execFile('git', [...args], { cwd, signal: controller.signal }, (error, stdout, stderr) => {
      clearTimeout(timer)
      signal.removeEventListener('abort', onAbort)
      const code = error === null ? 0 : typeof error.code === 'number' ? error.code : 1
      resolve({ code, stdout, stderr })
    })
  })
}

/**
 * Resolve the work-tree root of one directory, if any, and read its porcelain
 * status. A directory outside any repository answers `isRepo: false` instead
 * of failing; an unreadable directory or a missing `git` binary raises a
 * classified RemoteError.
 */
export class GitStatusController extends TypertRemoteService {
  private readonly runGit: GitRunner

  /**
   * Register the `gitStatus` Remote namespace.
   * @param ctx - Host context where the controller mounts.
   * @param _config - no configuration today (kept for loader symmetry).
   * @param internals - test seam supplying a scripted git runner.
   */
  constructor(
    ctx: Context,
    _config: Record<string, never> = {},
    internals: { runGit?: GitRunner } = {},
  ) {
    super(ctx, 'gitStatusController', { namespace: 'gitStatus' })
    this.runGit = internals.runGit ?? runGitProcess
  }

  /**
   * Report work-tree facts for the directory a session runs in. The controller
   * resolves the repository root itself, so the caller may pass the workspace
   * directory even when it sits below the root.
   * @param dir - absolute directory to probe.
   * @param signal - caller lifetime; abort cancels the git probes.
   * @returns the parsed status, or `isRepo: false` when the directory is not
   * inside a git work tree.
   * @throws RemoteError when the directory is invalid or git cannot run.
   */
  @Remote
  async read(dir: string, signal: AbortSignal): Promise<GitStatusView> {
    if (typeof dir !== 'string' || dir === '') {
      throw new RemoteError('gitStatus/bad-request', 'a directory is required', {}, {})
    }
    const rootRun = await this.runGit(dir, ['rev-parse', '--show-toplevel'], signal)
    if (rootRun.code !== 0) {
      if (isNotARepository(rootRun.stderr)) {
        return { isRepo: false, modified: 0, deleted: 0, untracked: 0 }
      }
      throw new RemoteError('gitStatus/read-failed', messageOf(rootRun.stderr), { dir }, {})
    }
    const root = rootRun.stdout.trim()
    const statusRun = await this.runGit(root, ['status', '--porcelain=v1', '-b', '--branch'], signal)
    if (statusRun.code !== 0) {
      throw new RemoteError('gitStatus/read-failed', messageOf(statusRun.stderr), { dir }, {})
    }
    const view = parseStatus(root, statusRun.stdout)
    // The web link rides the origin remote; a missing or non-GitHub remote is
    // ordinary (the client hides the link), never a failure.
    const originRun = await this.runGit(root, ['remote', 'get-url', 'origin'], signal)
    if (originRun.code === 0) {
      const github = parseGithubRemote(originRun.stdout)
      if (github !== null) return { ...view, github }
    }
    return view
  }
}

/** `git rev-parse` classifies every outside-repository directory with 128. */
function isNotARepository(stderr: string): boolean {
  return /not a git repository/i.test(stderr)
}

/** First non-empty stderr line, or a generic message when git said nothing. */
function messageOf(stderr: string): string {
  const first = stderr.split(/\r?\n/).find(line => line.trim() !== '')
  return first === undefined ? 'git reported no message' : first
}

export default GitStatusController
