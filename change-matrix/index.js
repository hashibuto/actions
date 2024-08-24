const core = require('@actions/core');
const github = require('@actions/github');
const glob = require('@actions/glob');
const path = require('node:path');

async function action() {
  try {
    const baseDirectory = core.getInput('base-directory')
    const workingDir = process.env.GITHUB_WORKSPACE
    const searchDirectory = path.normalize(path.join(workingDir, baseDirectory))

    console.log(`searching directory ${searchDirectory}`)
    const includePatterns = core.getInput("include")
    console.log(`using include patterns: ${includePatterns}`)

    const patterns = includePatterns.split(",")
    let fqPatterns = []
    for (let p in patterns) {
      fqPatterns = [...fqPatterns, path.join(searchDirectory, p)]
    }
    const globber = await glob.create(fqPatterns.join('\n'))
    const files = await globber.glob()

    console.log(fqPatterns)

    for (let f in files) {
      console.log(f)
    }


  } catch (error) {
    core.setFailed(error.message);
  }
}

action()
