/** parser vocabulary: branch headers, work-tree counts, and repo names. */
import { describe, expect, it } from 'vitest'
import { parseBranchHeader, parseGithubRemote, parseStatus } from '../src/parser.ts'

describe('parseBranchHeader', () => {
  it('reads a bare branch', () => {
    expect(parseBranchHeader('## main')).toEqual({ branch: 'main', ahead: null, behind: null })
  })

  it('strips an upstream without offsets', () => {
    expect(parseBranchHeader('## main...origin/main'))
      .toEqual({ branch: 'main', ahead: null, behind: null })
  })

  it('reads ahead and behind offsets in every combination', () => {
    expect(parseBranchHeader('## main...origin/main [ahead 2]'))
      .toEqual({ branch: 'main', ahead: 2, behind: null })
    expect(parseBranchHeader('## main...origin/main [behind 1]'))
      .toEqual({ branch: 'main', ahead: null, behind: 1 })
    expect(parseBranchHeader('## main...origin/main [ahead 2, behind 1]'))
      .toEqual({ branch: 'main', ahead: 2, behind: 1 })
  })

  it('reports a detached HEAD as a null branch', () => {
    expect(parseBranchHeader('## HEAD (no branch)'))
      .toEqual({ branch: null, ahead: null, behind: null })
  })
})

describe('parseStatus', () => {
  it('names the repository from the work-tree root', () => {
    const view = parseStatus('C:/work/deepseek-harness', '## main\n M src/a.ts\n?? notes.md\n')
    expect(view.repoName).toBe('deepseek-harness')
    expect(view.branch).toBe('main')
    expect(view.modified).toBe(1)
    expect(view.untracked).toBe(1)
  })

  it('counts non-untracked porcelain entries across kinds', () => {
    const view = parseStatus('/repo', '## dev\nM  staged.ts\n D unstaged.ts\nR  old.ts -> new.ts\n?? u.ts\n')
    expect(view.modified).toBe(2)
    expect(view.deleted).toBe(1)
    expect(view.untracked).toBe(1)
  })

  it('separates deletions from other changes', () => {
    const view = parseStatus('/repo', '## dev\n M a.ts\nD  gone.ts\n D gone2.ts\n?? u.ts\n')
    expect(view.modified).toBe(1)
    expect(view.deleted).toBe(2)
    expect(view.untracked).toBe(1)
  })

  it('answers an empty work tree with zero counts', () => {
    expect(parseStatus('/repo', '## main')).toMatchObject({
      isRepo: true, repoName: 'repo', branch: 'main',
      modified: 0, deleted: 0, untracked: 0,
    })
  })

  it('normalizes trailing separators in the root name', () => {
    expect(parseStatus('C:\\work\\repo\\', '## main').repoName).toBe('repo')
    expect(parseStatus('/work/repo/', '## main').repoName).toBe('repo')
  })
})

describe('parseGithubRemote', () => {
  it('parses https URLs with and without a .git suffix', () => {
    expect(parseGithubRemote('https://github.com/deepseek-ai/deepseek-harness.git'))
      .toEqual({ owner: 'deepseek-ai', repo: 'deepseek-harness' })
    expect(parseGithubRemote('https://github.com/octo/cat/'))
      .toEqual({ owner: 'octo', repo: 'cat' })
  })

  it('parses the ssh scp-style form', () => {
    expect(parseGithubRemote('git@github.com:deepseek-ai/deepseek-harness.git'))
      .toEqual({ owner: 'deepseek-ai', repo: 'deepseek-harness' })
  })

  it('answers null for other hosts and empty output', () => {
    expect(parseGithubRemote('https://gitlab.com/group/project.git')).toBeNull()
    expect(parseGithubRemote('')).toBeNull()
  })
})
