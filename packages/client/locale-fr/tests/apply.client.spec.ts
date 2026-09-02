/** locale-fr apply wiring: fr language registration, per-namespace dictionary
 * seats, copy reads in French after switching, and full removal on disposal. */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { apply as settingsApply, inject as settingsInject } from '@deepseek-ai/dsh-client-ui-settings/client'
import { TestRemote } from '@deepseek-ai/dsh-client-test-runtime'
import {
  apply as localeApply, inject as localeInject,
} from '@deepseek-ai/dsh-client-locale/client'
import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { LOCALE_SETTINGS_NAMESPACE, LocaleSettingsSchema } from '../../locale/src/locale-settings.ts'
import { apply, inject } from '../src/client/index.ts'
import { apply as nodeHalfApply } from '../src/index.ts'
import { dictionaries } from '../src/client/dicts/index.ts'

const SLOT = 'settings.general.item'

/** Compose the locale service the way the shell does (mirrors the locale
 * plugin's own wiring spec): slot registry, settings scope, and a fake remote. */
async function bench() {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  let preference: string | undefined
  let revision = 0
  const namespace = () => ({
    ns: LOCALE_SETTINGS_NAMESPACE,
    schema: LocaleSettingsSchema.toJSON(),
    value: preference === undefined ? {} : { preference },
    applies: 'live' as const,
    secrets: [],
    revision,
  })
  const describe = vi.fn(async () => ({
    ok: true as const,
    value: { writable: true, hasDocument: true, namespaces: [namespace()] },
  }))
  const mutate = vi.fn(async (_ns: string, ops: { value: string }[]) => {
    preference = ops[0]!.value
    revision += 1
    return { ok: true as const, value: namespace() }
  })
  void new TestRemote(ctx, { settings: { describe, mutate } })
  await ctx.plugin({ inject: [...settingsInject], apply: settingsApply }).await()
  return { ctx }
}

/** Stand in for the settings shell: declare the General item slot from root. */
function declareItems(slots: SlotRegistry): () => void {
  return slots.register(
    { name: 'root', children: { [SLOT]: { kind: 'list', scope: 'root' } } } as never,
    () => null,
  )
}

/** Boot locale, then this pack, returning the locale service and pack fiber. */
async function boot() {
  const b = await bench()
  declareItems(b.ctx.get('slots') as SlotRegistry)
  await b.ctx.plugin({ inject: [...localeInject], apply: localeApply }).await()
  const locale = b.ctx.get('locale') as LocaleRuntime
  const fiber = b.ctx.plugin({ inject: [...inject], apply })
  await fiber.await()
  return { ctx: b.ctx, locale, fiber }
}

describe('locale-fr apply', () => {
  it('declares the locale service as its only dependency', () => {
    expect(inject).toEqual(['locale'])
  })

  it('host half provides no host-side behavior', () => {
    nodeHalfApply()
    expect(nodeHalfApply).toBeTypeOf('function')
  })

  it('registers the fr language and a dictionary seat for every contribution', async () => {
    const { locale } = await boot()
    // The service still offers the shipped pair first, then the pack language.
    expect(locale.getLocale().locales.map(localeId => localeId.id)).toEqual(['zh', 'en', 'fr'])
    // Every manifest namespace now has an occupied fr seat.
    for (const { namespace } of dictionaries) {
      expect(() => locale.register(namespace, 'fr', {})).toThrow('already has locale')
    }
  })

  it('serves French copy after the user switches to fr and leaves zh/en intact', async () => {
    const { locale } = await boot()
    locale.setLocale('fr')
    expect(locale.bind('sidebar')('session.new')).toBe('Nouvelle session')
    expect(locale.bind('common')('cancel')).toBe('Annuler')
    expect(locale.bind('settings.locale')('language.title')).toBe('Langue')
    // The pack's fr seats read even when only the locale plugin's own en/zh
    // dictionaries are loaded (this bench boots no feature plugin).
    expect(locale.bind('workspace')('status.completed')).toBe('Terminé')
    // The shipped dictionaries keep their English spelling under en.
    locale.setLocale('en')
    expect(locale.bind('common')('cancel')).toBe('Cancel')
    expect(locale.bind('settings.locale')('language.title')).toBe('Language')
  })

  it('disposal removes the language and every dictionary seat', async () => {
    const { locale, fiber } = await boot()
    await fiber.dispose()
    expect(locale.getLocale().locales.map(localeId => localeId.id)).toEqual(['zh', 'en'])
    expect(() => { locale.setLocale('fr') }).toThrow('is not registered')
    // With fr gone, en reads the shipped English copy as before the pack.
    expect(locale.bind('common')('cancel')).toBe('Cancel')
  })
})
