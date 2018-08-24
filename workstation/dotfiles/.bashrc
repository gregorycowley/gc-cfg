if which rbenv > /dev/null; then eval "$(rbenv init -)"; fi

# function iterm2_print_user_vars() {
#   iterm2_set_user_var gitBranch $((git branch 2> /dev/null) | grep \* | cut -c3-)
#   #iterm2_set_user_var directory (basename "$PWD")
# }

# For z
. /usr/local/etc/profile.d/z.sh

