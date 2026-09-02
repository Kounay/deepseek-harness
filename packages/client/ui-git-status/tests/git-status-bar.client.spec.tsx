// @vitest-environment jsdom
/**
 * GitStatusBar presentation: hidden outside a work tree, quiet while the first
 * probe is in flight, an error row with retry after failures, and — when ready
 * — repository, branch, offsets, and counts. The repository opens the local
 * folder; the branch is a GitHub link only when an origin remote exists.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { GitStatusView } from '@deepseek-ai/dsh-api-git-status-controller/types'
import type { GitStatusBarState } from '../src/client/git-bar-store.ts'
import { GitStatusBar, type GitStatusBarProps } from '../src/client/GitStatusBar.tsx'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const REPO: GitStatusView = {
  isRepo: true, root: 'C:/work/deepseek-harness', repoName: 'deepseek-harness',
  branch: 'main', ahead: 2, behind: 1, modified: 1, deleted: 0, untracked: 2,
  github: { owner: 'deepseek-ai', repo: 'deepseek-harness' },
}

/** Deterministic stub for the framework t seat (locale-independent keys). */
function t(key: string, params?: Record<string, string | number>): string {
  if (params === undefined) return key
  let out = key
  for (const [name, value] of Object.entries(params)) {
    out = out.replaceAll(`{${name}}`, String(value))
  }
  return out
}

function readyState(partial?: Partial<GitStatusView>): GitStatusBarState {
  return { phase: 'ready', status: { ...REPO, ...partial }, error: null }
}

function setup(
  state: GitStatusBarState,
  openRepo = vi.fn(async () => {}),
  refresh = vi.fn(async () => {}),
) {
  const useGitStatus = <T,>(selector: (state: GitStatusBarState) => T): T => selector(state)
  const props = { useGitStatus, refresh, openRepo, t } as unknown as GitStatusBarProps
  return render(<GitStatusBar {...props} />)
}

describe('GitStatusBar', () => {
  it('renders nothing while hidden or during the first probe', () => {
    const hidden = setup({ phase: 'hidden', status: null, error: null })
    expect(hidden.container.innerHTML).toBe('')
    cleanup()
    const loading = setup({ phase: 'loading', status: null, error: null })
    expect(loading.container.innerHTML).toBe('')
  })

  it('shows an error row with a retry action after a failed read', async () => {
    const refresh = vi.fn(async () => {})
    setup({ phase: 'error', status: null, error: 'index file corrupt' }, vi.fn(async () => {}), refresh)
    fireEvent.click(screen.getByRole('button', { name: 'refresh' }))
    await waitFor(() => { expect(refresh).toHaveBeenCalledTimes(1) })
  })

  it('shows repository, branch, offsets, counts, and a clean label', () => {
    const view = setup(readyState())
    expect(screen.getByRole('button', { name: 'repo.button' }).textContent).toBe('deepseek-harness')
    expect(screen.getByRole('link', { name: 'branch.button' }).textContent).toBe('main')
    expect(view.container.textContent).toContain('meta.ahead')
    expect(view.container.textContent).toContain('meta.behind')
    expect(view.container.textContent).toContain('changes.modified.one')
    expect(view.container.textContent).toContain('changes.untracked.other')
    cleanup()
    const clean = setup(readyState({ modified: 0, untracked: 0 }))
    expect(clean.container.textContent).toContain('clean')
  })

  it('opens the local repository folder from the repository link', async () => {
    const openRepo = vi.fn(async () => {})
    setup(readyState(), openRepo)
    fireEvent.click(screen.getByRole('button', { name: 'repo.button' }))
    await waitFor(() => { expect(openRepo).toHaveBeenCalledTimes(1) })
  })

  it('links the branch to its GitHub tree page', () => {
    setup(readyState())
    const link = screen.getByRole('link', { name: 'branch.button' })
    expect(link.getAttribute('href'))
      .toBe('https://github.com/deepseek-ai/deepseek-harness/tree/main')
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('renders the branch as plain text when no GitHub remote exists', () => {
    setup(readyState({ github: null }))
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('main')).toBeTruthy()
  })

  it('labels a detached HEAD without a branch link', () => {
    setup(readyState({ branch: null, github: null }))
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('branch.detached')).toBeTruthy()
  })
})
