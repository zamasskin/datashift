import * as net from 'node:net'

const port = Number(process.env.SOCKET_PORT || 3335)
const clients = new Map<string, net.Socket>()

const server = net.createServer((socket) => {
  const socketId = socket.remoteAddress + ':' + socket.remotePort
  clients.set(socketId, socket)
  //   socket.setKeepAlive(true)

  console.log(socket.remoteAddress, socket.remotePort)

  // Форвардим NDJSON строки от одного клиента всем остальным
  socket.on('data', (chunk) => {
    for (const [clientId, client] of clients) {
      if (clientId !== socketId) {
        client.write(chunk)
      }
    }
  })

  socket.on('error', (err) => {
    console.error(`Ошибка сокета ${socketId}: ${err.message}`)
    socket.destroy()
  })

  socket.on('close', () => {
    clients.delete(socketId)
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
