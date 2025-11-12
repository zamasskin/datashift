import * as net from 'node:net'

export class PubSubHub {
  constructor(private readonly client = new net.Socket()) {
    const port = Number(process.env.SOCKET_PORT || 3335)
    const host = process.env.SOCKET_HOST || '127.0.0.1'
    this.client.connect(port, host)
  }

  on(event: 'close', callback: (hadError: boolean) => void): void
  on(event: 'connect', callback: () => void): void
  on(event: 'data', callback: (data: Buffer) => void): void
  on(event: 'drain', callback: () => void): void
  on(event: 'end', callback: () => void): void
  on(event: 'error', callback: (err: Error) => void): void
  on(
    event: 'lookup',
    callback: (err: Error, address: string, family: string | number, host: string) => void
  ): void
  on(event: 'ready', callback: () => void): void
  on(event: 'timeout', callback: () => void): void
  on(event: string, callback: (...args: any[]) => void): void
  on(event: string, callback: (...args: any[]) => void) {
    this.client.on(event, callback)
  }

  onJson<T = any>(callback: (obj: T) => void) {
    let buffer = ''
    const handleChunk = (chunk: Buffer) => {
      buffer += chunk.toString('utf8')
      let idx = buffer.indexOf('\n')
      while (idx !== -1) {
        const line = buffer.slice(0, idx).trim()
        buffer = buffer.slice(idx + 1)
        if (line.length > 0) {
          try {
            callback(JSON.parse(line) as T)
          } catch (err) {
            this.client.emit('error', err as Error)
          }
        }
        idx = buffer.indexOf('\n')
      }
    }
    this.client.on('data', handleChunk)
    this.client.on('end', () => {
      const rest = buffer.trim()
      if (rest.length > 0) {
        try {
          callback(JSON.parse(rest) as T)
        } catch (err) {
          this.client.emit('error', err as Error)
        }
      }
      buffer = ''
    })
  }

  // Запись произвольной строки/буфера без принудительной сериализации в JSON.
  write(data: string | Buffer): boolean {
    if (typeof data === 'string') {
      const line = data.endsWith('\n') ? data : `${data}\n`
      return this.client.write(line, 'utf8')
    }
    return this.client.write(data)
  }

  // Опционально: запись JSON с NDJSON-окончанием строки.
  writeJson<T>(obj: T): boolean {
    const payload = JSON.stringify(obj)
    return this.client.write(`${payload}\n`, 'utf8')
  }

  dispose() {
    this.client.removeAllListeners()
    this.client.end()
    this.client.destroy()
  }
}
