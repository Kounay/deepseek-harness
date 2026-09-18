/**
 * The composer git status bar: the repository opens its local folder, the
 * branch opens the GitHub page at that branch when an origin remote exists.
 * Renders nothing outside a git work tree.
 */
import { useEffect } from 'react'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { IconBranchOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
// Type-only: pulls the ui-conversation SlotMap merge (the composer.status seat).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { GitStatusBarState } from './git-bar-store.ts'
import css from './GitStatusBar.module.css'

/** Registration-side business face for the git status bar. */
export interface GitStatusBarInjected {
  hooks: {
    /** Bar snapshot bound by the renderer as useGitStatus. */
    gitStatus: SnapshotStore<GitStatusBarState>
  }
  /** Re-probe the current session's work tree. */
  refresh: () => Promise<void>
  /** Reveal the repository folder on the Host desktop. */
  openRepo: () => Promise<void>
  /** Point the bar at this seat's Session. */
  watch: () => void
}

/** Full component props. */
export type GitStatusBarProps =
  PropsRuntime<'conversation.composer.status'>
  & PropsLocale<'git'>
  & InjectFace<GitStatusBarInjected>

/** Plural variant helper for the one/other key pairs. */
function variant(count: number): 'one' | 'other' {
  return count === 1 ? 'one' : 'other'
}

/**
 * Render the bar, or nothing when the current session has no git work tree.
 * @param props - composed slot props.
 */
export function GitStatusBar({ sessionId, useGitStatus, refresh, openRepo, watch, t }: GitStatusBarProps) {
  const state = useGitStatus(snapshot => snapshot)

  // Point the controller at this seat's Session; the scope supplies a new
  // sessionId when the visible Session changes.
  useEffect(() => { watch() }, [sessionId, watch])

  if (state.phase === 'hidden') return null
  const { status } = state

  // The first probe is in flight: keep the seat empty instead of flashing a
  // loading strip over the composer.
  if (status === null) {
    if (state.phase !== 'error') return null
    return (
      <div className={css.bar} data-git-status-bar="error">
        <span className={css.error}>{t('error')}</span>
        <button type="button" className={css.retry} onClick={() => { void refresh() }}>
          {t('refresh')}
        </button>
      </div>
    )
  }

  const modified = status.modified
  const deleted = status.deleted
  const untracked = status.untracked
  const ahead = status.ahead ?? 0
  const behind = status.behind ?? 0
  const branch = status.branch ?? null
  const repoName = status.repoName ?? ''
  const github = status.github ?? null
  const branchUrl = github === null || branch === null
    ? undefined
    : `https://github.com/${github.owner}/${github.repo}/tree/${encodeURIComponent(branch)}`

  return (
    <div className={css.bar} data-git-status-bar="">
      <IconBranchOutline16 size={14} className={css.glyph} />
      <button
        type="button"
        className={css.link}
        title={t('repo.open')}
        aria-label={t('repo.button', { name: repoName })}
        onClick={() => { void openRepo() }}
      >
        {repoName}
      </button>
      <span className={css.separator} aria-hidden>·</span>
      {branch === null ? (
        <span className={css.muted}>{t('branch.detached')}</span>
      ) : branchUrl === undefined ? (
        <span className={css.muted}>{branch}</span>
      ) : (
        <a
          className={css.link}
          href={branchUrl}
          target="_blank"
          rel="noreferrer"
          title={t('branch.open', { branch })}
          aria-label={t('branch.button', { branch })}
        >
          {branch}
        </a>
      )}
      {(ahead > 0 || behind > 0) && (
        <span className={css.offsets}>
          {ahead > 0 && <span className={css.muted}>{t('meta.ahead', { ahead })}</span>}
          {ahead > 0 && behind > 0 && <span className={css.separator} aria-hidden>·</span>}
          {behind > 0 && <span className={css.muted}>{t('meta.behind', { behind })}</span>}
        </span>
      )}
      <span className={css.grow} aria-hidden />
      {modified + deleted + untracked === 0 ? (
        <span className={css.muted}>{t('clean')}</span>
      ) : (
        <span className={css.counts}>
          {modified > 0 && (
            <>
              <span>{t(`changes.modified.${variant(modified)}` as const, { count: modified })}</span>
              {(deleted > 0 || untracked > 0) && <span className={css.separator} aria-hidden>·</span>}
            </>
          )}
          {deleted > 0 && (
            <>
              <span>{t(`changes.deleted.${variant(deleted)}` as const, { count: deleted })}</span>
              {untracked > 0 && <span className={css.separator} aria-hidden>·</span>}
            </>
          )}
          {untracked > 0 && (
            <span>{t(`changes.untracked.${variant(untracked)}` as const, { count: untracked })}</span>
          )}
        </span>
      )}
    </div>
  )
}
