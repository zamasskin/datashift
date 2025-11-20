import type { HttpContext } from '@adonisjs/core/http'
import Migration from '#models/migration'
import DataSource from '#models/data_source'
import MigrationRun from '#models/migration_run'
import ErrorLog from '#models/error_log'
// Убраны связи ошибок с событиями (Event)

export default class HomeController {
  async index({ inertia, i18n }: HttpContext) {
    const [migrationsCountRow, activeMigrationsCountRow, dataSourcesCountRow, openErrorsCountRow] =
      await Promise.all([
        Migration.query().count('* as total'),
        Migration.query().where('is_active', true).count('* as total'),
        DataSource.query().count('* as total'),
        ErrorLog.query().where('status', 'open').count('* as total'),
      ])

    const migrationsCount = Number(migrationsCountRow?.[0]?.$extras?.total || 0)
    const activeMigrationsCount = Number(activeMigrationsCountRow?.[0]?.$extras?.total || 0)
    const dataSourcesCount = Number(dataSourcesCountRow?.[0]?.$extras?.total || 0)
    const openErrorsCount = Number(openErrorsCountRow?.[0]?.$extras?.total || 0)

    const [latestMigrations, latestErrorsRaw, runningMigrations] = await Promise.all([
      Migration.query().orderBy('createdAt', 'desc').limit(5),
      ErrorLog.query().orderBy('occurredAt', 'desc').orderBy('createdAt', 'desc').limit(8),
      MigrationRun.query()
        .where('status', 'running')
        .preload('migration', (q) => q.select(['id', 'name']))
        .orderBy('createdAt', 'desc'),
    ])

    let latestErrors = latestErrorsRaw.map((e) => ({
      id: e.id,
      message: e.message,
      severity: e.severity as 'error' | 'warning' | 'info',
      occurredAt: e.occurredAt?.toISO() ?? null,
    }))

    return inertia.render('home', {
      pageTitle: i18n.t('dashboard.h1'),
      counts: {
        migrations: migrationsCount,
        activeMigrations: activeMigrationsCount,
        sources: dataSourcesCount,
        openErrors: openErrorsCount,
      },
      latestMigrations,
      latestErrors,
      runningMigrations,
    })
  }
}
