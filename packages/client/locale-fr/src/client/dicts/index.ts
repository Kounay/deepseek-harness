/**
 * French dictionary contributions, one per UI namespace. The manifest drives
 * registration in `apply` and the key-parity spec; keep this list in sync with
 * the namespace dictionaries shipped by the GUI's client packages.
 */
import { fr as approval } from './approval.ts'
import { fr as chat } from './chat.ts'
import { fr as command } from './command.ts'
import { fr as common } from './common.ts'
import { fr as conversation } from './conversation.ts'
import { fr as cordis } from './cordis.ts'
import { fr as deliverables } from './deliverables.ts'
import { fr as directoryBrowser } from './directory-browser.ts'
import { fr as feedback } from './feedback.ts'
import { fr as git } from './git.ts'
import { fr as goal } from './goal.ts'
import { fr as job } from './job.ts'
import { fr as model } from './model.ts'
import { fr as permissionAccess } from './permission-access.ts'
import { fr as plan } from './plan.ts'
import { fr as question } from './question.ts'
import { fr as reference } from './reference.ts'
import { fr as scheduleCatalog } from './schedule-catalog.ts'
import { fr as settings } from './settings.ts'
import { fr as settingsAgentPreset } from './settings-agent-preset.ts'
import { fr as settingsLocale } from './settings-locale.ts'
import { fr as settingsModels } from './settings-models.ts'
import { fr as settingsPermission } from './settings-permission.ts'
import { fr as settingsPluginInventory } from './settings-plugin-inventory.ts'
import { fr as settingsPlugins } from './settings-plugins.ts'
import { fr as settingsTheme } from './settings-theme.ts'
import { fr as sidebar } from './sidebar.ts'
import { fr as skill } from './skill.ts'
import { fr as slashMenu } from './slash-menu.ts'
import { fr as subagent } from './subagent.ts'
import { fr as trajectory } from './trajectory.ts'
import { fr as workflowRun } from './workflow-run.ts'
import { fr as workspace } from './workspace.ts'

/** One French dictionary contribution: the target namespace and its copy. */
export interface FrenchDictionary {
  /** Registered locale namespace (a `LocaleNamespaceMap` key of the owner). */
  readonly namespace: string
  /** French copy for that namespace, mirroring the shipped `en` key set. */
  readonly fr: Readonly<Record<string, string>>
}

/** Complete list of French dictionary contributions registered by this pack. */
export const dictionaries: readonly FrenchDictionary[] = [
  { namespace: 'approval', fr: approval },
  { namespace: 'chat', fr: chat },
  { namespace: 'command', fr: command },
  { namespace: 'common', fr: common },
  { namespace: 'conversation', fr: conversation },
  { namespace: 'cordis', fr: cordis },
  { namespace: 'deliverables', fr: deliverables },
  { namespace: 'directory-browser', fr: directoryBrowser },
  { namespace: 'feedback', fr: feedback },
  { namespace: 'git', fr: git },
  { namespace: 'goal', fr: goal },
  { namespace: 'job', fr: job },
  { namespace: 'model', fr: model },
  { namespace: 'permission.access', fr: permissionAccess },
  { namespace: 'plan', fr: plan },
  { namespace: 'question', fr: question },
  { namespace: 'reference', fr: reference },
  { namespace: 'schedule.catalog', fr: scheduleCatalog },
  { namespace: 'settings', fr: settings },
  { namespace: 'settings.agentPreset', fr: settingsAgentPreset },
  { namespace: 'settings.locale', fr: settingsLocale },
  { namespace: 'settings.models', fr: settingsModels },
  { namespace: 'settings.permission', fr: settingsPermission },
  { namespace: 'settings.pluginInventory', fr: settingsPluginInventory },
  { namespace: 'settings.plugins', fr: settingsPlugins },
  { namespace: 'settings.theme', fr: settingsTheme },
  { namespace: 'sidebar', fr: sidebar },
  { namespace: 'skill', fr: skill },
  { namespace: 'slash.menu', fr: slashMenu },
  { namespace: 'subagent', fr: subagent },
  { namespace: 'trajectory', fr: trajectory },
  { namespace: 'workflowRun', fr: workflowRun },
  { namespace: 'workspace', fr: workspace },
]
