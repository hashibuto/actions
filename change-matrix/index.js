const core = require('@actions/core');
const github = require('@actions/github');
const path = require('node:path')

try {
  const baseDirectory = core.getInput('base-directory')
  const searchDirectory = path.normalize(path.join(__dirname, baseDirectory))

  console.log(`searching directory ${searchDirectory}`)
} catch (error) {
  core.setFailed(error.message);
}