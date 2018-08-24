b-proxy
---

This is a proxy for http://dev.blurb.com
The goal is to proxy to local installations when available, and proxy to master when not.

It currently works with the following projects:
- blurby
- website
- ad-hoc
- blurb-dashboard-react
- metrics?

It also falls back to mock files so you can sometimes totally avoid needing a service running / setting up a db. If you need more control, consider [Charles](https://www.charlesproxy.com/)


## Initial setup

set up your /etc/hosts (all the dev.blurb.com stuff has to point to 127.0.0.1)
`sudo cp ./etc_hosts /etc/hosts`

add yourself to the `wheel` group (you need certain group permissions)
`sudo dscl . merge /Groups/wheel GroupMembership $(whoami)`

actually install nginx
`b-proxy install` (assumes you have homebrew installed)

add nginx to your mac firewall
`b-proxy fw`

### configuring sudo (optional)
...most commands `sudo` because it's binding to port 80, so it has to. If you get tired of typing a password all the time, check out this [cool article](https://www.garron.me/en/linux/visudo-command-sudoers-file-sudo-default-editor.html)


## Commands

### `b-proxy` / `b-proxy start`

Starts the proxy. This assumes you have to successfully installed it. It will fail if it can't connect to `http://master.eng.blurb.com` (though this is able to be modified)

### `b-proxy s` / `b-proxy stop`

Stops the proxy. http://dev.blurb.com is no longer available.

### `b-proxy r` / `b-proxy restart`

Restarts the proxy. You must run this after any configuration changes.

### `b-proxy l` / `b-proxy log`

Tails the logs. Use this to debug problems / see access logs.

_NOTE_: If it's too much output, edit `conf/nginx.conf` and change this line:
```
error_log /usr/local/var/log/nginx/error.log debug;
```
to this:
```
error_log /usr/local/var/log/nginx/error.log info;
```

### `b-proxy conf`

Prints your combined configuration. There are 2 configuration files, `conf/vars.conf` (the defaults) and `~/.b-proxy.conf` (user overrides). Don't edit the former unless you plan to conribute to this repo.

#### `b-proxy conf get <name>`

Prints the config value for the given name / service.
For example: with no conf changes, running `b-proxy conf get blurby` will output `3456`

#### `b-proxy conf set <name> <value>`

Sets an override value for a service name. Use this for custom environment settings.
For example: if you have blurby running on port 3000 (on your host computer, not the vagrant box), run `b-proxy conf set blurby 3000`

#### `b-proxy conf unset <name>`

Reverts your custom config back to the default for the given name.
For example: if you were running dashboard on port 3001 and decided you wanted your life to be easier like the rest of us, you could run `b-proxy conf unset dashboard` to revert back to the default.

With no name, this reverts everything back to the default.

#### Conf file values explained

The conf files have this format:
```
service_name=service_value
```
_service_name_ is one of a few choices, like `blurby`, `dashboard`, or `website`
_service_value_ is either 0 (off), 1 (on), or a number greater than one (on, port specified)

For example:
`blurby=3000` would mean `blurby` is _on_, and it's _port_ is set to 3000
`website=10000` would mean `website` is _on_, and it's port is set to 10000
`website=1` would mean `website` is _on_, but no port specified, so it serves from the filesystem
`buildkit=2345` would mean `buildkit` is _on_, and it's port is set to 2345. Buildkit doesn't run on a port, though, so the port is ignored.

##### Special cases

_website_ if 1, is linked to on-disk representation (at website/_site), otherwise proxies to port
_adhoc_ if 1, is linked to on-disk representation (at ad-hoc/_site), otherwise proxies to port
_buildkit_ if 1, maps paths for blurby, website, and ad-hoc to local build folder for buildkit at blurb-buildkit/build/dist

#### Default settings

See [conf/vars.conf](../conf/vars.conf)

### `b-proxy p` / `b-proxy port`

Print ports that should be open and their status

For example:
If `b-proxy conf get dashboard` prints 3000, and you don't have dashboard running, `b-proxy p` will print out
```
port 3000 [ not in use ] : dashboard
```
If you _do_ have dashboard running (`cdd dashboard; npm start`), it'll print out
```
port 3000 [     in use ] : dashboard
```

### `b-proxy fw`

Adds proxy to the allowed firewall list. You should only need to do this once, and you may not have to do it at all.

### `b-proxy include`

Rebuilds the include files (conf/*.include).
These files are generated from your environment so they can't be committed to the repo. The other commands will conditionally call this command, but it's possible that something in your environment changed and you need to rebuild them.


### `b-proxy install`

Installs nginx via homebrew, uninstalling first.

### `b-proxy uninstall`

Uninstalls nginx via homebrew

### `b-proxy path`

Prints the path to the nginx binary


### Mock files fallthrough

If a path naturally gets a 404, it will check `~/dev/mock-stuff/$uri` for a file before actually giving you a 404.

For example:
`http://dev.blurb.com/my-awesome-path` will first check blurby, dashboard, etc, then check these locations:
- `~/dev/mock-stuff/my-awesome-path`
- `~/dev/mock-stuff/my-awesome-path.html`
- `~/dev/mock-stuff/my-awesome-path.json`

This is true for all languages, so you can't get language specific responses this way.


### NOTE: proxy substitutions
This substitutes "master.eng.blurb.com" with "dev.blurb.com" and "services.master.eng.blurb.com" with "services.dev.blurb.com" on all requests (read everything). This means that your JS, any pages, any xml requests, etc. get this replacement. You may want to disable the proxy to verify your code is working properly.