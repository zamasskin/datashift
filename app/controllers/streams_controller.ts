// import type { HttpContext } from '@adonisjs/core/http'
import { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import { MigrationRunChange } from '#events/migration'
import { ErrorLogChange } from '#events/error_log'

export default class StreamsController {
  async stream({ response }: HttpContext) {
    // Устанавливаем заголовки для SSE
    response.response.setHeader('Content-Type', 'text/event-stream')
    response.response.setHeader('Cache-Control', 'no-cache')
    response.response.setHeader('Connection', 'keep-alive')
    response.response.flushHeaders()

    // Функция для отправки данных на клиент
    const write = (event: string, payload: any) => {
      response.response.write(
        `${event ? `event: ${event}\n` : ''}data: ${JSON.stringify(payload)}\n\n`
      )
    }

    // Обработчик события изменения миграции
    const onMigrationChange = (event: MigrationRunChange) => {
      write('migration_run', event.migrationRun)
    }

    // Обработчик события изменения ошибки
    const onErrorLogChange = (errorLog: ErrorLogChange) => {
      write('error_log', errorLog)
    }

    // Heartbeat для поддержки долгоживущего соединения
    const heartbeat = setInterval(() => {
      try {
        response.response.write(':keep-alive\n\n')
      } catch {}
    }, 30000)

    // Очистка ресурсов при закрытии соединения
    const cleanup = () => {
      // Очищаем интервал hearbeat
      clearInterval(heartbeat)

      // Отключаем обработчики событий
      emitter.off(MigrationRunChange, onMigrationChange)
      emitter.off(ErrorLogChange, onErrorLogChange)

      // Закрываем соединение
      response.response.end()
    }

    // Тут регистрируем обработчик события, чтобы отправлять данные клиенту
    emitter.on(MigrationRunChange, onMigrationChange)
    emitter.on(ErrorLogChange, onErrorLogChange)

    // Очистка ресурсов при закрытии соединения
    response.response.on('close', cleanup)
  }
}
