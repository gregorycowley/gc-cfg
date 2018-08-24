const path = require('path');
const devRoot = path.resolve(__dirname, '../..');

const Promise = require('promise');
const reactkitArtifact = require('./lib/reactkit-artifact');
const jenkinsArtifact = require('./lib/jenkins-artifact');

const {
  artifactFrom, 
  artifactTo, 
  reactkitPath
} = reactkitArtifact.parseArgs(`
${reactkitArtifact.generateUsage(`reactkit-rev-list`)}

Outputs commit range between from and to
`);

const [fromArtifactName, fromArtifactNumber] = reactkitArtifact.resolveArtifact(artifactFrom);
const [toArtifactName, toArtifactNumber] = reactkitArtifact.resolveArtifact(artifactTo);

Promise.all([
  jenkinsArtifact.getArtifactData(fromArtifactNumber, fromArtifactName),
  jenkinsArtifact.getArtifactData(toArtifactNumber, fromArtifactName)
])
.then(([fromBranchData, toBranchData]) => {
  console.log(`from ${fromBranchData.resolvedArtifactName} to ${toBranchData.resolvedArtifactName}`);
  console.log(`${fromBranchData.SHA1}..${toBranchData.SHA1}`);
})
.catch(reactkitArtifact.handleErrors)