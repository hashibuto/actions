const core = require('@actions/core');
const github = require('@actions/github');
const glob = require('@actions/glob');
const path = require('node:path');

try {
  const baseDirectory = core.getInput('base-directory')
  const workingDir = process.env.GITHUB_WORKSPACE
  const searchDirectory = path.normalize(path.join(workingDir, baseDirectory))

  console.log(`searching directory ${searchDirectory}`)
  const includePatterns = core.getInput("include")
  console.log(`using include patterns: ${includePatterns}`)

  const patterns = includePatterns.split(",")
  const globber = await glob.create(patterns.join('\n'))
  const files = await globber.glob()

  for (let f in files) {
    console.log(f)
  }


} catch (error) {
  core.setFailed(error.message);
}