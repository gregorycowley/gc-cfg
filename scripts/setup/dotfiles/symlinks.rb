require 'fileutils'
require_relative 'settings'
include Settings

def remove_installed_file(filename)
  FileUtils.rm(@curr_dot_file)
  puts "#{filename} has been successfully removed..."
end

def create_dot_file_shortcut(filename)
  remove_installed_file(filename) if File.exist?(@curr_dot_file)
  FileUtils.ln_s(@new_dot_file, @curr_dot_file, force: true)
  puts "#{filename} shortcut has been created successfully..."
end

def create_hammerspoon_shortcut()
  # This doesn't work. Kept here for reference and refinement.
  SOURCE_DIR = File.join(Dir.home,'.hammerspoon')
  WORKING_DIR = File.join(Dir.home,'.myconfigurations','workstation','hammerspoon')
  # @curr_dot_file = File.join(HOME_DIR,filename)
  # @new_dot_file = File.join(WORKING_DIR,filename)
  # ln -s /Users/gcowley/.hammerspoon /Users/gcowley/.myconfigurations/workstation/hammerspoon
  # ln -s /Users/gcowley/.myconfigurations/workstation/hammerspoon /Users/gcowley/.hammerspoon
  FileUtils.ln_s(@new_dot_file, @curr_dot_file, force: true)
end

DOT_FILE_LIST.each do |filename|
  build_file_vars(filename)
  create_dot_file_shortcut(filename)
end
