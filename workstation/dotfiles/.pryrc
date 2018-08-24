Pry.commands.alias_command 'c', 'continue'
Pry.commands.alias_command 's', 'step'
Pry.commands.alias_command 'n', 'next'
Pry.commands.alias_command 'e', 'exit'

Pry.config.default_window_size = 25
Pry.config.pager = false

Mongo::Logger.logger.level = ::Logger::FATAL if defined? Mongo
