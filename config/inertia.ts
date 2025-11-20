import MigrationRun from '#models/migration_run'
import File from '#models/file'
import { HttpContext } from '@adonisjs/core/http'
import { defineConfig } from '@adonisjs/inertia'
import type { InferSharedProps } from '@adonisjs/inertia/types'
import EventLog from '#models/event'

const inertiaConfig = defineConfig({
  /**
   * Path to the Edge view that will be used as the root view for Inertia responses
   */
  rootView: 'inertia_layout',

  /**
   * Data that should be shared with all rendered pages
   */
  sharedData: {
    user: (ctx) => ctx.inertia.always(() => ctx.auth.user),
    userAvatarUrl: async (ctx) =>
      ctx.inertia.always(async () => {
        const u = ctx.auth.user
        if (!u || !u.fileId) return null
        const f = await File.find(u.fileId)
        return f ? `/${f.storageKey}` : null
      }),
    csrfToken: (ctx: HttpContext) => ctx.request.csrfToken,
    runningMigrations: async (ctx) => {
      const running = await MigrationRun.query()
        .preload('migration', (q) => q.select(['id', 'name']))
        .where('status', 'running')
      return ctx.inertia.always(() => running)
    },
    events: async (ctx) => {
      const query = EventLog.query()
        .where('userId', ctx.auth.user?.id || 0)
        .where('muted', false)
        .orderBy('createdAt', 'desc')

      const [items, totalRows] = await Promise.all([
        query.clone().limit(100),
        query.clone().count('id as count').first(),
      ])
      return ctx.inertia.always(() => {
        const total = totalRows?.$extras?.count || 0
        return { items, total }
      })
    },
    locale: (ctx) => ctx.inertia.always(() => ctx.i18n.locale),
    layoutMessages: (ctx) =>
      ctx.inertia.always(() => ({
        brand: ctx.i18n.t('layout.brand'),
        loginLink: ctx.i18n.t('layout.loginLink'),
        footerCopyright: ctx.i18n.t('layout.footer.copyright', {
          year: new Date().getFullYear(),
        }),
        root: {
          nav: {
            sources: ctx.i18n.t('layout.root.nav.sources'),
            datasets: ctx.i18n.t('layout.root.nav.datasets'),
            migrations: ctx.i18n.t('layout.root.nav.migrations'),
            tasks: ctx.i18n.t('layout.root.nav.tasks'),
          },
          createMenu: {
            source: ctx.i18n.t('layout.root.createMenu.source'),
            dataset: ctx.i18n.t('layout.root.createMenu.dataset'),
            migration: ctx.i18n.t('layout.root.createMenu.migration'),
            task: ctx.i18n.t('layout.root.createMenu.task'),
          },
          settingsMenu: {
            trigger: ctx.i18n.t('layout.root.settingsMenu.trigger'),
            security: ctx.i18n.t('layout.root.settingsMenu.security'),
            users: ctx.i18n.t('layout.root.settingsMenu.users'),
            user: ctx.i18n.t('layout.root.settingsMenu.user'),
            profile: ctx.i18n.t('layout.root.settingsMenu.profile'),
            logout: ctx.i18n.t('layout.root.settingsMenu.logout'),
          },
          secondary: {
            help: ctx.i18n.t('layout.root.secondary.help'),
            search: ctx.i18n.t('layout.root.secondary.search'),
          },
          running: {
            showAll: ctx.i18n.t('layout.root.running.showAll'),
          },
          runningIndicators: {
            header: ctx.i18n.t('layout.root.runningIndicators.header'),
            noNamePrefix: ctx.i18n.t('layout.root.runningIndicators.noNamePrefix'),
            progress: ctx.i18n.t('layout.root.runningIndicators.progress'),
            streamsLabel: ctx.i18n.t('layout.root.runningIndicators.streamsLabel'),
            flowLabel: ctx.i18n.t('layout.root.runningIndicators.flowLabel'),
            stopAria: ctx.i18n.t('layout.root.runningIndicators.stopAria'),
          },
        },
      })),
  },

  /**
   * Options for the server-side rendering
   */
  ssr: {
    enabled: true,
    entrypoint: 'inertia/app/ssr.tsx',
  },
})

export default inertiaConfig

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends InferSharedProps<typeof inertiaConfig> {}
}
