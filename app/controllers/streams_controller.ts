// import type { HttpContext } from '@adonisjs/core/http'
import { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import { MigrationRunChange } from '#events/migration'
import { EventCreate, EventUpdate, EventsCleared } from '#events/event'
import EventLog from '#models/event'

export default class StreamsController {
  async stream({ response, auth }: HttpContext) {
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

    // Сериализация уведомления
    const serializeEvent = (e: EventLog) => ({
      id: e.id,
      userId: e.userId,
      type: e.type,
      message: e.message,
      errorId: e.errorId,
      muted: e.muted,
      createdAt: e.createdAt?.toISO?.() ?? null,
    })

    // Создание уведомления
    const onEventCreate = (payload: EventCreate) => {
      const userId = auth.user?.id
      if (!userId) return
      if (payload.event.userId !== userId) return
      write('notification_create', serializeEvent(payload.event))
    }

    // Обновление уведомления (например, mute)
    const onEventUpdate = (payload: EventUpdate) => {
      const userId = auth.user?.id
      if (!userId) return
      if (payload.event.userId !== userId) return
      write('notification_update', serializeEvent(payload.event))
    }

    // Массовая очистка уведомлений
    const onEventsCleared = (payload: EventsCleared) => {
      const userId = auth.user?.id
      if (!userId) return
      if (payload.userId !== userId) return
      write('notifications_cleared', { updated: payload.updated })
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
      emitter.off(EventCreate, onEventCreate)
      emitter.off(EventUpdate, onEventUpdate)
      emitter.off(EventsCleared, onEventsCleared)

      // Закрываем соединение
      response.response.end()
    }

    // Тут регистрируем обработчик события, чтобы отправлять данные клиенту
    emitter.on(MigrationRunChange, onMigrationChange)
    emitter.on(EventCreate, onEventCreate)
    emitter.on(EventUpdate, onEventUpdate)
    emitter.on(EventsCleared, onEventsCleared)

    // Очистка ресурсов при закрытии соединения
    response.response.on('close', cleanup)
  }
}
