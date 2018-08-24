
spaces = require("community._asm.undocumented.spaces")
tabletools = require("community.config-alt")


--
-- My Additions:
--

-- List all the available Desktop Spaces.

-- Is space empty?

-- Create a new space and give it a name.

function availableWindowsForSpace ()
	local myspace = spaces.activeSpace() -- Returns an ID
	print (myspace)
	local allmywindows = spaces.allWindowsForSpace(myspace) -- Returns an windowObjectArray
	print( table.show(allmywindows) )
	print (allmywindows[1])
end

function availableScreens ()

end

function availableSpaces ( screenID )

end

function openFF ()
	local logger = hs.logger.new("gcspaces", 5) -- -> logger
	-- Open FF

	--- hs.application.get(hint) -> hs.application object
	-- local ff = hs.application.find("FirefoxDeveloperEdition"):name() -- -> hs.application object(s)
	-- local ff = hs.application.open('org.mozilla.firefoxdeveloperedition', 5, true) -- -> hs.application object
	local ff = hs.application.launchOrFocusByBundleID('org.mozilla.firefoxdeveloperedition')
	logger:d(ff)




-- 	> hs.application.find('firefox')
-- hs.window: FirefoxDeveloperEdition (0x7f8b905d6c98)	hs.application: Finder (0x7f8b8b6458b8)

-- > hs.application'firefox'
-- hs.window: FirefoxDeveloperEdition (0x7f8b8c092ff8)	hs.application: Finder (0x7f8b905f7e68)

-- > hs.application'chrome':name()
-- Google Chrome

-- > hs.application'firefoxdeveloperedition':name()
-- [string "return hs.application'firefoxdeveloperedition..."]:1: attempt to call a nil value (method 'name')
-- stack traceback:
-- 	[string "return hs.application'firefoxdeveloperedition..."]:1: in main chunk
-- 	[C]: in function 'xpcall'
-- 	...app/Contents/Resources/extensions/hs/_coresetup/init.lua:321: in function <...app/Contents/Resources/extensions/hs/_coresetup/init.lua:301>

-- > hs.application'org.mozilla.firefoxdeveloperedition':name()
-- [string "return hs.application'org.mozilla.firefoxdeve..."]:1: attempt to index a nil value
-- stack traceback:
-- 	[string "return hs.application'org.mozilla.firefoxdeve..."]:1: in main chunk
-- 	[C]: in function 'xpcall'
-- 	...app/Contents/Resources/extensions/hs/_coresetup/init.lua:321: in function <...app/Contents/Resources/extensions/hs/_coresetup/init.lua:301>

-- > hs.application'org.mozilla.firefoxdeveloperedition'


	-- Create Space
	local newspace = spaces.createSpace()
	logger:d(newspace)


	-- Put FF in space
	local ffWindows = ff:allWindows()
	logger:d(ffWindows)
	logger:d(hs.inspect(ffWindows[1]))

	spaces.moveWindowToSpace(ffWindows[1]:id(), newspace) -- -> spaceID

	spaces.changeToSpace(newspace, true) -- -> spacesIDArray

	-- Make Fullscreen

	-- hs.application:focusedWindow() -> hs.window object or nil
	-- hs.application.launchOrFocusByBundleID(bundleID) -> boolean
	-- hs.application:mainWindow() -> hs.window object or nil
	-- hs.window:maximize([duration]) -> hs.window object
	-- hs.window:application() -> app or nil
	-- hs.window:becomeMain() -> window
	-- hs.window:moveToUnit(unitrect[, duration]) -> hs.window object


	-- Open URL
	-- Open Developer Tools



end

function watchFF ()
	local logger = hs.logger.new("gcspaces", 5)
	local ff = hs.application.applicationsForBundleID('org.mozilla.firefoxdeveloperedition')
	logger:d(ff)
end

local events = hs.uielement.watcher

watchers = {}

function init()
  appsWatcher = hs.application.watcher.new(handleGlobalAppEvent)
  appsWatcher:start()

  -- Watch any apps that already exist
  local apps = hs.application.runningApplications()
  for i = 1, #apps do
    if apps[i]:title() ~= "Hammerspoon" then
      watchApp(apps[i], true)
    end
  end
end

function handleGlobalAppEvent(name, event, app)
  if     event == hs.application.watcher.launched then
    watchApp(app)
  elseif event == hs.application.watcher.terminated then
    -- Clean up
    local appWatcher = watchers[app:pid()]
    if appWatcher then
      appWatcher.watcher:stop()
      for id, watcher in pairs(appWatcher.windows) do
        watcher:stop()
      end
      watchers[app:pid()] = nil
    end
  end
end

function watchApp(app, initializing)
  if watchers[app:pid()] then return end

  local watcher = app:newWatcher(handleAppEvent)
  watchers[app:pid()] = {watcher = watcher, windows = {}}

  watcher:start({events.windowCreated, events.focusedWindowChanged})

  -- Watch any windows that already exist
  for i, window in pairs(app:allWindows()) do
    watchWindow(window, initializing)
  end
end

function handleAppEvent(element, event)
  if event == events.windowCreated then
    watchWindow(element)
  elseif event == events.focusedWindowChanged then
    -- Handle window change
  end
end

function watchWindow(win, initializing)
  local appWindows = watchers[win:application():pid()].windows
  if win:isStandard() and not appWindows[win:id()] then
    local watcher = win:newWatcher(handleWindowEvent, {pid=win:pid(), id=win:id()})
    appWindows[win:id()] = watcher

    watcher:start({events.elementDestroyed, events.windowResized, events.windowMoved})

    if not initializing then
      hs.alert.show('window created: '..win:id()..' with title: '..win:title())
    end
  end
end

function handleWindowEvent(win, event, watcher, info)
  if event == events.elementDestroyed then
    watcher:stop()
    watchers[info.pid].windows[info.id] = nil
  else
    -- Handle other events...
  end
  -- hs.alert.show('window event '..event..' on '..info.id)
end

-- init()





-- Get the application name from a hex number
