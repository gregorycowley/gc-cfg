const fs = require('fs');
const path = require('path');
const kitArtifact = require('./kit-artifact');
const devRoot = path.resolve(__dirname, '../../..');
const defaultBuildkitPath = path.join(devRoot, 'blurb-buildkit');

const defaultArtifactName = "Buildkit-Artifact"
const ARTIFACT_NAME_ALIAS = {
  "bugfix": "Buildkit-BugFix-Artifact"
};

const generateUsage = (name) => `
${name} [-h] <from> [<to>]
 -h - this help
 -p - buildkitPath. this should be where buildkit is locally (defaults to ${defaultBuildkitPath})
 from - the buildkit artifact number to start comparing from
 to - the buildkit artifact number to end comparing (optional, defaults to latest)

The artifact identifiers (from and to) are processed in the form
  [jenkinsJobName/]<jobNumber> (e.g. "${defaultArtifactName}/1400")
  If there is no jenkinsJobName, it defaults to "${defaultArtifactName}".
` + Object.keys(ARTIFACT_NAME_ALIAS).map(alias=>
`  ${alias} is an alias for ${ARTIFACT_NAME_ALIAS[alias]}`).join("\n");

const parseArgs = (usage) => {
  const argv = require('minimist')(process.argv.slice(2), {
    boolean: ['help'],
    alias: {
      h: 'help',
      p: 'buildkitPath'
    }
  })
  const parsedArgs = kitArtifact.verifyArgs({
    usage, argv,
    packageName: 'blurb-buildkit',
    defaultPath: defaultBuildkitPath
  });
  return {
    artifactFrom: parsedArgs.from,
    artifactTo: parsedArgs.to,
    buildkitPath: parsedArgs.path
  }
}

const resolveArtifact = (artifact) => kitArtifact.resolve(artifact, defaultArtifactName, ARTIFACT_NAME_ALIAS);
const handleErrors = kitArtifact.handleErrors;

module.exports = {
  resolveArtifact,
  generateUsage,
  parseArgs,
  handleErrors
}