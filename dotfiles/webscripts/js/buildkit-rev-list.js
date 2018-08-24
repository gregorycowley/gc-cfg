const path = require('path');
const devRoot = path.resolve(__dirname, '../..');
const defaultBuildkitPath = path.join(devRoot, 'blurb-buildkit');

const Promise = require('promise');
const buildkitArtifact = require('./lib/buildkit-artifact');
const jenkinsArtifact = require('./lib/jenkins-artifact');

const {
  artifactFrom, 
  artifactTo, 
  buildkitPath
} = buildkitArtifact.parseArgs(`
${buildkitArtifact.generateUsage(`buildkit-rev-list`)}

Outputs commit range between from and to
`);

const [fromArtifactName, fromArtifactNumber] = buildkitArtifact.resolveArtifact(artifactFrom);
const [toArtifactName, toArtifactNumber] = buildkitArtifact.resolveArtifact(artifactTo);

Promise.all([
  jenkinsArtifact.getArtifactData(fromArtifactNumber, fromArtifactName),
  jenkinsArtifact.getArtifactData(toArtifactNumber, fromArtifactName)
])
.then(([fromBranchData, toBranchData]) => {
  console.log(`${fromBranchData.SHA1}..${toBranchData.SHA1}`);
})
.catch(buildkitArtifact.handleErrors)