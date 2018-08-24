const thePoint = `
check blurby, website, and ad-hoc for what buildkit / reactkit modules are used
`
const thePointTechnical = `
go through a list of folders and use git grep to find "data-component"
`
const wouldBeCoolIf = `
- possibly compare them with the buildkit artifact number to see what's out of date
- find out what public page they're on (harder with blurby, but possible, given the nginx redirects don't exist in website / adhoc)
`

const usage = `
buildkit-modules-used [-h] git_module_path[,git_module_path...]
  -h this help
  git_module_path path to folder to search
`

const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['help'],
  alias: {
    h: 'help'
  }
});

if (argv.help) {
  console.log(usage)
  process.exit();
}

const Promise = require('promise');
const flatten = require('flatten');
const unique = require('array-unique');
const spawn = require('child_process').spawn;
const path = require('path');

//=== functions ===
// const findAbsolutePathsToRepos = (cwd) => {
//   cwd = cwd || process.cwd();
  
//   const repoGlobs = flatten(['blurby', 'website', 'ad-hoc'].map((repoName) => {
//     // slashes are at the end so they only match directories
//     return [`${repoName}/`, `*/${repoName}/`]; //, `**/${repoName}/`];
//   }));
  
//   return new Promise((resolve, reject) => {
//     glob('{' + repoGlobs.join(',') + '}', {
//       cwd: cwd,
//       absolute: true,
//       ignore: [
//         'node_modules'
//       ]
//     }, (err, repoPaths) => {
//       if (err) return reject(err)
//         repoPaths = unique(repoPaths);
//         resolve(repoPaths);
//     })
//   });
// }
const getGitGrepResults = (repoPath) => {
  console.log(`git grepping ${repoPath}...`)
  return new Promise((resolve, reject) => {
    let results = [];

    const gitGrep = spawn('git', ['grep', '-e', 'data-controller'], {
      cwd: repoPath
    })
    
    gitGrep.on('exit', (code) => {
      if (code !== 0) {
        return reject(code);
      }
      resolve(results);
    })
    .on('error', reject);

    gitGrep.stdout.on('data', (data) => {
      console.log(results.length)
      results.push(data.toString());
    })
  
  });
}

const repoPaths = unique(argv._);
if (!repoPaths.length) {
  console.error('No paths given');
  process.exit();
}

Promise.all(repoPaths.map(getGitGrepResults))
.then((grepResults) => {
  var repoNameToResults = {};
  repoPaths.forEach((repoPath, i) => {
    const repoName = path.basename(repoPath);
    repoNameToResults[repoName] = grepResults[i];
  })
  return repoNameToResults;
})
.then((repoNameToGrepResults) => {
  Object.keys(repoNameToGrepResults).forEach((repoName) => {
    const results = repoNameToGrepResults[repoName];
    const filenameToMatches = {};
    results.forEach((result) => {
      const filename = result.match(/^[^:]+/)[0];
      const match = result.slice(filename.length);
      if (!filenameToMatches[filename]) {
        filenameToMatches[filename] = [];
      }
      filenameToMatches[filename].push(match);
    });
    console.log(`${repoName} => ${results.length} matches across ${Object.keys(filenameToMatches).length} files`);
    // Object.keys(filenameToMatches).forEach((filename) => {
    //   console.log(`  ${filename}`);
    // })
  })
  process.exit();
})