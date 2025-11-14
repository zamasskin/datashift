import type { HttpContext } from '@adonisjs/core/http'
import Migration from '#models/migration'
import DataSource from '#models/data_source'
import MigrationRun from '#models/migration_run'
import ErrorLog from '#models/error_log'

export default class HomeController {
  async index({ inertia }: HttpContext) {
    const [migrationsCountRow, dataSourcesCountRow, openErrorsCountRow] = await Promise.all([
      Migration.query().count('* as total'),
      DataSource.query().count('* as total'),
      ErrorLog.query().where('status', 'open').count('* as total'),
    ])

    const migrationsCount = Number(migrationsCountRow?.[0]?.$extras?.total || 0)
    const dataSourcesCount = Number(dataSourcesCountRow?.[0]?.$extras?.total || 0)
    const openErrorsCount = Number(openErrorsCountRow?.[0]?.$extras?.total || 0)

    const [latestMigrations, latestErrors, runningMigrations] = await Promise.all([
      Migration.query().orderBy('createdAt', 'desc').limit(5),
      ErrorLog.query().orderBy('occurredAt', 'desc').limit(4),
      MigrationRun.query().where('status', 'running').orderBy('createdAt', 'desc'),
    ])

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
