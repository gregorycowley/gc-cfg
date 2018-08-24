require("gcowley/hs")
require("gcowley/appManager")
require("community/config-alt/tabletools")
require("hs.ipc")

-- hs.alert.show("Greg's config is loaded")
print("Greg's config is loaded")

function launchApplicationWatcher ()

end


function doit ()

  local logger = hs.logger.new("gcspaces", 5) -- -> logger
  -- Open FF

  logger.d("Doing it")

  --- hs.application.get(hint) -> hs.application object
  -- local ff = hs.application.find("FirefoxDeveloperEdition"):name() -- -> hs.application object(s)
  -- local ff = hs.application.open('org.mozilla.firefoxdeveloperedition', 5, true) -- -> hs.application object
  -- local ff = hs.application.launchOrFocusByBundleID('org.mozilla.firefoxdeveloperedition')
  logger:d(ff)

  local apps = hs.application.runningApplications()
  for i = 1, #apps do
    if apps[i]:title() ~= "Hammerspoon" then
      --watchApp(apps[i], true)
      logger:d(apps[i])
    end
  end

end

--
-- Function:        gRunningApps
--
-- Description:     This function lists all applications running
--                  and visible from the AppBar.
--
function gRunningApps( )
    apps = hs.application.runningApplications()
    for index, app in pairs( apps ) do
        if app:kind() == 1 then
            wins = app:visibleWindows()
        	size = 0
        	for Index, win in pairs( wins ) do
        		size = size + 1
        	end
        	if size >= 1 then
                print( app:title() )
            end
        end
	end
end

--- gosexec(command[, with_user_env]) -> output, status, type, rc
--- Function
--- Runs a shell command and returns stdout as a string (may include a trailing newline), followed by true or nil indicating if the command completed successfully, the exit type ("exit" or "signal"), and the result code.
---
---  If `with_user_env` is `true`, then invoke the user's default shell as an interactive login shell in which to execute the provided command in order to make sure their setup files are properly evaluated so extra path and environment variables can be set.  This is not done, if `with_user_env` is `false` or not provided, as it does add some overhead and is not always strictly necessary.
function gosexec(command, user_env)
    local f
    if user_env then
        f = io.popen(os.getenv("SHELL").." -l -i -c \""..command.."\"", 'r')
    else
        f = io.popen(command, 'r')
    end
    local s = f:read('*a')
    local status, exit_type, rc = f:close()
    return s, status, exit_type, rc
end

logger = hs.logger.new("gAppWatch", 5) -- -> logger

function gWatchApps()
  appsWatcher = hs.application.watcher.new(handleGlobalAppEvent)
  appsWatcher:start()
end

function handleGlobalAppEvent(name, event, app)
  if event == hs.application.watcher.launched then
    logger.d("App Launched:: "..app:name())
  elseif event == hs.application.watcher.terminated then
    print(table.show(name))
    logger.d("App Closed:: "..name)
  end
end
