const core = require('@actions/core');
const github = require('@actions/github');
const glob = require('@actions/glob');
const exec = require('@actions/exec');
const path = require('node:path');
const fs = require('node:fs');

async function ensureBaseTag(octokit, tagName) {
  const resp = await octokit.rest.checks.listForRef({
    owner:  github.context.payload.repository.owner.login,
    repo: github.context.payload.repository.name,
    ref: `tags/${tagName}`,
  })
  console.log(resp)
}

async function action() {
  try {
    const baseDirectory = core.getInput('base-directory')
    const workingDir = process.env.GITHUB_WORKSPACE
    const searchDirectory = path.normalize(path.join(workingDir, baseDirectory))
    const mustContain = core.getInput('must-contain')
    const githubToken = core.getInput('github-token')
    const octokit = github.getOctokit(githubToken)
    const baseTag = core.getInput('base-tag')

    let parentBranch = core.getInput('parent-branch')
    if (parentBranch == '') {
      parentBranch = github.context.payload.repository.default_branch
    }
    if (!parentBranch.startsWith('origin/')) {
      parentBranch = `origin/${parentBranch}`
    }

    await ensureBaseTag(octokit, baseTag)

    console.log(`parent branch: ${parentBranch}`)
    console.log(`searching directory ${searchDirectory}`)
    const includePatterns = core.getInput("include")
    console.log(`using include patterns: ${includePatterns}`)
    const excludePatterns = core.getInput("exclude")
    if (excludePatterns === '') {
      console.log('no exclude patterns specified')
    } else {
      console.log(`using exclude patterns: ${excludePatterns}`)
    }

    let patterns = includePatterns.split(',')
    let fqPatterns = []
    for (let p of patterns) {
      fqPatterns = [...fqPatterns, path.join(searchDirectory, p)]
    }

    if (excludePatterns !== '') {
      let exPatterns = excludePatterns.split(',')
      for (let exPattern of exPatterns) {
        fqPatterns = [...fqPatterns, '!' + path.join(searchDirectory, exPattern)]
      }
    }

    const globber = await glob.create(fqPatterns.join('\n'))
    const files = await globber.glob()
    const checkDirs = {}

    for (let f of files) {
      if (path.dirname(f) != workingDir) {
        continue
      }
      const stat = fs.statSync(f)
      if (!stat.isDirectory()) {
        continue
      }

      if (mustContain !== '') {
        const required = path.join(f, mustContain)
        if (!fs.existsSync(required)) {
          continue
        }
      }

      checkDirs[f] = true
    }

    await exec.exec('git', ['diff', '--name-only', 'tag', github.context.sha])

  } catch (error) {
    core.setFailed(error.message);
  }
}

action()
