- require('strong-cluster'): must be a singleton
- require('cluster'): error, or make it be strong-cluster?
- cluster.fork(): childprocess.fork()
- cluster.on('exit': ChildProcess.on('exit', cluster.emit(...))
- cluster.on('fork': emit('fork', worker)
- cluster.setupMaster(): set fork options
- cluster.worker: Worker in child
- cluster.workers: map id to Worker in parent, clear on exit/disconnect
- cluster.isMaster, cluster.isWorker: set them

- worker.disconnect: send message, close all servers in worker, send message
  back, etc... basically pull code from lib/cluster.js
- worker.id: id
- worker.kill: worker.disconnect(); worker.on('disconnect', worker.kill())
- worker.on('exit': ChildProcess.on('exit'
- worker.on('listening': emit from net.listen()
- worker.on('message',: ChildProcess.on('message'
- worker.on('online',: send from worker, pull code from lib/cluster.js
- worker.pid: ChildProcess.pid
- worker.process: ChildProcess
- worker.send: ChildProcess.send()
- worker.suicide: pull code from lib/cluster.js, see disconnect

- net.createServer().listen(): need to patch .createServer() net.Server, and
  then for TCP *only* (no udp, no pipes) record all non-closed servers (for
  disconnect), and send message to master so 'listening' can be emitted
- process.on('disconnect': need to listen on, and exit on disconnect in workers
