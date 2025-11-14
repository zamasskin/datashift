import type { HttpContext } from '@adonisjs/core/http'
import Migration from '#models/migration'
import DataSource from '#models/data_source'
import MigrationRun from '#models/migration_run'
import ErrorLog from '#models/error_log'
import ErrorUserState from '#models/error_user_state'

export default class HomeController {
  async index({ inertia, request, auth }: HttpContext) {
    const [migrationsCountRow, dataSourcesCountRow, openErrorsCountRow] = await Promise.all([
      Migration.query().count('* as total'),
      DataSource.query().count('* as total'),
      ErrorLog.query().where('status', 'open').count('* as total'),
    ])

    const migrationsCount = Number(migrationsCountRow?.[0]?.$extras?.total || 0)
    const dataSourcesCount = Number(dataSourcesCountRow?.[0]?.$extras?.total || 0)
    const openErrorsCount = Number(openErrorsCountRow?.[0]?.$extras?.total || 0)

    const [latestMigrations, latestErrorsRaw, runningMigrations] = await Promise.all([
      Migration.query().orderBy('createdAt', 'desc').limit(5),
      ErrorLog.query().orderBy('occurredAt', 'desc').orderBy('createdAt', 'desc').limit(8),
      MigrationRun.query().where('status', 'running').orderBy('createdAt', 'desc'),
    ])

    // По умолчанию скрываем прочитанные и "замьюченные" ошибки на дашборде
    const includeReadParam = request.input('includeRead')
    const includeRead = includeReadParam === '1' || includeReadParam === true
    const userId = auth.user?.id

    let latestErrors = latestErrorsRaw.map((e) => ({
      id: e.id,
      message: e.message,
      severity: e.severity as 'error' | 'warning' | 'info',
      occurredAt: e.occurredAt?.toISO() ?? null,
    }))

    if (userId && !includeRead && latestErrors.length) {
      const ids = latestErrorsRaw.map((e) => e.id)
      const states = await ErrorUserState.query().where('userId', userId).whereIn('errorId', ids)
      const stateByErrorId = new Map(states.map((s) => [s.errorId, s]))
      latestErrors = latestErrors.filter((e) => {
        const s = stateByErrorId.get(e.id)
        const isRead = Boolean(s?.readAt)
        const isMuted = Boolean(s?.muted)
        return !isRead && !isMuted
      })
    }

    return inertia.render('home', {
      counts: {
        migrations: migrationsCount,
        sources: dataSourcesCount,
        openErrors: openErrorsCount,
      },
      latestMigrations,
      latestErrors,
      runningMigrations,
    })
  }
}
