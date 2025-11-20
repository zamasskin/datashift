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
