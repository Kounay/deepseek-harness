/**
 * French language-pack plugin: registers the `fr` locale (fallback `en`) and
 * the French dictionaries for the GUI's UI namespaces. Copy lookup per key
 * walks `fr` → `en`, so a namespace without a contribution here stays English.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { dictionaries } from './dicts/index.ts'

/** Services required by the language pack. */
export const inject = ['locale']

/**
 * Register the French language and every contributed dictionary. Each
 * registration is its own effect so HMR unload removes exactly what this pack
 * added.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(
    () => ctx.locale.addLanguage({ id: 'fr', label: 'Français', fallback: 'en' }),
    'locale-fr: language',
  )
  for (const { namespace, fr } of dictionaries) {
    ctx.effect(
      () => ctx.locale.register(namespace, 'fr', fr),
      `locale-fr: ${namespace} dictionary`,
    )
  }
}
