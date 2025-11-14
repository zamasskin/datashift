import type { HttpContext } from '@adonisjs/core/http'
import ErrorLog from '#models/error_log'

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
}
