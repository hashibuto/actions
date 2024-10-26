const core = require('@actions/core');
const github = require('@actions/github');

async function action() {
  try {
    let parentBranch = core.getInput('parent-branch')
    if (parentBranch == '') {
      parentBranch = github.context.payload.repository.default_branch
    }

    const baseTag = core.getInput('base-tag')
    const createVersionTag = core.getBooleanInput('create-version-tag')
    const createMajorVersionTag = core.getBooleanInput('create-major-version-tag')
    const updateBaseTag = core.getBooleanInput('update-base-tag')
    const githubToken = core.getInput('github-token')
    const octokit = github.getOctokit(githubToken)

    try {
      await octokit.rest.checks.listForRef({
        owner:  github.context.payload.repository.owner.login,
        repo: github.context.payload.repository.name,
        ref: `refs/heads/${parentBranch}`,
      })
    } catch (error) {
      console.error(error)
      throw new Error(`unable to locate branch named "${parentBranch}"`)
    }

    const branch = process.env.GITHUB_REF.replace("refs/heads/", "")

    if (branch === parentBranch) {
      console.log('currently on the parent branch, applying tags')
      // if the current branch is the parent branch, we should create the specified tags
      if (createVersionTag === true) {
        const versionTag = process.env.VERSION_TAG
        if (versionTag === undefined) {
          throw new Error("no version tag found in the environment, did you run the hashibuto/actions/version action?")
        }

        await octokit.rest.git.createRef({
          owner:  github.context.payload.repository.owner.login,
          repo: github.context.payload.repository.name,
          ref: `refs/tags/${versionTag}`,
          sha: process.env.GITHUB_SHA,
        })
        console.log(`generated version tag ${versionTag} against ${process.env.GITHUB_SHA}`)
      }

      if (createMajorVersionTag === true) {
        const versionTag = process.env.VERSION_TAG_MAJOR
        if (versionTag === undefined) {
          throw new Error("no major version tag found in the environment, did you run the hashibuto/actions/version action?")
        }

        await octokit.rest.git.createRef({
          owner:  github.context.payload.repository.owner.login,
          repo: github.context.payload.repository.name,
          ref: `refs/tags/${versionTag}`,
          sha: process.env.GITHUB_SHA,
        })

        console.log(`generated major version tag ${versionTag} against ${process.env.GITHUB_SHA}`)
      }

      if (updateBaseTag === true) {
        const versionTag = baseTag
        if (versionTag === undefined) {
          throw new Error("no base tag found in the environment, did you run the hashibuto/actions/change-matrix action?")
        }

        await octokit.rest.git.createRef({
          owner:  github.context.payload.repository.owner.login,
          repo: github.context.payload.repository.name,
          ref: `refs/tags/${versionTag}`,
          sha: process.env.GITHUB_SHA,
        })

        console.log(`update base tag ${versionTag} against ${process.env.GITHUB_SHA}`)
      }
    } else {
      console.log('not on the parent branch, skipping tagging')
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

action();