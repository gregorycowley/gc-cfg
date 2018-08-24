const request = require('request-promise-native');
const {RequestError, StatusCodeError, TransformError} = require('request-promise-core/lib/errors')


const getBranchData = (data) => {
  const lastBuiltRevisionAction = data.actions.filter((action) => !!action.lastBuiltRevision)[0];
  const branchData = lastBuiltRevisionAction.lastBuiltRevision.branch[0];
  return {
    SHA1: branchData.SHA1,
    name: branchData.name
  };
}

const getJenkinsData = (artifactNumber, artifactName) => {
  const url = `http://jenkins.blurb.com/job/${artifactName}/${artifactNumber}/api/json`;
  return request(url, {
    json: true,
    timeout: 500
  })
  .catch((error) => {
    if (error instanceof RequestError || error instanceof StatusCodeError || error instanceof TransformError) {
      const url = error.options.uri;
      throw new Error(`request error (${error.name}) url: ${url} message: ${error.message}`);
    }
    throw error;
  });
}

const getArtifactData = (artifactNumber, artifactName) => {
  return getJenkinsData(artifactNumber, artifactName)
  .then(data => Object.assign({},
      getBranchData(data),
      { resolvedArtifactName: data.fullDisplayName }));
}

module.exports = {
  getArtifactData,
  getJenkinsData,
  getBranchData
}