/** locale-fr manifest invariants: unique namespaces, non-empty copy, and
 * key parity with the locale plugin's own common/settings.locale pairs. */
import { describe, expect, it } from 'vitest'
import { en as commonEn } from '../../locale/src/locales/index.ts'
import { en as settingsLocaleEn } from '../../locale/src/locales/settings.ts'
import { dictionaries } from '../src/client/dicts/index.ts'

/** Copy for a manifest namespace, or fail the spec loudly when absent. */
function frOf(namespace: string): Readonly<Record<string, string>> {
  const contribution = dictionaries.find(entry => entry.namespace === namespace)
  if (contribution === undefined) throw new Error(`no ${namespace} contribution`)
  return contribution.fr
}

describe('locale-fr dictionary manifest', () => {
  it('declares each namespace at most once', () => {
    const namespaces = dictionaries.map(entry => entry.namespace)
    expect(new Set(namespaces).size).toBe(namespaces.length)
  })

  it('declares the full shipped namespace set', () => {
    expect(namespacesOf(dictionaries)).toEqual(expect.arrayContaining([
      'approval', 'chat', 'command', 'common', 'conversation', 'cordis',
      'deliverables', 'directory-browser', 'feedback', 'git', 'goal', 'job',
      'model', 'permission.access', 'plan', 'question', 'reference',
      'schedule.catalog', 'settings', 'settings.agentPreset',
      'settings.locale', 'settings.models', 'settings.permission',
      'settings.pluginInventory', 'settings.plugins', 'settings.theme',
      'sidebar', 'skill', 'slash.menu', 'subagent', 'trajectory',
      'workflowRun', 'workspace',
    ]))
  })

  it('keeps every key and value non-empty', () => {
    for (const { namespace, fr } of dictionaries) {
      const keys = Object.keys(fr)
      expect(keys.length).toBeGreaterThan(0)
      for (const key of keys) {
        const value = fr[key]
        expect(key.length).toBeGreaterThan(0)
        expect(value?.length ?? 0).toBeGreaterThan(0)
      }
      expect(namespace.length).toBeGreaterThan(0)
    }
  })

  it('mirrors the shipped common and settings.locale key sets exactly', () => {
    expect(Object.keys(frOf('common')).sort()).toEqual(Object.keys(commonEn).sort())
    expect(Object.keys(frOf('settings.locale')).sort()).toEqual(Object.keys(settingsLocaleEn).sort())
  })
})

function namespacesOf(entries: readonly { namespace: string }[]): string[] {
  return entries.map(entry => entry.namespace)
}
