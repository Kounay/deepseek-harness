/**
 * Git status bar plugin, browser half: occupies the dedicated
 * `conversation.composer.status` seat above the composer with a slim work-tree
 * strip. Reads ride the `gitStatus` Remote namespace; the controller follows
 * the sessions list and re-probes when the current session or its directory
 * changes.
 */
// Type-only: pulls the git-status controller's remote merge (ctx.remote.gitStatus).
import type {} from '@deepseek-ai/dsh-api-git-status-controller/remote'
// Type-only: pulls the Session Controller service merge (ctx.sessions).
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
// Type-only: pulls the ctx.remote merge into this program.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
// Type-only: pulls the ui-conversation SlotMap merge (the composer.status seat).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { GitStatusBar } from './GitStatusBar.tsx'
import type { GitStatusBarInjected } from './GitStatusBar.tsx'
import { GitStatusBarController } from './git-bar-store.ts'
import { en, zh, type GitKey } from './locales.ts'

export type { GitStatusBarInjected } from './GitStatusBar.tsx'
export type { GitStatusBarState } from './git-bar-store.ts'
export type { GitKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The composer git status bar's copy. */
    git: GitKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'git'

/** Required services: the seat's slot registry, remotes, sessions, and locale. */
export const inject = ['slots', 'locale', 'remote', 'remote.gitStatus', 'remote.session', 'sessions']

/**
 * Client plugin body: register the git status bar over the Remote channel.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-git-status: dictionaries')

  const controller = new GitStatusBarController(ctx)
  ctx.effect(() => controller.start(), 'ui-git-status: follow sessions')

  ctx.slots.inject('conversation.composer.status', () => ctx.slots.register({
    name: 'conversation.composer.status',
    locale: NS,
    inject: (_sessionId: SessionId): GitStatusBarInjected => ({
      hooks: { gitStatus: controller.store },
      refresh: () => controller.refresh(),
      openRepo: () => controller.openRepo(),
    }),
  }, GitStatusBar))
}
