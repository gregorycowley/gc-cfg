//
// TODO:
//   pull in JIRA link / title
//
// GOAL FORMAT:
//
// WEB-1234: <title of jira ticket>
//  - [commit] @smccollum <title>
//  - [commit] @tsoo <title>
//  - [commit] @emadison <title>
// WEB-1235: <title of jira ticket>
//  - [commit] @someoneelse@notblurb.com <title>
// [NO-JIRA_whatever else blah blah blah]
//  - [commit] @patrick <title>
//
const path = require('path');
const fs = require('fs');
const Promise = require('promise');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const jenkinsArtifact = require('./lib/jenkins-artifact');
const buildkitArtifact = require('./lib/buildkit-artifact');

// utility
const strip = (string) => string.replace(/^\s+/, '').replace(/\s+$/, '');

// constants
const diffFormatSeparator = '::_dfs_::'
const diffLineSeparator = '======DFS++++++DFS======';

// input
const {
  artifactFrom, 
  artifactTo, 
  buildkitPath
} = buildkitArtifact.parseArgs(`
${buildkitArtifact.generateUsage(`buildkit-changelog`)}

Shows the git commits between buildkit artifacts.
`);

let resolvedFromArtifact;
let resolvedToArtifact;

const getDiff = (fromBranchData, toBranchData, parentResolve, parentReject) => new Promise((resolve, reject) => {
  if (parentResolve) resolve = parentResolve;
  if (parentReject) reject = parentReject;

  /*
  The placeholders (for format) are:
   o   %H: commit hash
   o   %h: abbreviated commit hash
   o   %T: tree hash
   o   %t: abbreviated tree hash
   o   %P: parent hashes
   o   %p: abbreviated parent hashes
   o   %an: author name
   o   %aN: author name (respecting .mailmap, see git-shortlog(1) or
       git-blame(1))
   o   %ae: author email
   o   %aE: author email (respecting .mailmap, see git-shortlog(1) or
       git-blame(1))
   o   %ad: author date (format respects --date= option)
   o   %aD: author date, RFC2822 style
   o   %ar: author date, relative
   o   %at: author date, UNIX timestamp
   o   %ai: author date, ISO 8601-like format
   o   %aI: author date, strict ISO 8601 format
   o   %cn: committer name
   o   %cN: committer name (respecting .mailmap, see git-shortlog(1)
       or git-blame(1))
   o   %ce: committer email
   o   %cE: committer email (respecting .mailmap, see git-shortlog(1)
       or git-blame(1))
   o   %cd: committer date (format respects --date= option)
   o   %cD: committer date, RFC2822 style
   o   %cr: committer date, relative
   o   %ct: committer date, UNIX timestamp
   o   %ci: committer date, ISO 8601-like format
   o   %cI: committer date, strict ISO 8601 format
   o   %d: ref names, like the --decorate option of git-log(1)
   o   %D: ref names without the " (", ")" wrapping.
   o   %e: encoding
   o   %s: subject
   o   %f: sanitized subject line, suitable for a filename
   o   %b: body
   o   %B: raw body (unwrapped subject and body)
   o   %N: commit notes
   o   %GG: raw verification message from GPG for a signed commit
   o   %G?: show "G" for a good (valid) signature, "B" for a bad
       signature, "U" for a good signature with unknown validity and
       "N" for no signature
   o   %GS: show the name of the signer for a signed commit
   o   %GK: show the key used to sign a signed commit
   o   %gD: reflog selector, e.g., refs/stash@{1} or refs/stash@{2
       minutes ago}; the format follows the rules described for the -g
       option. The portion before the @ is the refname as given on the
       command line (so git log -g refs/heads/master would yield
       refs/heads/master@{0}).
   o   %gd: shortened reflog selector; same as %gD, but the refname
       portion is shortened for human readability (so
       refs/heads/master becomes just master).
   o   %gn: reflog identity name
   o   %gN: reflog identity name (respecting .mailmap, see git-
       shortlog(1) or git-blame(1))
   o   %ge: reflog identity email
   o   %gE: reflog identity email (respecting .mailmap, see git-
       shortlog(1) or git-blame(1))
   o   %gs: reflog subject
   o   %Cred: switch color to red
   o   %Cgreen: switch color to green
   o   %Cblue: switch color to blue
   o   %Creset: reset color
   o   %C(...): color specification, as described in color.branch.*
       config option; adding auto, at the beginning will emit color
       only when colors are enabled for log output (by color.diff,
       color.ui, or --color, and respecting the auto settings of the
       former if we are going to a terminal).  auto alone (i.e.
       %C(auto)) will turn on auto coloring on the next placeholders
       until the color is switched again.
   o   %m: left, right or boundary mark
   o   %n: newline
   o   %%: a raw %
   o   %x00: print a byte from a hex code
   o   %w([<w>[,<i1>[,<i2>]]]): switch line wrapping, like the -w
       option of git-shortlog(1).
   o   %<(<N>[,trunc|ltrunc|mtrunc]): make the next placeholder take
       at least N columns, padding spaces on the right if necessary.
       Optionally truncate at the beginning (ltrunc), the middle
       (mtrunc) or the end (trunc) if the output is longer than N
       o   %<|(<N>): make the next placeholder take at least until Nth
       columns, padding spaces on the right if necessary
   o   %>(<N>), %>|(<N>): similar to %<(<N>), %<|(<N>) respectively,
       but padding spaces on the left
   o   %>>(<N>), %>>|(<N>): similar to %>(<N>), %>|(<N>) respectively,
       except that if the next placeholder takes more spaces than
       given and there are spaces on its left, use those spaces
   o   %><(<N>), %><|(<N>): similar to % <(<N>), %<|(<N>)
       respectively, but padding both sides (i.e. the text is
       centered)

   Note
   Some placeholders may depend on other options given to the revision
   traversal engine. For example, the %g* reflog options will insert
   an empty string unless we are traversing reflog entries (e.g., by
   git log -g). The %d and %D placeholders will use the "short"
   decoration format if --decorate was not already provided on the
   command line.
  */
  const format = [
    '%s','%h', '%ae', '%b'
  ].join(diffFormatSeparator) + diffLineSeparator;
  
  const options = {cwd: buildkitPath};

  const getIdAndName = (branchData) => {
    const id = branchData.SHA1;
    const name = branchData.name.replace(/^[a-zA-Z]+\//, ''); // remove the remote identifier
    return [id, name];
  }

  const [fromCommit, fromBranchName] = getIdAndName(fromBranchData);
  const [toCommit, toBranchName] = getIdAndName(toBranchData);
  
  exec(`git log --pretty=format:${format} ${fromCommit}..${toCommit}`, options, (error, stdout, stderr) => {
    if (!error) return resolve(stdout);

    if (stderr.match(/invalid revision range/i)) {
      console.log('...doing git fetch');

      const branchNames = [fromBranchName];
      if (toBranchName !== fromBranchName) {
        branchNames.push(toBranchName);
      }
      Promise.all(branchNames.map((branchName) => new Promise((resolve, reject) => {
        exec(`git fetch git@github.com:blurb/blurb-buildkit.git ${branchName}`, options, (error, stdout, stderr) => {
          if (error) return reject(stderr);
          resolve();
        })
      })))
      .then(() => {
        console.log('...done with git fetch')
        return getDiff(fromBranchData, toBranchData, resolve, reject);
      })
      .catch(reject);
    } else {
      reject(stderr);
    }
  })
});

const [fromArtifactName, fromArtifactNumber] = buildkitArtifact.resolveArtifact(artifactFrom);
const [toArtifactName, toArtifactNumber] = buildkitArtifact.resolveArtifact(artifactTo);

Promise.all([
  jenkinsArtifact.getArtifactData(fromArtifactNumber, fromArtifactName),
  jenkinsArtifact.getArtifactData(toArtifactNumber, toArtifactName)
])
.then(([fromBranchData, toBranchData]) => {
  resolvedFromArtifact = fromBranchData.resolvedArtifactName;
  resolvedToArtifact = toBranchData.resolvedArtifactName;
  return getDiff(fromBranchData, toBranchData);
})
.then((diff) => {
  let lastJiraNumber;
  let lines = [];

  const insertSubjectLine = (subject, commitHash, email) => {
    // with no commit hash, its one of the weird squash and merge ones, and everything's in the body anyway, which is handled separately
    if (!commitHash) {
      return;
    }
    subject = strip(subject);
    if (!subject) {
      return;
    }

    let committerName = (email)
      ? '@' + email.replace(/@.+/, '')
      : '';

    let subjectDescription = `${committerName} ${subject}`;
    
    // sometimes the subject has a * in it
    subject = subject.replace(/^\s*\*\s*/, '');

    // can look like:
    // [WEB-1234] whatever
    // WEB-1234 whatever
    // [WEB-1234_whatever] extra stuff
    let jiraNumberMatch = subject
      .match(/^\[?([A-Z]{3}-[0-9]+)/);

    let jiraNumber = jiraNumberMatch
      ? jiraNumberMatch[1]
      : null;

    if (jiraNumber) {
      let contentsInBracesMatch = subject.match(/^\[(.+?)\]/);
      let jiraDescriptionOffset = contentsInBracesMatch
        ? contentsInBracesMatch[0].length
        : jiraNumber.length;
      let jiraDescription = subject.slice(jiraDescriptionOffset);
      
      // the jira could look like this -> " whatever i want to say"
      //   or this -> ": some cool boys"
      jiraDescription = jiraDescription.replace(/^[\s:]+/, '');

      // there might have been important stuff inside the braces
      let jiraShortDescription = '';
      if (contentsInBracesMatch) {
        jiraShortDescription = strip(
          contentsInBracesMatch[1].slice(jiraNumber.length)
          .replace(/^[_-]/, '')
          .replace('_', ' ')
        )
      }
      if (jiraShortDescription) {
        jiraDescription = `(${jiraShortDescription}) ${jiraDescription}`
      }
      if (jiraNumber !== lastJiraNumber) {
        // make a header for the jiras
        lines.push(`============ ${jiraNumber}`)
      }
      jiraDescription = '- ' + jiraDescription
      subjectDescription = `+ ${committerName} ${jiraDescription}`;
    }

    lastJiraNumber = jiraNumber;
    
    // some merge commits don't have a commitHash. They seem to...sometimes...have a tree / parent hash though
    let hashDescription = `[ ${commitHash} ]`;
    if (!commitHash) {
      hashDescription = `[ ________ ]`;
    }
    lines.push(`${hashDescription} ${subjectDescription}`);
  }

  const diffLines = diff.split(diffLineSeparator);
  diffLines.forEach((diffLine) => {
    diffLine = strip(diffLine)
    if (!diffLine) return;
    let [subject, commitHash, email, body] = diffLine.split(diffFormatSeparator);
    
    // filter out pull requests
    if (subject.match(/Merge pull request/)) {
      return;
    }

    if (body) {
      body.split("\n").forEach((bodyLine) => {
        insertSubjectLine(bodyLine, commitHash || '________', email)
      })
    } else {
      insertSubjectLine(subject, commitHash, email)
    }
  });

  console.log(`Comparing ${resolvedFromArtifact} with ${resolvedToArtifact}`);
  console.log(lines.join("\n"));
})
.catch(buildkitArtifact.handleErrors)