import type { HttpContext } from '@adonisjs/core/http'
import Migration from '#models/migration'
import DataSource from '#models/data_source'
import ErrorLog from '#models/error_log'

export default class SearchController {
  /**
   * Unified REST search across migrations (by name),
   * data sources (by name), and errors (by message/code/stack).
   *
   * GET /search?q=term&limit=5
   */
  async index({ request }: HttpContext) {
    const q = String(request.input('q') || '').trim()
    const limit = Math.max(1, Math.min(Number(request.input('limit') || 5), 50))

    if (!q) {
      return {
        migrations: [],
        dataSources: [],
        errors: [],
      }
    }

    const like = `%${q}%`

    const [migrations, dataSources, errors] = await Promise.all([
      // Use LOWER(...) LIKE LOWER(?) to avoid collation mismatches across MySQL utf8mb4
      Migration.query()
        .whereRaw('LOWER(name) LIKE LOWER(?)', [like])
        .select(['id', 'name', 'is_active'])
        .orderBy('name', 'asc')
        .limit(limit),

      DataSource.query()
        .whereRaw('LOWER(name) LIKE LOWER(?)', [like])
        .select(['id', 'name', 'type'])
        .orderBy('name', 'asc')
        .limit(limit),

      ErrorLog.query()
        .where((builder) => {
          builder.whereRaw('LOWER(message) LIKE LOWER(?)', [like])
          builder.orWhereRaw('LOWER(code) LIKE LOWER(?)', [like])
          builder.orWhereRaw('LOWER(stack) LIKE LOWER(?)', [like])
        })
        .select(['id', 'severity', 'message', 'code', 'occurred_at', 'status'])
        .orderBy('occurredAt', 'desc')
        .limit(limit),
    ])

    return {
      migrations: migrations.map((m) => ({ id: m.id, name: m.name, isActive: m.isActive })),
      dataSources: dataSources.map((s) => ({ id: s.id, name: s.name, type: s.type })),
      errors: errors.map((e) => ({
        id: e.id,
        severity: e.severity,
        message: e.message,
        code: e.code,
        occurredAt: e.occurredAt?.toISO() ?? null,
        status: e.status,
      })),
    }
  }
}
