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

    const messages = {
      title: i18n.t('dashboard.title'),
      h1: i18n.t('dashboard.h1'),
      stats: {
        migrationsTitle: i18n.t('dashboard.stats.migrationsTitle'),
        migrationsHintActive: i18n.t('dashboard.stats.migrationsHintActive', {
          count: activeMigrationsCount,
        }),
        sourcesTitle: i18n.t('dashboard.stats.sourcesTitle'),
        sourcesHintTotal: i18n.t('dashboard.stats.sourcesHintTotal'),
        errorsTitle: i18n.t('dashboard.stats.errorsTitle'),
        errorsHintOpen: i18n.t('dashboard.stats.errorsHintOpen'),
        runningTitle: i18n.t('dashboard.stats.runningTitle'),
        runningHintNow: i18n.t('dashboard.stats.runningHintNow'),
        openLink: i18n.t('dashboard.stats.openLink'),
      },
      analytics: {
        title: i18n.t('dashboard.analytics.title'),
        hint: i18n.t('dashboard.analytics.hint'),
        badge: i18n.t('dashboard.analytics.badge'),
      },
      migrations: {
        title: i18n.t('dashboard.migrations.title'),
        allLink: i18n.t('dashboard.migrations.allLink'),
        table: {
          id: i18n.t('dashboard.migrations.table.id'),
          name: i18n.t('dashboard.migrations.table.name'),
          status: i18n.t('dashboard.migrations.table.status'),
          actions: i18n.t('dashboard.migrations.table.actions'),
          statusActive: i18n.t('dashboard.migrations.table.statusActive'),
          statusInactive: i18n.t('dashboard.migrations.table.statusInactive'),
          run: i18n.t('dashboard.migrations.table.run'),
          open: i18n.t('dashboard.migrations.table.open'),
          noData: i18n.t('dashboard.migrations.table.noData'),
        },
      },
      errors: {
        title: i18n.t('dashboard.errors.title'),
        allLink: i18n.t('dashboard.errors.allLink'),
        noMessage: i18n.t('dashboard.errors.noMessage'),
        noData: i18n.t('dashboard.errors.noData'),
      },
      quickActions: {
        title: i18n.t('dashboard.quickActions.title'),
        createMigration: i18n.t('dashboard.quickActions.createMigration'),
        sources: i18n.t('dashboard.quickActions.sources'),
      },
      chartLegend: {
        runs: i18n.t('dashboard.chartLegend.runs'),
        success: i18n.t('dashboard.chartLegend.success'),
        canceled: i18n.t('dashboard.chartLegend.canceled'),
        errors: i18n.t('dashboard.chartLegend.errors'),
      },
    }

    return inertia.render('home', {
      messages,
      pageTitle: messages.h1,
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
