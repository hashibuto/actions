const core = require('@actions/core');
const github = require('@actions/github');
const glob = require('@actions/glob');
const path = require('node:path');
const fs = require('node:fs')

async function action() {
  try {
    const baseDirectory = core.getInput('base-directory')
    const workingDir = process.env.GITHUB_WORKSPACE
    const searchDirectory = path.normalize(path.join(workingDir, baseDirectory))
    const mustContain = core.getInput('mustContain')

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

      console.log(f)
    }


  } catch (error) {
    core.setFailed(error.message);
  }
}

action()
