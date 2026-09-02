/** GitStatusBarController state transitions over scripted sessions/remotes. */
import { describe, expect, it, vi } from 'vitest'
import type { GitStatusView } from '@deepseek-ai/dsh-api-git-status-controller/types'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { GitStatusBarController } from '../src/client/git-bar-store.ts'

const REPO: GitStatusView = {
  isRepo: true, root: 'C:/work/deepseek-harness', repoName: 'deepseek-harness',
  branch: 'main', ahead: 2, behind: 0, modified: 1, deleted: 0, untracked: 2,
  github: { owner: 'deepseek-ai', repo: 'deepseek-harness' },
}

/** Minimal ctx: scripted sessions list, remotes, and event hooks. */
function makeCtx(options: {
  current?: string
  cwd?: string
  answers?: Array<{ ok: true; value: GitStatusView } | { ok: false; error: { code: string; message: string } }>
}) {
  const read = vi.fn(async () => (options.answers?.[0] ?? { ok: true, value: REPO }))
  const openWorkspacePath = vi.fn(async () => ({ ok: true as const, value: { opened: true as const } }))
  const list = createSnapshotStore({
    current: options.current,
    byId: options.cwd === undefined ? {} : { [options.current ?? 'a']: { cwd: options.cwd } },
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
  it('stays hidden while no session is current', async () => {
    const { ctx } = makeCtx({})
    const controller = new GitStatusBarController(ctx as never)
    await controller.refresh()
    expect(controller.store.getSnapshot()).toEqual({ phase: 'hidden', status: null, error: null })
  })

  it('reads the current session directory and publishes the parsed view', async () => {
    const { ctx } = makeCtx({ current: 'a', cwd: 'C:/work/deepseek-harness' })
    const controller = new GitStatusBarController(ctx as never)
    await controller.refresh()
    expect(controller.store.getSnapshot()).toEqual({ phase: 'ready', status: REPO, error: null })
  })

  it('skips a redundant read while the same directory is already shown', async () => {
    const { ctx, read } = makeCtx({ current: 'a', cwd: 'C:/work/deepseek-harness' })
    const controller = new GitStatusBarController(ctx as never)
    await controller.refresh()
    await controller.refresh()
    expect(read).toHaveBeenCalledTimes(1)
  })

  it('hides outside a git work tree', async () => {
    const { ctx } = makeCtx({
      current: 'a', cwd: 'C:/plain',
      answers: [{ ok: true, value: { isRepo: false, modified: 0, deleted: 0, untracked: 0 } }],
    })
    const controller = new GitStatusBarController(ctx as never)
    await controller.refresh()
    expect(controller.store.getSnapshot()).toEqual({ phase: 'hidden', status: null, error: null })
  })

  it('publishes a failure message when the read errors', async () => {
    const { ctx } = makeCtx({
      current: 'a', cwd: 'C:/work',
      answers: [{ ok: false, error: { code: 'gitStatus/read-failed', message: 'index file corrupt' } }],
    })
    const controller = new GitStatusBarController(ctx as never)
    await controller.refresh()
    expect(controller.store.getSnapshot()).toEqual({
      phase: 'error', status: null, error: 'index file corrupt',
    })
  })

  it('follows the sessions list and stops following on dispose', async () => {
    const cwdOf = (id: string, cwd: string) => ({ [id]: { cwd } })
    const { ctx, list, read } = makeCtx({ current: 'a', cwd: 'C:/repo-a' })
    const controller = new GitStatusBarController(ctx as never)
    const dispose = controller.start()
    expect(read).toHaveBeenCalledTimes(1)
    list.set({ current: 'b', byId: cwdOf('b', 'C:/repo-b') })
    await vi.waitFor(() => { expect(read).toHaveBeenCalledTimes(2) })
    dispose()
    list.set({ current: 'c', byId: cwdOf('c', 'C:/repo-c') })
    expect(read).toHaveBeenCalledTimes(2)
  })

  it('opens the repository root through the session remote', async () => {
    const { ctx, openWorkspacePath } = makeCtx({ current: 'a', cwd: 'C:/work/deepseek-harness' })
    const controller = new GitStatusBarController(ctx as never)
    await controller.refresh()
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
