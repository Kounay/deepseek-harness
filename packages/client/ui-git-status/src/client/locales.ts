/** `git` namespace dictionaries: the composer git-status bar copy. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'loading': '正在读取 Git 状态…',
  'error': '无法读取 Git 状态',
  'refresh': '刷新 Git 状态',
  'clean': '干净',
  'bar.aria': '当前工作区的 Git 状态',
  'repo.button': '{name} 仓库',
  'repo.open': '打开本地仓库文件夹',
  'branch.button': '分支 {branch}',
  'branch.open': '在 GitHub 打开分支 {branch}',
  'branch.detached': '游离 HEAD',
  'meta.ahead': '领先 {ahead}',
  'meta.behind': '落后 {behind}',
  'changes.modified.one': '{count} 个修改',
  'changes.modified.other': '{count} 个修改',
  'changes.untracked.one': '{count} 个未跟踪',
  'changes.untracked.other': '{count} 个未跟踪',
  'changes.deleted.one': '{count} 个删除',
  'changes.deleted.other': '{count} 个删除',
} satisfies Record<string, string>

/** The git namespace key union. */
export type GitKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'loading': 'Reading git status…',
  'error': 'Git status unavailable',
  'refresh': 'Refresh git status',
  'clean': 'Clean',
  'bar.aria': 'Git status for this workspace',
  'repo.button': '{name} repository',
  'repo.open': 'Open repository folder',
  'branch.button': 'Branch {branch}',
  'branch.open': 'Open {branch} on GitHub',
  'branch.detached': 'Detached HEAD',
  'meta.ahead': '{ahead} ahead',
  'meta.behind': '{behind} behind',
  'changes.modified.one': '{count} modified',
  'changes.modified.other': '{count} modified',
  'changes.untracked.one': '{count} untracked',
  'changes.untracked.other': '{count} untracked',
  'changes.deleted.one': '{count} deleted',
  'changes.deleted.other': '{count} deleted',
} satisfies Record<GitKey, string>
