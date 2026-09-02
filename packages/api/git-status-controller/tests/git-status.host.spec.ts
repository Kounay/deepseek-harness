/** GitStatusController read paths: repo resolution, classification, and the
 * runner seam. All git behavior is scripted; no binary runs here. */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { GitStatusController, type GitRunner, type GitRunResult } from '../src/index.ts'

/** Script answers git probes in order; the last answer repeats. */
function runnerOf(answers: GitRunResult[]): GitRunner {
  let index = 0
  return async (cwd, args, signal) => {
    expect(cwd.length).toBeGreaterThan(0)
    expect(signal.aborted).toBe(false)
    const answer = answers[Math.min(index, answers.length - 1)]
    index += 1
    void args
    return answer!
  }
}

function repo(cwd: string): GitRunResult {
  return { code: 0, stdout: `${cwd}\n`, stderr: '' }
}

function instantiate(runGit: GitRunner): GitStatusController {
  const ctx = new Context()
  return new GitStatusController(ctx, {}, { runGit })
}

describe('GitStatusController', () => {
  it('rejects an empty directory as a bad request', async () => {
    const controller = instantiate(runnerOf([]))
    await expect(controller.read('', new AbortController().signal))
      .rejects.toThrow(/directory is required/)
  })

  it('answers isRepo false for a directory outside any repository', async () => {
    const controller = instantiate(runnerOf([{
      code: 128, stdout: '', stderr: 'fatal: not a git repository (or any parent up to mount point /)\n',
    }]))
    await expect(controller.read('C:/plain', new AbortController().signal))
      .resolves.toEqual({ isRepo: false, modified: 0, deleted: 0, untracked: 0 })
  })

  it('classifies a root-resolution failure with a message', async () => {
    const controller = instantiate(runnerOf([{
      code: 1, stdout: '', stderr: 'fatal: bad config\n',
    }]))
    await expect(controller.read('C:/work', new AbortController().signal))
      .rejects.toThrow(/bad config/)
  })

  it('parses the status read from the resolved root', async () => {
    const controller = instantiate(runnerOf([
      repo('C:/work/deepseek-harness'),
      { code: 0, stdout: '## main...origin/main [ahead 2]\n M a.ts\n?? b.ts\n', stderr: '' },
      { code: 2, stdout: '', stderr: 'fatal: no such remote origin\n' },
    ]))
    await expect(controller.read('C:/work/deepseek-harness', new AbortController().signal))
      .resolves.toEqual({
        isRepo: true,
        root: 'C:/work/deepseek-harness',
        repoName: 'deepseek-harness',
        branch: 'main',
        ahead: 2,
        behind: 0,
        modified: 1,
        deleted: 0,
        untracked: 1,
      })
  })

  it('attaches the parsed GitHub remote when origin points at GitHub', async () => {
    const controller = instantiate(runnerOf([
      repo('C:/work/deepseek-harness'),
      { code: 0, stdout: '## master\n', stderr: '' },
      { code: 0, stdout: 'https://github.com/deepseek-ai/deepseek-harness.git\n', stderr: '' },
    ]))
    await expect(controller.read('C:/work/deepseek-harness', new AbortController().signal))
      .resolves.toMatchObject({
        isRepo: true,
        branch: 'master',
        github: { owner: 'deepseek-ai', repo: 'deepseek-harness' },
      })
  })

  it('classifies a failed status read as a read failure', async () => {
    const controller = instantiate(runnerOf([
      repo('C:/work/repo'),
      { code: 1, stdout: '', stderr: 'fatal: index file corrupt\n' },
    ]))
    await expect(controller.read('C:/work/repo', new AbortController().signal))
      .rejects.toThrow(/index file corrupt/)
  })
})
