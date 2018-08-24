homebrew=/usr/local/bin:/usr/local/sbin
export PATH=$homebrew:$PATH
export PATH="$PATH:$HOME/.rvm/bin" # Add RVM to PATH for scripting

[[ -s "$HOME/.rvm/scripts/rvm" ]] && source "$HOME/.rvm/scripts/rvm" # Load RVM into a shell session *as a function*

if which jenv > /dev/null; then eval "$(jenv init -)"; fi

# eval "$(rbenv init -)"

export NVM_DIR="$HOME/.nvm"
. "/usr/local/opt/nvm/nvm.sh"

# Python ::
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# Java ::
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home
PATH=${JAVA_HOME}/bin:$PATH;

# Ant ::
ANT_HOME=/usr/local/Cellar/ant/1.9.7/libexec
ANT_OPTS="-Xms1028M -Xmx2048M -Djsse.enableSNIExtension=false"
PATH=$PATH:$HOME/bin:$ANT_HOME/bin
export ANT_HOME ANT_OPTS PATH

# MySQL ::
export MYSQL_PATH=/usr/local/Cellar/mysql/5.6.27
export PATH=$PATH:$MYSQL_PATH/bin

# Maven ::
export M2_HOME=/usr/local/Cellar/maven/3.5.0
export M2=$M2_HOME/bin
export MAVEN_OPTS=-Xmx512m

export MY_PERSONAL_TOKEN=b384ce35ba9db407d00e997ce8c8e564b043c9ed

# B-Proxy
BLURB_DEV_ROOT="$HOME/Sites/blurb.com" # this is where all your blurb repos are
source "$BLURB_DEV_ROOT/web-scripts/profile-scripts"
PATH="$PATH:$BLURB_DEV_ROOT/web-scripts"

# Bookify build info ::
JOB_NAME=Bookify-Local-Profile
BUILD_NUMBER=8888

# Adding redTamarin support ::
export REDTAMARIN_SDK=/Users/gcowley/Sites/blurb.com/flx/sdks/redtamarin-sdk-macintosh
export PATH=${REDTAMARIN_SDK}/bin:$PATH;

# Webscripts ::
source "$HOME/Sites/blurb.com/web-scripts/profile-scripts"
PATH="$PATH:$HOME/Sites/blurb.com/web-scripts"

# My Pesonal Dev Tools ::
source $HOME/.myconfigurations/workstation/shell/includes
PATH="$PATH:$HOME/.myconfigurations/workstation/shell/includes"
source $HOME/.myconfigurations/workstation/shell/commands
PATH="$PATH:$HOME/.myconfigurations/workstation/shell/commands"

# Shell Integration for iTerm (This dynamically matches the shell type) ::
source ~/.iterm2_shell_integration.`basename $SHELL`
