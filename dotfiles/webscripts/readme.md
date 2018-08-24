web-scripts
---

<!-- MarkdownTOC autoanchor="true" autolink="true" bracket="round" -->

- [Installation instructions](#installation-instructions)
- [Node and it's many versions](#node-and-its-many-versions)
- [The Scripts](#the-scripts)
  - [`b-feature-bit`](#b-feature-bit)
  - [`b-git-hooks`](#b-git-hooks)
  - [`b-mov-to-gif`](#b-mov-to-gif)
  - [`b-package-lock-resolve`](#b-package-lock-resolve)
  - [`b-proxy`](#b-proxy)
  - [`b-sass-colors`](#b-sass-colors)
  - [`b-update`](#b-update)
  - [`b-update-reactkit`](#b-update-reactkit)
  - [`ad-hoc-link-buildkit`](#ad-hoc-link-buildkit)
  - [`blurby-link-buildkit`](#blurby-link-buildkit)
  - [`blurby-ssh`](#blurby-ssh)
  - [`blurby-start`](#blurby-start)
  - [`buildkit-changelog`](#buildkit-changelog)
  - [`buildkit-rev-list`](#buildkit-rev-list)
  - [`website-link-buildkit`](#website-link-buildkit)

<!-- /MarkdownTOC -->


<a name="installation-instructions"></a>
## Installation instructions

_Assuming your blurb repo folder is at ~/dev_

```
cd ~/dev
git clone git@github.com:blurb/web-scripts
```

Add this to your `.profile` (if using bash) or `.zshrc` (if using zsh)
```
BLURB_DEV_ROOT="$HOME/dev" # this is where all your blurb repos are
source "$BLURB_DEV_ROOT/web-scripts/profile-scripts" # this lets you use cdd to quickly navigate relative to BLURB_DEV_ROOT
PATH="$PATH:$BLURB_DEV_ROOT/web-scripts" # this adds all the commands to your PATH so you can call them from anywhere
```


<a name="node-and-its-many-versions"></a>
## Node and it's many versions

These use node >= 7.4.0. I recommend using [nvm](https://github.com/creationix/nvm) to manage node versions. There are instructions on that page.


<a name="the-scripts"></a>
## The Scripts

These are all written for bash, but the complicated ones tend to use node (have >= 7.4.0)
Make sure to `npm install` to have the node scripts work.

- `cdd` _in profile-scripts_ auto completes to your main repo directory, which is whatever folder `web-scripts` is in. So `cdd ad-hoc` would take you to `~/repos/ad-hoc` (if that's where your repos are)

- `b-feature-bit` is a cli interface to the feature bit api
- `b-git-hooks` adds git hooks from your main dev directory to all your repos
- `b-mov-to-gif` is for converting a `mov` file to `gif`. I usually use this to turn a screenshare movie from quicktime into a gif i can put in a PR. You need to `brew install ffmpeg gifsicle` for this to work
- `b-proxy` controls an nginx server that proxies things from dev.blurb.com to local instances / master (see the b-proxy section below for more)
- `b-update` updates this repo
- `b-update-reactkit` installs reactkit in the proper way

- `ad-hoc-link-buildkit` links buildkit assets to ad-hoc
- `blurby-link-buildkit` links your dev buildkit assets folder to blurby's buildkit asset folder over vagrant
- `blurby-ssh` ssh's into blurby vagrant box as the app user
- `blurby-start` starts the blurby vagrant box and the server inside
- `buildkit-changelog` generates a changelog of buildkit artifacts
- `buildkit-rev-list` shows the commit range between buildkit artifacts
- `website-link-buildkit` links buildkit assets to website


<a name="b-feature-bit"></a>
### `b-feature-bit`

Get info on all feature bits (in master)
`b-feature-bit`

Get info on feature bit (in master)
`b-feature-bit web-example-feature-bit`

Get info on feature bit in integration
`b-feature-bit -e int web-example-feature-bit`

Get info on feature bit in production
`b-feature-bit -e prod web-example-feature-bit`

Make a new feature bit (in master)
`b-feature-bit -m post -d "My new feature bit" web-example-feature-bit`

Update feature bit to be enabled (in master)
`b-feature-bit -m put --enable web-example-feature-bit`

Update feature bit to be disabled (in master)
`b-feature-bit -m put --disable web-example-feature-bit`

Delete feature bit (in master)
`b-feature-bit -m delete web-example-feature-bit`

Update description to have user / date (in master)
`b-feature-bit web-example-feature-bit update_description

Add context id to feature bit (in master)
`b-feature-bit web-example-feature-bit add_id dev_user

Remove context id from feature bit (in master)
`b-feature-bit web-example-feature-bit rm_id dev_user

<a name="b-git-hooks"></a>
### `b-git-hooks`

Let's say your dev folder looks like this:
```
/Users/smccollum/dev
├── ad-hoc
├── blurb-buildkit
├── blurb-dashboard-react
├── blurby
├── git-hooks-prepare-commit-msg
├── mock-stuff
├── reactkit
├── web-scripts
└── website
```
When you run `b-git-hooks`, it will copy `git-hooks-prepare-commit-msg` to the following locations:
- ad-hoc/.git/hooks/prepare-commit-msg
- blurb-buildkit/.git/hooks/prepare-commit-msg
- blurb-dashboard-react/.git/hooks/prepare-commit-msg
- blurby/.git/hooks/prepare-commit-msg
- reactkit/.git/hooks/prepare-commit-msg
- website/.git/hooks/prepare-commit-msg

It skips `mock-stuff` because it isn't a git repo, and `web-scripts` (reason intentionally left blank).

If you had a `git-hooks-whatever` it would copy to `<repo>/.git/hooks/whatever` and so on and so forth.


<a name="b-mov-to-gif"></a>
### `b-mov-to-gif`

This turns a .mov file into a .gif. The reason this is a script is because screen recording is done through quicktime and saves to a mov format, but gifs can be embedded into PRs.

Example:
- open "Quicktime Player"
- go to File -> New Screen Recording
- click the record button
- record...
- click the stop icon in the top right
- save to ~/Documents/example.mov (CMD + S)
- run `b-mov-to-gif ~/Documents/example.mov`
- you should now have `example.mov.gif`

<a name="b-package-lock-resolve"></a>
### `b-package-lock-resolve`

This resolves a package-lock merge issue. If you `git pull` and package-lock is in conflict, run this (but resolve package.json first)

Basically, it's this: https://github.com/yarnpkg/yarn/issues/1776#issuecomment-269539948

What the script does is checkout the package-lock.json from the remote, then run `npm install` again, which SHOULD generate the same thing you had (with small exceptions).

<a name="b-proxy"></a>
### `b-proxy`

This is a complicated command with a bunch of subcommands. See the page on it to understand better, but basically:
- `b-proxy install` to initially install it
- `b-proxy start` to start it (run every time your computer reboots)
- `b-proxy restart` to restart it, which you have to do every time you change a configuration

The goal of the proxy is to let you use http://dev.blurb.com to see local versions of things proxied to master when you're not running the service. So, http://dev.blurb.com would go to your local version of website's homepage, unless you're not running website, in which case it would proxy to `http://master.eng.blurb.com`. (and so on and so forth)

For more info, go to [docs/b-proxy.md](docs/b-proxy.md)

<a name="b-sass-colors"></a>
### `b-sass-colors`

Takes a file (or files) and converts the hex color values to variable names in reactkit
Example:
```
b-sass-colors Thing.scss
```
If you just want to convert everything that's __probably__ right, do this
```
b-sass-colors -fb Thing.scss
```
Look at the help file to understand what's going on, if you're curious `b-sass-colors -h`

<a name="b-update"></a>
### `b-update`

git pulls most recent web-scripts, runs `npm install`, and possibly does some migration work. Use this to update web-scripts unless you're developing it

<a name="b-update-reactkit"></a>
### `b-update-reactkit`

changes the npm save prefix to ~ instead of ^ so reactkit is saved while ignoring minor updates. Works on current directory.
Example: `cdd blurb-dashboard-react; b-update-reactkit` will install the latest version of reactkit to blurb-dashbaord-react.

<a name="ad-hoc-link-buildkit"></a>
### `ad-hoc-link-buildkit`

Links ad-hoc/_site/pages/ad-hoc-assets/bower/buildkit/assets -> blurb-buildkit/build/dist/assets for every language built.
_WARNING_: If you make a change to ad-hoc, it'll rebuild the entire _site folder, so you'll have to run the command again if you want to re-link buildkit. This is only for testing buildkit on real pages.
Example (each line is new tab):
- `cdd ad-hoc; npm run build;`
- `cdd blurb-buildkit; npm run start-light;`
- `ad-hoc-link-buildkit`
Now change buildkit and it's reflected on the ad-hoc pages.


<a name="blurby-link-buildkit"></a>
### `blurby-link-buildkit`

Links blurby/public/components/buildkit/assets -> blurb-buildkit/build/dist/assets
Example (each line is new tab):
- `blurby-start`
- `cdd blurb-buildkit; npm run start-light;`
- `blurby-link-buildkit`

<a name="blurby-ssh"></a>
### `blurby-ssh`

ssh's into blurby's vagrant box. Similar to doing the following:
- `cdd blurby; vagrant up; vagrant ssh`;

You can call it with the `-s` option to choose who to ssh as.
`blurby-ssh -s app` (ssh as blurbapp. can start blurby)
`blurby-ssh -s vagrant` (ssh as vagrant. can use sudo)

<a name="blurby-start"></a>
### `blurby-start`

ssh's into blurby's vagrant box and starts server. Similar to doing the following:
- `cdd blurby; vagrant up; vagrant ssh`;
- `sudo su - blurbapp`
- `cd /vagrant; bundle check || bundle install; bundle exec thin start`

<a name="buildkit-changelog"></a>
### `buildkit-changelog`

`buildkit-changelog 1420 1425` Will output a processed version of `git log` between the commits that started the jenkins jobs to make artifacts http://jenkins.blurb.com/job/Buildkit-Artifact/1420/ and http://jenkins.blurb.com/job/Buildkit-Artifact/1425/

`buildkit-changelog 1420 bugfix/3` Will output a processed version of `git log` between the commits that started the jenkins jobs to make artifacts http://jenkins.blurb.com/job/Buildkit-Artifact/1420/ and http://jenkins.blurb.com/job/Buildkit-BugFix-Artifact/3/

<a name="buildkit-rev-list"></a>
### `buildkit-rev-list`

`buildkit-rev-list 1420 1425` outputs this => `b308f2b0cc8b58b20e8670d7b295613c19b8880c..80f4d331ee714c3c62fea268652bb51431f3c152`
...which is the git commit range between artifact 1420 and 1425 (resolves the same way as changelog), so you can do `git log $(buildkit-rev-list 1420 1425)` to see the log between two artifacts

<a name="website-link-buildkit"></a>
### `website-link-buildkit`

Links website/_site/pages/website-assets/bower/buildkit/assets -> blurb-buildkit/build/dist/assets for every language built.
_WARNING_: If you make a change to website, it'll rebuild the entire _site folder, so you'll have to run the command again if you want to re-link buildkit. This is only for testing buildkit on real pages.
Example (each line is new tab):
- `cdd website; npm run build;`
- `cdd blurb-buildkit; npm run start-light;`
- `website-link-buildkit`
Now change buildkit and it's reflected on the website pages.

