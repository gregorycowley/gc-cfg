const usage = `
b-jenkins-nvm [-h][-u username][-p password][-v version][--update version][name]
  -h    this help
  -u    username (found in credentials at http://jenkins.blurb.com/me/configure)
  -p    password (found in credentials at http://jenkins.blurb.com/me/configure)
  -v    minimum version to operate on
  --update  version to update to (does not work without -v)
  name      name of job (if not specified, gets all)

Lists all the nvm versions of jobs specified.
username and password can be environment variables JENKINS_USERNAME and JENKINS_PASSWORD, respectively
`

const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['help'],
  alias: {
    help: 'h',
    username: 'u',
    password: 'p',
    version: 'v'
  }
});

if (argv.help) {
  console.log(usage);
  process.exit();
}

if ('update' in argv && ! ('version' in argv)) {
  console.error("Will not update without specifiying version");
  process.exit(1);
}
const updateVersion = argv.update || false;
const jobName = argv._[0];

const cheerio = require('cheerio');
const cheerioOptions = {
  xmlMode: true
};
const jenkinsapi = require('jenkins-api');
const ProgressBar = require('progress');
const minimatch = require('minimatch');

const username = argv.username || process.env.JENKINS_USERNAME;
const password = argv.password || process.env.JENKINS_PASSWORD;
if (!username || !password) {
  console.error("Username and password required")
  process.exit(1);
}
const jenkins = jenkinsapi.init(`http://${username}:${password}@jenkins.blurb.com`);
const jobNameRe = jobName && /\*/.test(jobName) ? minimatch.makeRe(jobName) : null;

/*

<project>
  <actions/>
  <description/>
  <keepDependencies>false</keepDependencies>
  <properties>...</properties>
  <scm class="hudson.plugins.git.GitSCM" plugin="git@2.3.5">...</scm>
  <assignedNode>rvm</assignedNode>
  <canRoam>false</canRoam>
  <disabled>false</disabled>
  <blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding>
  <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>
  <jdk>(Default)</jdk>
  <triggers>...</triggers>
  <concurrentBuild>false</concurrentBuild>
  <builders>...</builders>
  <publishers>...</publishers>
  <buildWrappers>...</buildWrappers>
</project>

<buildWrappers>
  <ruby-proxy-object>
    <ruby-object ruby-class="Jenkins::Tasks::BuildWrapperProxy" pluginid="nvm">
      <pluginid pluginid="nvm" ruby-class="String">nvm</pluginid>
      <object ruby-class="NvmWrapper" pluginid="nvm">
        <version pluginid="nvm" ruby-class="String">v6.9.1</version>
        <nvm__path pluginid="nvm" ruby-class="String">/data/nvm/nvm.sh</nvm__path>
      </object>
    </ruby-object>
  </ruby-proxy-object>
</buildWrappers>
*/


const getConfig = (name, errors=0) => 
  new Promise((resolve, reject) => {
    jenkins.get_config_xml(name, function(err, data) {
      if (err) {
        return reject(new Error(data ? data.body : err));
      }
      return resolve(data);
    });
  })
  .catch(e => {
    if (errors <= 2) {
      return getConfig(name, errors+1);
    }
    throw e;
  })
const handleConfError = (name) => e => {
  if (e.code == 'CONF_ERROR') {
    e.message = `[${name}] ${e.message}`
  }
  throw e;
}

const confFindNvm = $conf => {
  const $nvm = $conf('buildWrappers object[pluginid=nvm]');
  if (!$nvm.length) {
    const e = new Error("No nvm in conf");
    e.code = 'CONF_ERROR';
    throw e;
  }
  if ($nvm.length > 1) {
    const e = new Error(`More than one nvm plugin`);
    e.code = 'CONF_ERROR';
    throw e;
  }
  return $nvm;
}
const updateNvmVersion = (name, version) => 
  new Promise((resolve, reject) => {
    jenkins.update_job(name,
      xml => {
        const $ = cheerio.load(xml, cheerioOptions);
        const $nvm = confFindNvm($);
        $nvm.find('version').text(version);
        return $.xml();
      },
      (err, data) => {
        if (err) return reject(data ? data.body : err);
        resolve(data);
      }
    )
  })
  .catch(handleConfError(name));

const getNvmVersion = (name) => getConfig(name)
  .then(xml => cheerio.load(xml, cheerioOptions))
  .then(confFindNvm)
  .then($nvm => $nvm.find('version').text())
  .catch(handleConfError(name));

const getNames = () => new Promise((resolve, reject) => {
  if (jobName && !jobNameRe) return resolve([jobName]);
  jenkins.all_jobs(function (err, data) {
    if (err) return reject(data.body);
    resolve(data.map(job => job.name));
  })
})
const padText = (text, spaces=10) => {
  text = String(text);
  while (text.length < spaces) {
    text = " " + text;
  }
  return text;
}
const versionToNumber = (version) => {
  if (!version) return -Infinity;
  return parseFloat(
    String(version)
    .replace(/\s/g, '')
    .replace(/^v/, '')
  );
}
const run = () => getNames().then(names => {
  const fetchBar = new ProgressBar('Fetching :bar', {total: names.length})
  return Promise.all(
    names.map(name => 
      getNvmVersion(name)
      .then((version) => {
        fetchBar.tick();
        return {
          name, version
        }
      })
      .catch(e => {
        fetchBar.tick();
        if (e.code !== 'CONF_ERROR') throw e;
        return {
          name, version: null
        };
      })
    )
  ).then(namesAndVersions => {
    console.log();
    
    const validNamesAndVersions = namesAndVersions
      .filter(nv =>
        argv.version ? versionToNumber(nv.version) >= parseFloat(argv.version) : true)
      .filter(nv => {
        if (!jobNameRe) return;
        return jobNameRe.test(nv.name);
      });
    
    if (!updateVersion) return Promise.resolve(validNamesAndVersions);

    const updateBar = new ProgressBar('Updating :bar', {total: validNamesAndVersions.length});
    return Promise.all(validNamesAndVersions.map(nv => 
      updateNvmVersion(nv.name, updateVersion)
      .then(() => {
        updateBar.tick();
        return Object.assign({}, nv, {updateSuccess: true})
      })
      .catch(e => {
        updateBar.tick();
        if (e.code !== 'CONF_ERROR') throw e;
        return Object.assign({}, nv, {updateError: e});
      })
    ))
  })
  .then(validNamesAndVersions => {
    console.log();

    const messages = ["\nComplete"].concat(
      validNamesAndVersions
      .sort((a, b) => {
        const av = versionToNumber(a.version);
        const bv = versionToNumber(b.version);
        if (av === bv) {
          if (a.name === b.name) return 0;
          return (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1
        }
        return (av > bv) ? 1 : -1;
      })
      .map(nv =>{
        const updateText = nv.updateSuccess ? 'updated' : (nv.updateError ? 'conf error' : '');
        return `${padText(nv.version ? nv.version : "none")}${updateText ? ' : ' + padText(updateText) : ''} : ${nv.name}`
      })
    );
    console.log(messages.join("\n"))
  })
})


process.on('unhandledRejection', function onError(err) {
  throw err;
});
run();