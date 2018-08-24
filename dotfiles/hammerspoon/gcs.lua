require("alfred")

local workApplications = { 'Airmail','Franz','Messages','Google Chrome','iTerm', 'Sublime Text', 'NotePlan'}
local workApplicationWatcher;

-- 2018-05-03 16:30:29: watching: loginwindow pid: 66578
-- 2018-05-03 16:30:29: watching: talagent pid: 66629
-- 2018-05-03 16:30:29: watching: SystemUIServer pid: 66630
-- 2018-05-03 16:30:29: watching: Dock pid: 66628
-- 2018-05-03 16:30:29: watching: Finder pid: 66631
-- 2018-05-03 16:30:29: watching: com.apple.dock.extra pid: 66657
-- 2018-05-03 16:30:29: watching: Notification Center pid: 66661
-- 2018-05-03 16:30:29: watching: Spotlight pid: 66667
-- 2018-05-03 16:30:29: watching: Setapp Finder Integration pid: 66669
-- 2018-05-03 16:30:29: watching: Dropbox Finder Integration pid: 66670
-- 2018-05-03 16:30:29: watching: Alfred 3 pid: 66680
-- 2018-05-03 16:30:29: watching: Paste Helper pid: 66682
-- 2018-05-03 16:30:29: watching: Shimo pid: 66683
-- 2018-05-03 16:30:29: watching: Dropbox pid: 66687
-- 2018-05-03 16:30:29: watching: CoreLocationAgent pid: 66701
-- 2018-05-03 16:30:29: watching: ViewBridgeAuxiliary pid: 66734
-- 2018-05-03 16:30:29: watching: imklaunchagent pid: 66747
-- 2018-05-03 16:30:29: watching: AirPlayUIAgent pid: 66753
-- 2018-05-03 16:30:29: watching: iStatMenusAgent pid: 66750
-- 2018-05-03 16:30:29: watching: GlobalProtect pid: 66749
-- 2018-05-03 16:30:29: watching: Bartender 3 pid: 66772
-- 2018-05-03 16:30:29: watching: SnippetsLab pid: 66773
-- 2018-05-03 16:30:29: watching: Mosaic pid: 66777
-- 2018-05-03 16:30:29: watching: iStat Menus Status pid: 66756
-- 2018-05-03 16:30:29: watching: Dropbox Activity Provider pid: 66797
-- 2018-05-03 16:30:29: watching: Paste pid: 66800
-- 2018-05-03 16:30:29: watching: Wi-Fi pid: 66709
-- 2018-05-03 16:30:29: watching: Setapp pid: 66697
-- 2018-05-03 16:30:29: watching: nbagent pid: 66755
-- 2018-05-03 16:30:29: watching: LaterAgent pid: 66843
-- 2018-05-03 16:30:29: watching: Photos Agent pid: 66712
-- 2018-05-03 16:30:29: watching: Dropbox Finder Integration pid: 74188
-- 2018-05-03 16:30:29: watching: QuickLookUIService pid: 83574
-- 2018-05-03 16:30:29: watching: CalNCService pid: 66693
-- 2018-05-03 16:30:29: watching: Setapp Finder Integration pid: 84247
-- 2018-05-03 16:30:29: watching: Google Drive File Stream pid: 86734
-- 2018-05-03 16:30:29: watching: UserEventAgent pid: 66609
-- 2018-05-03 16:30:29: watching: CoreServicesUIAgent pid: 90247
-- 2018-05-03 16:30:29: watching: Google Drive File Stream pid: 91554
-- 2018-05-03 16:30:29: watching: com.apple.CoreSimulator.CoreSimulatorService pid: 91801
-- 2018-05-03 16:30:29: watching: universalAccessAuthWarn pid: 95097
-- 2018-05-03 16:30:29: watching: DashlaneAgent pid: 95096
-- 2018-05-03 16:30:29: watching: storeuid pid: 95570
-- 2018-05-03 16:30:29: watching: Secrets Helper pid: 95612



-- 2018-05-03 16:36:33: watching: Sublime Text pid: 95986
-- 2018-05-03 16:36:33: watching: Google Chrome pid: 96119
-- 2018-05-03 16:36:33: watching: iTerm2 pid: 96161
-- 2018-05-03 16:36:33: watching: grunt pid: 96969
-- 2018-05-03 16:36:33: watching: NotePlan pid: 97026
-- 2018-05-03 16:36:33: watching: Franz pid: 97046
-- 2018-05-03 16:36:33: watching: System Events pid: 97051
-- 2018-05-03 16:36:33: watching: FolderActionsDispatcher pid: 97052
-- 2018-05-03 16:36:33: watching: Messages pid: 97081
-- 2018-05-03 16:36:33: watching: Airmail pid: 97084


hs.hotkey.bind({"cmd", "alt", "ctrl"}, "H", function()
  hs.notify.new({title="Hammerspoon", informativeText="Setting home layout"}):send()
  local homeMonitor = "LG ULTRAWIDE"
  local windowLayout = {
        {"PhpStorm", nil, homeMonitor, {x=0, y=0, w=0.6, h=1},    nil, nil},
        {"Charles", nil, homeMonitor, {x=0.6, y=0.6, w=0.4, h=0.4},   nil, nil},
        {"Safari", nil, homeMonitor, {x=0.6, y=0, w=0.4, h=0.6}, nil, nil},        
    }
    hs.layout.apply(windowLayout)
end)



--
-- Try to setup the workplace workflow
--
hs.hotkey.bind({"cmd", "alt", "ctrl"}, "W", function()
	
	hs.notify.new({title="Hammerspoon", informativeText="Starting work applications"}):send()

	--
	-- Discover which apps are needed (not launched or visible)
	--
	local neededApps = {}
	for key, value in pairs(workApplications) do
		local app = hs.application.find(value);
		if app == nil then
			table.insert(neededApps,value)
		else
			local windows = app:allWindows();
			for s, t in pairs(windows) do
				t:raise()
			end	
		end	
	end	

	
	if #neededApps == 0 then
		doWorkLayout()
	else
		workApplicationWatcher = hs.application.watcher.new(appLaunched)
		workApplicationWatcher:start()

		for key, value in pairs(neededApps) do			
			hs.application.launchOrFocus(value)
		end	

	end

end)


-- function callbackWindows(windows) end
-- function callbackNoWindows() 
--   if hs.application.find('AppName') then print('AppName is still running')
--   else print('AppName has been closed') end
-- end
-- hs.window.filter.new('AppName'):notify(callbackWindows,callbackNoWindows)


--
-- Watcher for launching apps, when app launches are required
--
function appLaunched( appName, eventType, app )
	if eventType ~= hs.application.watcher.launched then
		return
	end		

	local launchCount = 0
	for key, value in pairs(workApplications) do
		if hs.application.find(value) ~= nil then	
			launchCount = launchCount + 1
		end	
	end	

	if launchCount == #workApplications then
		workApplicationWatcher:stop()
		doWorkLayout()
	end		
end


--
-- Success, set up the work layout
--
function doWorkLayout()

  -- { <userdata 1> -- hs.screen: Thunderbolt Display (0x60000024a4f8), 
  -- <userdata 2> -- hs.screen: Color LCD (0x600000248038) }
	local laptopMonitor = "Color LCD" 
	local lgMonitor = "Thunderbolt Display"

	local windowLayout = {
    {"Airmail", nil,        laptopMonitor,  {x=0,  y=0, w=0.5, h=0.5}, nil, nil},
    {"iTerm2", nil,         laptopMonitor,  {x=0.5,y=0, w=0.5, h=0.5}, nil, nil },
    {"Franz", nil,          laptopMonitor,  {x=0,  y=0, w=0.6, h=1}, nil, nil},
    {"Messages", nil,       laptopMonitor,  {x=0,  y=0.5, w=0.5, h=0.5}, nil, nil },
    {"Google Chrome",  nil, lgMonitor,      {x=0.5,  y=0, w=0.5, h=1}, nil, nil },
    {"Sublime Text", nil,   lgMonitor,      {x=0,  y=0, w=0.5, h=1}, nil, nil },
    {"NotePlan", nil,       lgMonitor,      {x=0.6,y=0, w=0.5, h=1}, nil, nil },
	}
	hs.notify.new({title="Hammerspoon", informativeText="Applying work layout"}):send()
	hs.layout.apply(windowLayout)
end	

local workApplications = { 'Airmail','Franz','Messages','Google Chrome','iTerm', 'Sublime Text', 'NotePlan'}





-- https://gist.github.com/tmandry/a5b1ab6d6ea012c1e8c5
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
      print('watching: '..apps[i]:title()..' pid: '..apps[i]:pid())
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
      -- hs.alert.show('window created: '..win:id()..' with title: '..win:title())
      print('window created: '..win:id()..' with title: '..win:title())
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
  print('window event '..event..' on '..info.id)
end



-- -------------------------------------------------

function outout ()
  print( "stuff stuff" )
  -- http://www.hammerspoon.org/docs/hs.screen.html

  -- > hs.inspect(hs.screen.screenPositions())
  -- {
  --   [<userdata 1> -- hs.screen: Color LCD (0x60c00045c6a8)] = {
  --     x = 0,
  --     y = 0
  --   },
  --   [<userdata 2> -- hs.screen: Thunderbolt Display (0x60c00025aed8)] = {
  --     x = 0,
  --     y = -1
  --   }
  -- }

  -- hs.inspect(hs.screen.mainScreen())
  -- <userdata 1> -- hs.screen: Thunderbolt Display (0x60000064dd68)

  -- > hs.inspect(hs.screen.primaryScreen())
  -- <userdata 1> -- hs.screen: Color LCD (0x604000259528)

  -- >   hs.screen.primaryScreen():frame()
  -- hs.geometry.rect(0.0,23.0,1440.0,877.0)

  -- >   hs.screen.primaryScreen():id()
  -- 2077750399

  -- >   hs.screen.primaryScreen():name()
  -- Color LCD

  -- >   hs.screen.primaryScreen():position()
  -- 0 0



  --   > hs.inspect(hs.window.allWindows())
  -- 2018-06-08 11:26:48: -- Loading extension: inspect
  -- { <userdata 1> -- hs.window: Login (0x60c000657e78), <userdata 2> -- hs.window: _UNSORTED (0x60000085e448), <userdata 3> -- hs.window: Window (0x604000446f88), <userdata 4> -- hs.window:  (0x60800064fb98), <userdata 5> -- hs.window: Messages (4 unread) (0x60c00065a788), <userdata 6> -- hs.window: Hammerspoon docs: hs.window (0x60c00065c9a8), <userdata 7> -- hs.window: NotePlan (0x60c00065c1f8), <userdata 8> -- hs.window: marks.txt (0x600000258da8), <userdata 9> -- hs.window: Airmail (0x60800064a588), <userdata 10> -- hs.window: Franz (0x600000258bc8), <userdata 11> -- hs.window: 1. cd ~/Documents/Dev/RocketLawyer.com/RL-US-Assets; node --inspect index.js   (node) (0x608000457458), <userdata 12> -- hs.window: gcs.lua — Local (0x6040004493e8), <userdata 13> -- hs.window: Hammerspoon Console (0x608000454b48) }

  -- >   hs.window.desktop()
  -- hs.window:  (0x60000044dca8)

  -- > hs.window.orderedWindows()
  -- table: 0x608000462a00

  -- > hs.inspect( hs.window.orderedWindows() )
  -- { <userdata 1> -- hs.window: Hammerspoon docs: hs.window (0x60000025ee98), <userdata 2> -- hs.window: 1. cd ~/Documents/Dev/RocketLawyer.com/RL-US-Assets; node --inspect index.js   (node) (0x604000448368), <userdata 3> -- hs.window: gcs.lua — Local (0x60c000850468), <userdata 4> -- hs.window: Airmail (0x608000244288), <userdata 5> -- hs.window: NotePlan (0x608000654488), <userdata 6> -- hs.window: Messages (4 unread) (0x6080004535b8), <userdata 7> -- hs.window: _UNSORTED (0x604000446ef8), <userdata 8> -- hs.window: Franz (0x608000654758), <userdata 9> -- hs.window: marks.txt (0x60800045c8b8) }

  -- > hs.window.find("iterm")

  -- > hs.window.find("zsh")
  -- hs.window: 2. gcowley@gcowley-mbp15: ~ (zsh) (0x60800065f5b8)

  -- > hs.window.frontmostWindow()
  -- hs.window: Hammerspoon Console (0x60000065d098)

  -- > hs.window.find("zsh"):id()
  -- 30537

  -- > hs.window.get(30537)
  -- hs.window: 2. gcowley@gcowley-mbp15: ~ (zsh) (0x60c000657b18)

  -- > hs.window.get(30537):application()
  -- hs.application: iTerm2 (0x60000065c918)

  -- > hs.window.get(30537):centerOnScreen()
  -- hs.window: 2. gcowley@gcowley-mbp15: ~ (zsh) (0x608000844948)

  -- > hs.window.get(30537):centerOnScreen(hs.screen.primaryScreen())
  -- 2018-06-08 11:33:39: -- Loading extension: screen
  -- hs.window: 2. gcowley@gcowley-mbp15: ~ (zsh) (0x604000444c18)

  -- > hs.window.get(30537):centerOnScreen(hs.screen.mainScreen())
  -- hs.window: 2. gcowley@gcowley-mbp15: ~ (zsh) (0x600000658718)

  -- > hs.window.get(30537):focus()
  -- hs.window: 2. gcowley@gcowley-mbp15: ~ (zsh) (0x60400025f3d8)

  -- > hs.window.get(30537):frame()
  -- hs.geometry.rect(658.0,-971.0,650.0,502.0)

  -- > hs.window.get(30537):moveToScreen(hs.screen.primaryScreen())
  -- hs.window: 2. gcowley@gcowley-mbp15: ~ (zsh) — 44✕14 (0x60400005f288)

  -- > hs.window.get(30537):moveToUnit('[0,0,50,50]')
  -- hs.window: 2. gcowley@gcowley-mbp15: ~ (zsh) — 88✕21 (0x60400025ceb8)

  -- > hs.window.get(30537):otherWindowsAllScreens()
  -- table: 0x60c00087e380

  -- > hs.inspect( hs.window.get(30537):otherWindowsSameScreen() )
  -- { <userdata 1> -- hs.window: _UNSORTED (0x60800044bc98), <userdata 2> -- hs.window: Messages (4 unread) (0x60c000648488), <userdata 3> -- hs.window: marks.txt (0x600000655538), <userdata 4> -- hs.window: Airmail (0x600000655328), <userdata 5> -- hs.window: Franz (0x60c000445248), <userdata 6> -- hs.window: 1. cd ~/Documents/Dev/RocketLawyer.com/RL-US-Assets; node --inspect index.js   (node) (0x600000655448) }

  -- > hs.window.get(30537):setFrame(hs.geometry.rect(10, 20, 30, 40))
  -- 2018-06-08 11:39:41: -- Loading extension: geometry
  -- hs.window: 2. 7✕2 (0x604000256048)

  -- > hs.window.get(30537):setFrame(hs.geometry.rect(100, 100, 500, 500))
  -- hs.window: 2. gcowley@gcowley-mbp15: ~ (zsh) — 61✕24 (0x600000653fd8)

  -- > hs.window.get(30537):size()
  -- hs.geometry.size(498.0,483.0)

  -- > hs.window.get(30537):windowsToWest()
  -- table: 0x608000264100

  -- > hs.inspect(hs.window.get(30537):windowsToWest())
  -- {}

  -- > hs.inspect(hs.window.get(30537):windowsToEast())
  -- { <userdata 1> -- hs.window: marks.txt (0x60c00084c4d8), <userdata 2> -- hs.window: Messages (4 unread) (0x608000256648), <userdata 3> -- hs.window: Franz (0x60c00084bb48), <userdata 4> -- hs.window: _UNSORTED (0x60c00084bba8), <userdata 5> -- hs.window: Airmail (0x60c00084c208), <userdata 6> -- hs.window: 1. cd ~/Documents/Dev/RocketLawyer.com/RL-US-Assets; node --inspect index.js   (node) (0x608000258238), <userdata 7> -- hs.window: Hammerspoon docs: hs.window (0x60c00084b5a8), <userdata 8> -- hs.window: gcs.lua — Local (0x60c00084c3e8), <userdata 9> -- hs.window: NotePlan (0x60400044bd28) }

  -- > hs.inspect(hs.window.get(30537):windowsToNorth())
  -- { <userdata 1> -- hs.window: marks.txt (0x6040006417f8), <userdata 2> -- hs.window: Hammerspoon docs: hs.window (0x6080004591f8), <userdata 3> -- hs.window: gcs.lua — Local (0x608000459d38), <userdata 4> -- hs.window: NotePlan (0x6040002508e8) }

  -- > hs.inspect(hs.window.get(30537):windowsToSouth())
  -- { <userdata 1> -- hs.window: Messages (4 unread) (0x600000652208), <userdata 2> -- hs.window: Franz (0x60800045f528), <userdata 3> -- hs.window: _UNSORTED (0x60800045f798), <userdata 4> -- hs.window: Airmail (0x6040002520e8), <userdata 5> -- hs.window: 1. cd ~/Documents/Dev/RocketLawyer.com/RL-US-Assets; node --inspect index.js   (node) (0x60800045faf8) }



end


hs.hotkey.bind({"cmd", "alt", "ctrl"}, "L", function()
-- function getFrontAppParams ()
  local frontapp = hs.window.frontmostWindow()

  local dims = frontapp:size() -- width and height
  local posX = frontapp:frame().x
  local posY = frontapp:frame().y
  local id = frontapp:id()
  local app = frontapp:application()
  local screen = frontapp:screen()
  local screenName = frontapp:screen():name()
  local screenId = frontapp:screen():id()

  local relativeDims = screen:toUnitRect( frontapp:frame() )
  -- hs.geometry.unitrect(0.069444444444444,0.087799315849487,0.34583333333333,0.55074116305587)


  -- -- Opens a file in read
  -- file = io.open("test.lua", "a+")

  -- -- sets the default input file as test.lua
  -- io.input(file)

  -- -- prints the first line of the file
  -- print(io.read())

  -- -- closes the open file
  -- io.close(file)


  -- hs.window.get(30537):setFrame(hs.geometry.rect(100, 100, 500, 500))
  hs.window.get(30537):moveToUnit('[0,0,50,50]')

  -- Opens a file in append mode
  file = io.open("test.lua", "a+")

  -- sets the default output file as test.lua
  io.output(file)

  -- appends a word test to the last line of the file
  io.write("-- \n")
  io.write(string.format("Application %s %s \n", app:name() ,screenName))
  io.write(string.format("Dims width:%s height:%s \n", dims.w, dims.h ))
  io.write(string.format("Position x:%s y:%s \n", posX, posY ))
  io.write(string.format("On screen %s %s \n", screenName, screenId))
  io.write(string.format("Relative %s, %s, %s, %s \n\n", math.floor( relativeDims.x * 100 ), math.floor( relativeDims.y * 100 ), math.floor( relativeDims.w * 100 ), math.floor( relativeDims.h * 100 ) ) )

  -- closes the open file
  io.close(file)


end)

function display () 

  local laptop = hs.screen.find("Color LCD")
  local desktop = hs.screen.find("Thunderbolt")


  local pos1 = hs.geometry.point(hs.screen.mainScreen():position())
  local pos2 = hs.geometry.point(hs.screen.primaryScreen():position())

  print(string.format("Laptop: %s  Desktop: %s ", laptop, desktop) )
  print(string.format("Primary: %s  Primary Position: %s %s  Main: %s  Main Position: %s %s", hs.screen.primaryScreen(), pos2.x, pos2.y, hs.screen.mainScreen(), pos1.x, pos1.y )) 

  -- 2018-06-11 09:19:03: Laptop: hs.screen: Color LCD (0x608000251548)  Desktop: hs.screen: Thunderbolt Display (0x608000441168) 
  -- 2018-06-11 09:19:03: Primary: hs.screen: Thunderbolt Display (0x608000445d88)  Primary Position: 0  Main: hs.screen: Thunderbolt Display (0x6080002476d8)  Main Position: 0

  -- hs.screen:setPrimary() -> boolean

  -- > hs.screen.mainScreen():position()
  -- -1  0

  -- > hs.screen.primaryScreen():position()
  -- 0 0

  -- 2018-06-11 09:45:56: Laptop: hs.screen: Color LCD (0x6080002420f8)  Desktop: hs.screen: Thunderbolt Display (0x60800025aed8) 
  -- 2018-06-11 09:45:56: Primary: hs.screen: Color LCD (0x608000458838)  Primary Position: 0  Main: hs.screen: Thunderbolt Display (0x604000451a88)  Main Position: 0


end

hs.hotkey.bind({"cmd", "alt", "ctrl"}, "s", function()
-- function swapScreen () 

  -- hs.window.frontmostWindow()

  --   > hs.inspect(hs.screen.allScreens())
  -- 2018-06-21 12:06:16: -- Loading extension: inspect
  -- { <userdata 1> -- hs.screen: Color LCD (0x60400044a828), <userdata 2> -- hs.screen: Thunderbolt Display (0x6040004495f8) }

    local thisWindow =  hs.window.focusedWindow()
    local thisWindowScreen = thisWindow:screen()


    -- local otherScreen = hs.screen.find("Thunderbolt")
    local otherScreen = thisWindowScreen:next()

    thisWindow:moveToScreen(otherScreen, true, true, .25)

end)

hs.hotkey.bind({"cmd", "alt", "ctrl"}, "j", function()
  local thisWindow =  hs.window.focusedWindow()
  local thisWindowScreen = thisWindow:screen()


  -- > hs.window.focusedWindow():frame().w
  -- 854.0

  -- > hs.window.focusedWindow():frame().h
  -- 877.0

  -- > hs.window.focusedWindow():frame().x
  -- 1473.0

  -- > hs.window.focusedWindow():frame().y
  -- -1364.0

  -- > hs.window.focusedWindow():screen():frame().y
  -- -1417.0

  -- > hs.window.focusedWindow():screen():frame().x
  -- 0.0

  -- > hs.window.focusedWindow():screen():frame().w
  -- 2560.0

  -- > hs.window.focusedWindow():screen():frame().h
  -- 1417.0

  local vMiddle = thisWindowScreen:frame().w / 2
  local hMiddle = thisWindowScreen:frame().h / 2

  local currentX = thisWindow:frame().x
  local currentY = thisWindow:frame().y

  local winWidth = vMiddle
  local winHeight = hMiddle


  if currentX > vMiddle and currentY > -hMiddle then
    print("lower right %s", thisWindow:frame())
    -- thisWindow:setFrame(hs.geometry.rect( vMiddle, -hMiddle, vMiddle, hMiddle ))
    setSize( winWidth, winHeight, vMiddle, 0 )

  elseif currentX > vMiddle and currentY < -hMiddle then
    print("upper right %s", thisWindow:frame())
    -- thisWindow:setFrame(hs.geometry.rect( 0, -thisWindowScreen:frame().h, vMiddle, hMiddle ))
    setSize(winWidth, winHeight, vMiddle, 0 )

  elseif currentX < vMiddle and currentY > -hMiddle then
    print("lower left %s", thisWindow:frame())
    -- thisWindow:setFrame(hs.geometry.rect( 0, -thisWindowScreen:frame().h, vMiddle, hMiddle ))
    setSize( winWidth, winHeight, 0, hMiddle )

  elseif currentX < vMiddle and currentY < -hMiddle then
    print("upper left %s", thisWindow:frame())
    -- thisWindow:setFrame(hs.geometry.rect( vMiddle, -hMiddle, vMiddle, hMiddle ))
    setSize( winWidth, winHeight, 0, hMiddle )

  end


  -- thisWindow:moveToUnit('[0,0,50,50]')


end)


























