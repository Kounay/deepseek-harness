/** GitStatusBarController state transitions over scripted sessions/remotes. */
import { describe, expect, it, vi } from 'vitest'
import type { GitStatusView } from '@deepseek-ai/dsh-api-git-status-controller/types'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { GitStatusBarController } from '../src/client/git-bar-store.ts'

/** Watched Session identity (tests use plain literals cast to the brand). */
const SID = 'a' as SessionId

const REPO: GitStatusView = {
  isRepo: true, root: 'C:/work/deepseek-harness', repoName: 'deepseek-harness',
  branch: 'main', ahead: 2, behind: 0, modified: 1, deleted: 0, untracked: 2,
  github: { owner: 'deepseek-ai', repo: 'deepseek-harness' },
}

/** Minimal ctx: scripted sessions list, remotes, and event hooks. */
function makeCtx(options: {
  cwd?: string
  answers?: Array<{ ok: true; value: GitStatusView } | { ok: false; error: { code: string; message: string } }>
}) {
  const read = vi.fn(async () => (options.answers?.[0] ?? { ok: true, value: REPO }))
  const openWorkspacePath = vi.fn(async () => ({ ok: true as const, value: { opened: true as const } }))
  const list = createSnapshotStore({
    ids: [SID],
    byId: options.cwd === undefined ? {} : { [SID]: { cwd: options.cwd } },
    phase: 'ready' as const,
    subagentsByParent: {},
    jobsBySession: {},
  })
  const on = vi.fn(() => () => {})
  const ctx = {
    sessions: { list },
    remote: { gitStatus: { read }, session: { openWorkspacePath } },
    on,
  }
  return { ctx, list, read, openWorkspacePath }
}

describe('GitStatusBarController', () => {
  it('stays hidden until a Session is watched', async () => {
    const { ctx } = makeCtx({ cwd: 'C:/work/deepseek-harness' })
    const controller = new GitStatusBarController(ctx as never)
    await controller.refresh()
    expect(controller.store.getSnapshot()).toEqual({ phase: 'hidden', status: null, error: null })
  })

  it('reads the watched Session directory and publishes the parsed view', async () => {
    const { ctx } = makeCtx({ cwd: 'C:/work/deepseek-harness' })
    const controller = new GitStatusBarController(ctx as never)
    controller.watch(SID)
    await vi.waitFor(() => {
      expect(controller.store.getSnapshot()).toEqual({ phase: 'ready', status: REPO, error: null })
    })
  })

  it('skips a redundant read while the same directory is already shown', async () => {
    const { ctx, read } = makeCtx({ cwd: 'C:/work/deepseek-harness' })
    const controller = new GitStatusBarController(ctx as never)
    controller.watch(SID)
    await vi.waitFor(() => { expect(controller.store.getSnapshot().phase).toBe('ready') })
    await controller.refresh()
    expect(read).toHaveBeenCalledTimes(1)
  })

  it('hides outside a git work tree', async () => {
    const { ctx } = makeCtx({
      cwd: 'C:/plain',
      answers: [{ ok: true, value: { isRepo: false, modified: 0, deleted: 0, untracked: 0 } }],
    })
    const controller = new GitStatusBarController(ctx as never)
    controller.watch(SID)
    await vi.waitFor(() => { expect(controller.store.getSnapshot().phase).toBe('hidden') })
  })

  it('publishes a failure message when the read errors', async () => {
    const { ctx } = makeCtx({
      cwd: 'C:/work',
      answers: [{ ok: false, error: { code: 'gitStatus/read-failed', message: 'index file corrupt' } }],
    })
    const controller = new GitStatusBarController(ctx as never)
    controller.watch(SID)
    await vi.waitFor(() => {
      expect(controller.store.getSnapshot()).toEqual({
        phase: 'error', status: null, error: 'index file corrupt',
      })
    })
  })

  it('re-probes when the watched Session directory changes, and stops on dispose', async () => {
    const { ctx, list, read } = makeCtx({ cwd: 'C:/repo-a' })
    const controller = new GitStatusBarController(ctx as never)
    const dispose = controller.start()
    controller.watch(SID)
    await vi.waitFor(() => { expect(read).toHaveBeenCalledTimes(1) })
    list.set({ ...list.getSnapshot(), byId: { [SID]: { cwd: 'C:/repo-b' } } })
    await vi.waitFor(() => { expect(read).toHaveBeenCalledTimes(2) })
    dispose()
    list.set({ ...list.getSnapshot(), byId: { [SID]: { cwd: 'C:/repo-c' } } })
    expect(read).toHaveBeenCalledTimes(2)
  })

  it('opens the repository root through the session remote', async () => {
    const { ctx, openWorkspacePath } = makeCtx({ cwd: 'C:/work/deepseek-harness' })
    const controller = new GitStatusBarController(ctx as never)
    controller.watch(SID)
    await vi.waitFor(() => { expect(controller.store.getSnapshot().phase).toBe('ready') })
    await controller.openRepo()
    expect(openWorkspacePath).toHaveBeenCalledWith(
      { path: 'C:/work/deepseek-harness' },
      expect.any(AbortSignal),
    )
  })

  it('keeps quiet when asked to open while no work tree is shown', async () => {
    const { ctx, openWorkspacePath } = makeCtx({})
    const controller = new GitStatusBarController(ctx as never)
    await controller.openRepo()
    expect(openWorkspacePath).not.toHaveBeenCalled()
  })
})
