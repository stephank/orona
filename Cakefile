{spawn} = require 'child_process'

# Run the CoffeeScript compiler.
run = (args) ->
  proc =         spawn 'coffee', args
  proc.stderr.on 'data', (buffer) -> puts buffer.toString()
  proc.on        'exit', (status) -> process.exit(1) if status != 0

task 'build', 'Compile the Bolo CoffeeScript source', ->
  run ['-c', '-o', 'lib', 'src']
