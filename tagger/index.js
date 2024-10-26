const core = require('@actions/core');
const github = require('@actions/github');

async function action() {
  try {
    const mainBranch = core.getInput('main-branch')
    const githubToken = core.getInput('github-token')
    const octokit = github.getOctokit(githubToken)

    try {
      await octokit.rest.checks.listForRef({
        owner:  github.context.payload.repository.owner.login,
        repo: github.context.payload.repository.name,
        ref: `refs/heads/${mainBranch}`,
      })
    } catch (error) {
      console.error(error)
      throw new Error(`unable to locate branch named "${mainBranch}"`)
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

action();