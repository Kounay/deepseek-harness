/**
 * GitStatusBarController: follows the conversation's current session and keeps
 * one work-tree snapshot in a renderer-bound store. All reads go through the
 * `gitStatus` Remote namespace; no git runs in the browser.
 */
import type { GitStatusView } from '@deepseek-ai/dsh-api-git-status-controller'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-store'

/** Render phases of the bar. */
export type GitBarPhase = 'hidden' | 'loading' | 'ready' | 'error'

/** Snapshot the status bar renders. */
export interface GitStatusBarState {
  /** Why the bar currently shows what it shows. */
  readonly phase: GitBarPhase
  /** Latest parsed work-tree facts; set in the ready phase. */
  readonly status: GitStatusView | null
  /** User-facing failure line; set in the error phase. */
  readonly error: string | null
}

const HIDDEN: GitStatusBarState = { phase: 'hidden', status: null, error: null }

/** Snapshot-store shape the renderer binds as the gitStatus hook. */
export type GitStatusBarStore = SnapshotStore<GitStatusBarState>

/**
 * Keep one status per current session cwd, refreshing when the selection or
 * its directory changes and on reconnect.
 */
export class GitStatusBarController {
  /** Bar snapshot the renderer subscribes to. */
  readonly store: GitStatusBarStore = createSnapshotStore<GitStatusBarState>(HIDDEN)

  /** Directory the current status describes; avoids redundant re-reads. */
  private cwd: string | undefined

  /** In-flight probe, superseded by the next refresh. */
  private inflight: AbortController | undefined

  constructor(private readonly ctx: ClientContext) {}

  private set(patch: Partial<GitStatusBarState>): void {
    this.store.set({ ...this.store.getSnapshot(), ...patch })
  }

  /** Read the current selection's cwd from the sessions list. */
  private currentCwd(): string | undefined {
    const state = this.ctx.sessions.list.getSnapshot()
    if (state.current === undefined) return undefined
    return state.byId[state.current]?.cwd
  }

  /**
   * Probe the current session's directory, or hide when none is current.
   * Superseding an in-flight probe aborts the earlier request.
   */
  async refresh(): Promise<void> {
    const cwd = this.currentCwd()
    if (cwd === undefined) {
      this.cwd = undefined
      this.set({ phase: 'hidden', status: null, error: null })
      return
    }
    if (cwd === this.cwd && this.store.getSnapshot().status !== null) return
    this.inflight?.abort()
    const signal = new AbortController()
    this.inflight = signal
    this.set({ phase: 'loading', status: this.store.getSnapshot().status, error: null })
    const result = await this.ctx.remote.gitStatus.read(cwd, signal.signal)
    if (signal.signal.aborted) return
    if (!result.ok) {
      this.cwd = cwd
      this.set({ phase: 'error', error: result.error.message })
      return
    }
    const status = result.value
    this.cwd = cwd
    if (!status.isRepo) {
      this.set({ phase: 'hidden', status: null, error: null })
      return
    }
    this.set({ phase: 'ready', status, error: null })
  }

  /**
   * Reveal the current repository's folder on the Host desktop. A deployment
   * without a native opener keeps the bar functional: the failure is silent.
   */
  async openRepo(): Promise<void> {
    const status = this.store.getSnapshot().status
    const root = status?.isRepo === true ? status.root : undefined
    if (root === undefined || root === '') return
    const result = await this.ctx.remote.session.openWorkspacePath({ path: root }, new AbortController().signal)
    if (!result.ok) {
      // The read-only bar degrades quietly; the caller still holds the path.
      this.set({ phase: 'ready', status, error: null })
    }
  }

  /**
   * Follow the sessions list: any selection or cwd change re-probes, and an
   * explicit `refresh()` from the seat stays available for staleness.
   * @returns a disposer stopping the subscription.
   */
  start(): () => void {
    const disposers: (() => void)[] = [
      this.ctx.sessions.list.subscribe(() => { void this.refresh() }),
      this.ctx.on('connection/reset', () => { void this.refresh() }),
    ]
    void this.refresh()
    return () => { for (const dispose of disposers) dispose() }
  }
}
