import type { HttpContext } from '@adonisjs/core/http'
import ErrorLog from '#models/error_log'
// Убраны все упоминания событий (Event) из контроллера ошибок

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

  async show({ inertia, params }: HttpContext) {
    const id = Number(params.id)
    const error = await ErrorLog.findOrFail(id)

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
    })
  }

  async latest(_ctx: HttpContext) {
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

    return latest.map((e) => {
      return {
        id: e.id,
        severity: e.severity,
        message: e.message,
        occurredAt: e.occurredAt?.toISO() ?? null,
        status: e.status,
        code: e.code,
        migrationId: e.migrationId,
        migrationRunId: e.migrationRunId,
      }
    })
  }

  async markRead(_ctx: HttpContext) {
    // Убрано: контроллер ошибок больше не управляет событиями
    // Сохранена сигнатура endpoint, чтобы не ломать маршруты
    return { updated: 0 }
  }

  async mute(_ctx: HttpContext) {
    // Убрано: контроллер ошибок больше не управляет событиями
    // Сохранена сигнатура endpoint, чтобы не ломать маршруты
    return { updated: 0 }
  }
}
