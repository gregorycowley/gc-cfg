const fs = require('fs');
const findupSync = require('findup-sync');
const path = require('path');
const {RequestError, StatusCodeError, TransformError} = require('request-promise-core/lib/errors')

const verifyArgs = ({usage, packageName, defaultPath, argv}) => {
  if (argv.help) {
    console.log(usage);
    process.exit();
  }
  let artifactFrom = argv._[0];
  const artifactTo = argv._[1] || 'lastBuild';

  if (!artifactFrom && packageName.match(/buildkit/)) {
    // try to guess from current directory. for buildkit, this is in bower.
    const currentBowerPath = findupSync('bower.json');
    if (currentBowerPath) {
      try {
        const bower = require(currentBowerPath);
        const bowerDeps = bower.dependencies;
        const buildkitCurrent = bowerDeps.buildkit;
        const buildkitFromMatch = buildkitCurrent.match(/\/Buildkit-Artifact\/(\d+)\//);
        if (buildkitFromMatch) {
          artifactFrom = buildkitFromMatch[1];
        }
      } catch (e) {
        console.error("Couldn't guess from via bower", e);
        process.exit(1);
      }
    }
  }
  if (!artifactFrom) {
    console.error('from is required');
    process.exit(1);
  }
  const kitPath = (argv.kitPath)
    ? path.resolve(process.cwd(), argv.kitPath)
    : defaultPath;

  const packageJsonPath = path.join(kitPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`${kitPath} doesn't point to ${packageName}. No package.json found.`);
    process.exit(1);
  }
  const packageJson = require(packageJsonPath);
  if (packageJson.name !== packageName) {
    console.error(`${kitPath} doesn't point to ${packageName}. Name in package.json is ${packageJson.name}`);
    process.exit(1);
  }
  return {
    from: artifactFrom,
    to: artifactTo,
    path: kitPath
  }
}

const resolveArtifact = (artifact, defaultArtifactName, nameAlias={}) => {
  const artifactParts = String(artifact).split('/');
  if (artifactParts.length == 1) {
    if (!defaultArtifactName) {
      throw new Error("resolveArtifact -> No defaultArtifactName, can't figure out ANYTHING");
    }
    artifactParts.unshift(defaultArtifactName);
  }
  let [artifactName, artifactNumber] = artifactParts;
  artifactName = nameAlias[artifactName] || defaultArtifactName;
  return [artifactName, artifactNumber];
}

const handleErrors = (errors) => {
  if (!(errors instanceof Array)) {
    errors = [errors];
  }
  errors.forEach((error) => {
    if (error instanceof RequestError || error instanceof StatusCodeError || error instanceof TransformError) {
      const url = error.options.uri;
      console.error(error.message, error.name, url);
    } else {
      console.error(error);
    }
  })
  process.exit(1);
}

module.exports = {
  verifyArgs,
  resolve: resolveArtifact,
  handleErrors
}