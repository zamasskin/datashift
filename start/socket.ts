import * as net from 'node:net'

const port = Number(process.env.SOCKET_PORT || 3335)
const server = net.createServer((socket) => {
  socket.on('close', () => {
    console.log(`Client disconnected from socket on port ${port}`)
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Socket server started on port ${port}`)
})

process.on('SIGINT', () => {
  server.close()
  process.exit(0) // 0 означает успешное завершение
})

process.on('exit', () => {
  server.close()
})
