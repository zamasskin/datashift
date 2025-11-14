import type { HttpContext } from '@adonisjs/core/http'
import ErrorLog from '#models/error_log'
import Event from '#models/event'

export default class ErrorsController {
  async index({ inertia, request }: HttpContext) {
    const severity = request.input('severity') as 'error' | 'warning' | 'info' | undefined
    const status = request.input('status') as 'open' | 'resolved' | undefined
    const page = Number(request.input('page') || 1)
    const perPage = Math.max(1, Math.min(Number(request.input('perPage') || 10), 200))

    const query = ErrorLog.query()
      .orderBy('occurredAt', 'desc')
      .orderBy('createdAt', 'desc')
      .select([
        'id',
        'severity',
        'message',
        'occurred_at',
        'status',
        'code',
        'migration_id',
        'migration_run_id',
      ])

    if (severity) query.where('severity', severity)
    if (status) query.where('status', status)

    const errors = await query.paginate(page, perPage)

    return inertia.render('errors/index', {
      errors,
      filters: { severity: severity || null, status: status || null },
    })
  }

  async show({ inertia, params, auth }: HttpContext) {
    const id = Number(params.id)
    const error = await ErrorLog.findOrFail(id)

    const userId = auth.user?.id
    // Автоматически фиксируем событие read при открытии страницы
    let read = false
    let muted = false
    if (userId) {
      const [latestMute, existingRead] = await Promise.all([
        Event.query()
          .where('userId', userId)
          .where('errorId', id)
          .where('type', 'mute')
          .orderBy('createdAt', 'desc')
          .first(),
        Event.query().where('userId', userId).where('errorId', id).where('type', 'read').first(),
      ])
      muted = Boolean((latestMute as any)?.muted ?? latestMute?.value)
      read = Boolean(existingRead)
      if (!read) {
        await Event.create({ userId, errorId: id, type: 'read', value: null })
        read = true
      }
    }

    return inertia.render('errors/show', {
      error: {
        id: error.id,
        uuid: error.uuid,
        severity: error.severity,
        status: error.status,
        code: error.code,
        message: error.message,
        occurredAt: error.occurredAt?.toISO() ?? null,
        migrationId: error.migrationId,
        migrationRunId: error.migrationRunId,
        trigger: error.trigger,
        source: error.source,
        environment: error.environment,
        hostname: error.hostname,
        stack: error.stack,
        context: error.context || {},
      },
      state: {
        read,
        muted,
      },
    })
  }

  async latest({ auth }: HttpContext) {
    const userId = auth.user?.id
    const latest = await ErrorLog.query()
      .orderBy('occurredAt', 'desc')
      .orderBy('createdAt', 'desc')
      .select([
        'id',
        'severity',
        'message',
        'occurred_at',
        'status',
        'code',
        'migration_id',
        'migration_run_id',
      ])
      .limit(5)

    const ids = latest.map((e) => e.id)
    const events = userId ? await Event.query().where('userId', userId).whereIn('errorId', ids) : []
    const grouped = new Map<number, { read: boolean; muted: boolean }>()
    for (const ev of events) {
      const current = grouped.get(ev.errorId) || { read: false, muted: false }
      if (ev.type === 'read') current.read = true
      if (ev.type === 'mute') current.muted = Boolean((ev as any).muted ?? ev.value)
      grouped.set(ev.errorId, current)
    }

    return latest.map((e) => {
      const s = grouped.get(e.id)
      return {
        id: e.id,
        severity: e.severity,
        message: e.message,
        occurredAt: e.occurredAt?.toISO() ?? null,
        status: e.status,
        code: e.code,
        migrationId: e.migrationId,
        migrationRunId: e.migrationRunId,
        read: Boolean(s?.read),
        muted: Boolean(s?.muted),
      }
    })
  }

  async markRead({ auth, request }: HttpContext) {
    const userId = auth.user?.id
    const ids = (request.input('ids') as number[]) || []
    if (!userId || !Array.isArray(ids) || ids.length === 0) {
      return { updated: 0 }
    }
    let count = 0
    for (const errorId of ids) {
      // Фиксируем событие «прочитано»; повторные события допустимы
      await Event.create({ userId, errorId, type: 'read', value: null })
      count++
    }
    return { updated: count }
  }

  async mute({ auth, request }: HttpContext) {
    const userId = auth.user?.id
    const errorId = Number(request.input('id') || 0)
    const muted = Boolean(request.input('muted'))
    if (!userId || !errorId) return { updated: 0 }

    // Записываем событие mute с указанным значением
    await Event.create({ userId, errorId, type: 'mute', value: muted, muted })
    return { updated: 1 }
  }
}
