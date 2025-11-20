import type { HttpContext } from '@adonisjs/core/http'
import MigrationRun from '#models/migration_run'

export default class TasksController {
  async index({ inertia }: HttpContext) {
    const runs = await MigrationRun.query()
      .whereIn('status', ['pending', 'running'])
      .orderBy('createdAt', 'desc')
      .preload('migration', (q) => q.select(['id', 'name']))
      .select(['id', 'migration_id', 'status', 'trigger', 'created_at', 'pid', 'progress'])

    return inertia.render('tasks/index', {
      runs: runs.map((r) => ({
        id: r.id,
        status: r.status,
        trigger: r.trigger,
        createdAt: r.createdAt?.toISO() ?? null,
        pid: r.pid,
        progress: r.progress ?? [],
        migration: r.migration ? { id: r.migration.id, name: r.migration.name } : null,
      })),
    })
  }
}
