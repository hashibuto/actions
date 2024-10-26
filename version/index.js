const fs = require('node:fs');
const core = require('@actions/core');
const path = require('node:path');

const tomlKeySplitter = new RegExp(/^(\w+): *(.+)$/)
const sectionMatcher = new RegExp(/^\s*\[+([^\]]+)]+\s*$/)

async function action() {
  try {
    let workingDir = core.getInput('working-directory')
    if (workingDir == '') {
      workingDir = process.env.GITHUB_WORKSPACE
    }

    const filename = core.getInput('filename')
    const fullPath = path.normalize(path.join(workingDir, filename))

    if (!fs.existsSync(fullPath)) {
      throw new Error(`unable to locate version file ${fullPath}`)
    }

    let data = fs.readFileSync(fullPath)
    let dataString = data.toString('utf8')
    dataString = dataString.trim()

    const parts = fullPath.split(".")
    const extension = parts[parts.length - 1]
    let version = undefined

    if (extension === "json") {
      const jsonKey = core.getInput('json-key')
      if (jsonKey === '') {
        throw new Error("json-key was not specified with json file type")
      }

      const jsonKeyParts = jsonKey.split(".")
      let jsonBody = JSON.parse(dataString)
      for (let jsonKey of jsonKeyParts) {
        jsonBody = jsonBody[jsonKey]
        if (jsonBody === undefined) {
          throw new Error(`could not locate json sub-key: ${jsonKey}`)
        }
      }

      version = jsonBody.toString()
    } else if (extension === "toml") {
      let curSection = undefined
      const section = core.getInput('toml-section')
      if (section === '') {
        throw new Error("toml-section was not specified with toml file type")
      }
      const key = core.getInput('toml-key')
      if (key === '') {
        throw new Error("toml-key was not specified with toml file type")
      }

      const lines = dataString.split("\n")
      for (let line of lines) {
        if (curSection !== section) {
          const matches = line.matchAll(sectionMatcher)
          if (matches !== null) {
            curSection = matches[1].trim()
            continue
          }
        }

        const matches = line.matchAll(tomlKeySplitter)
        if (matches === null) {
          continue
        }

        if (matches[1].trim() === key) {
          version = matches[2].trim()
          break
        }
      }
    } else {
      // no known format, just return the first line
      const lines = dataString.split("\n")
      version = lines[0].trim()
    }

    if (version === undefined) {
      throw new Error(`unable to determine version from file ${fullPath}`)
    }

    const commitSha = process.env.GITHUB_SHA
    const shortSha = commitSha.substring(0, 10)
    const branch = process.env.GITHUB_REF

    core.setOutput('version', version)
    core.setOutput('version-commit', `${version}.dev.${shortSha}`)
    core.setOutput('version-branch', `${version}.dev.${branch}`)
  } catch (error) {
    core.setFailed(error.message);
  }
}

action();