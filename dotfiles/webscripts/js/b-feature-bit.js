const DESCRIPTION_MAX_LENGTH = 256;

let env = 'master';
let method = 'get';
const usage = `
b-feature-bit [-h][-e <master|int|prod|all>][-m <get|post|put|delete>][--enable][--disable][-d <description>][-u username] [featureId] [specialCommand]
  -h this help
  -e environment (defaults to ${env}). Set to all to do master, int, and prod
  -m method. defaults to ${method}
  --enable  enable feature
  --disable disable feature
  -d description of feature
  -u username that will be used. Defaults to running \`whoami\`
  featureId the featureId to do something with
  specialCommand
    ud | update_description) will first get the feature referenced, read it's description, then add meta information
    add_id) adds given id to context ids
    rm_id)  removes given id from context ids

  for api documentation, go to http://services.master.eng.blurb.com/feature-service/jsondoc-ui.html, then put in
    http://services.master.eng.blurb.com/feature-service/jsondoc

Pattern matching: in get mode, featureId can work like a glob,
  so b-feature-bit "web-*" will get all feature bits that match that pattern
`

const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['help', 'enable', 'disable', 'envAll'],
  alias: {
    help: 'h',
    env: 'e',
    envAll: 'a',
    method: 'm',
    description: 'd',
    username: 'u'
  }
});

if (argv.help) {
  console.log(usage);
  process.exit();
}

if (argv.env) {
  env = argv.env;
}
if (argv.envAll) {
  env = 'all';
}
var environments = [env];
if (env == 'all') {
  environments = ['master', 'int', 'prod'];
}

if (argv.method) {
  method = argv.method;
}

const [featureId, specialCommand, ...extraArgs] = argv._;
let featureEnabled = null;
if (argv.enable) {
  featureEnabled = true;
} else if (argv.disable) {
  featureEnabled = false;
}
const whoami = argv.username || String(require('child_process').execSync('whoami')).replace(/\n/g, '');
let featureDescription = null
const featureDescriptionMeta = `(${whoami})`;
if (argv.description) {
  featureDescription = argv.description;
  if (featureDescription.length > DESCRIPTION_MAX_LENGTH) {
    console.error(`Your pre-altered description is too long, by ${featureDescription.length - DESCRIPTION_MAX_LENGTH} characters`);
    process.exit(1);
  }
  // now, i'd like to get the description and add their name and date, then ask if it's named
  // correctly and they're good with it
  featureDescription += ` ${featureDescriptionMeta}`

  if (featureDescription.length > DESCRIPTION_MAX_LENGTH) {
    console.error(`Your post-altered description (shown below) is too long, by ${featureDescription.length - DESCRIPTION_MAX_LENGTH} characters`);
    console.error(featureDescription);
    process.exit(1);
  }
}

const hosts = {
  master: 'services.master.eng.blurb.com',
  int: 'services.integration.eng.blurb.com',
  prod: 'services.blurb.com'
}

const getBasePath = (env) => {
  const host = hosts[env];
  if (!host) {
    throw new Error(`"${env}" is not a valid environment`);
  }
  return `http://${host}/feature-service`;
}
const validateHosts = () => {
  var errors = [];
  environments.forEach((env) => {
    try {
      getBasePath(env);
    } catch (e) {
      errors.push(e);
    }
  })
  if (!errors.length) return;
  errors.forEach((e) => {
    console.error(e);
  })
  process.exit(1);
}
validateHosts();

const request = require('request');
const Promise = require('promise');
const minimatch = require('minimatch');
const prompt = require('prompt');


const getFeature = (env, options) => {
  options = options || {};
  const featureId = options.featureId;
  const method = options.method.toUpperCase();
  
  let uri = getBasePath(env) + '/admin/feature';
  const isFeatureGlob = featureId && !!featureId.match(/\*/);
  if (!isFeatureGlob && featureId) {
    uri += `/${featureId}`;
  }
  return new Promise((resolve, reject) => {
    request({
      uri: uri,
      method: method,
      json: true
    }, (error, response, body) => {
      if (error) {
        return reject(error);
      }
      if (isFeatureGlob) {
        const featureIdRe = minimatch.makeRe(featureId);
        return resolve(body.filter(feature => {
          return featureIdRe.test(feature.featureId);
        }))
      }
      return resolve(body);
    })
  });
}
const putFeature = (env, options) => {
  options = options || {};
  const featureId = options.featureId;
  const method = options.method.toUpperCase();
  const featureEnabled = options.featureEnabled;
  const featureDescription = options.featureDescription;

  const uri = getBasePath(env) + '/admin/feature' + ((featureId && method !== 'POST') ? `/${featureId}` : '');
  const body = {
    enabled: !!featureEnabled,
    description: featureDescription
  };
  if (method === 'POST') body.featureId = featureId;

  const setEnabled = () => new Promise((resolve, reject) => {
    if (method === "PUT" && (featureEnabled === undefined || featureEnabled === null)) {
      // in this scenario (updating an existing feature but not having set enabled),
      //  the API will default to enabled: false, which is...pretty silly,
      // so I'll make a separate call to figure out what it is now
      getFeature(env, {featureId, method: 'get'}).then(feature => {
        body.enabled = feature.enabled;
      }).then(resolve).catch(reject);
      return;
    }
    resolve();
  })

  
  return setEnabled().then(() => new Promise((resolve, reject) => {
    request({
      uri: uri,
      method: method,
      json: true,
      body: body
    }, (error, response, body) => {
      if (error) {
        return reject(error);
      }
      return resolve(body);
    })
  }));
}

const actionDefault = (env) => {
  let fn = /put|post/i.test(method)
    ? putFeature
    : getFeature;
  return fn(env, {featureId, method, featureEnabled, featureDescription});
}
const actionUpdateDescription = (env) => {
  if (!featureId) {
    return Promise.reject('featureId is required');
  }
  if (featureDescription) {
    return Promise.reject(`featureDescription can't be used with update_description`)
  }
  return getFeature(env, {featureId, method: 'get'})
  .then(features => ((features instanceof Array) ? features : [features]).map(feature => {
    let oldDescription = feature.description;
    let newDescription = feature.description;
    let index = null;
    while (index !== -1) {
      if (index !== null) newDescription = newDescription.slice(0, index);
      if (index === 0) throw new Error('description index is 0, which makes very little sense.');
      index = newDescription.lastIndexOf(featureDescriptionMeta);
    }
    newDescription = newDescription.replace(/\s+$/, '') + ` ${featureDescriptionMeta}`;
    return {
      id: feature.featureId,
      enabled: feature.enabled,
      oldDescription,
      newDescription
    };
  }))
  .then(featureUpdateBodies => new Promise((resolve, reject) => {
    console.log();
    featureUpdateBodies.forEach((featureUpdate) => {
      console.log(featureUpdate.id, 'old', featureUpdate.oldDescription);
      console.log(featureUpdate.id, 'new', featureUpdate.newDescription);
    })
    prompt.start();
    prompt.get([{
      name: 'confirm',
      description: `Go ahead and update? y/n`,
      default: 'y',
      pattern: /[yn]/i
    }], (error, result) => {
      if (error) return reject(error);
      if (!/y/i.test(result.confirm)) {
        return reject('Confirmation denied')
      }
      return resolve(featureUpdateBodies);
    })
  }))
  .then(featureUpdateBodies => Promise.all(featureUpdateBodies.map(featureUpdate => 
    putFeature(env, {
      featureId: featureUpdate.id,
      method: 'put',
      featureEnabled: featureUpdate.enabled,
      featureDescription: featureUpdate.newDescription
    })
  )));
}

const actionAddId = (env, id) => new Promise((resolve, reject) => {
  const uri = getBasePath(env) + `/admin/feature/${featureId}/context`;
  const body = {
    contextId: id
  };
  request({
    uri,
    method: 'post',
    json: true,
    body
  }, (error, response, body) => {
    if (error) return reject(error);
    resolve(body);
  })
});
const actionRemoveId = (env, id) => new Promise((resolve, reject) => {
  const uri = getBasePath(env) + `/admin/feature/${featureId}/context/${id}`;
  request({
    uri,
    method: 'delete'
  }, (error, response, body) => {
    if (error) return reject(error);
    resolve(body);
  })
});

let action = actionDefault;
if (/ud|update_description/.test(specialCommand)) {
  action = actionUpdateDescription;
} else if (/add_id/.test(specialCommand)) {
  action = actionAddId;
} else if (/rm_id/.test(specialCommand)) {
  action = actionRemoveId;
}
var errors = [];
Promise.all(environments.map((env) => {
  action(env, ...extraArgs).then((body) => {
    console.log(`ENVIRONMENT: ${env}`)
    console.log(body);
  })
  .catch((error) => {
    console.error(error);
    errors.push(error);
  });
}))
.then(() => {
  if (errors.length) {
    process.exit(1);
  }
})
