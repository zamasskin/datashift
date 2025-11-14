import MigrationRun from '#models/migration_run'
import ErrorLog from '#models/error_log'
import Event from '#models/event'
import File from '#models/file'
import { HttpContext } from '@adonisjs/core/http'
import { defineConfig } from '@adonisjs/inertia'
import type { InferSharedProps } from '@adonisjs/inertia/types'

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
    errorsPreview: async (ctx) => {
      const userId = ctx.auth.user?.id
      if (!userId) {
        return ctx.inertia.always(() => ({ items: [], unmutedCount: 0 }))
      }

      const items = await ErrorLog.query()
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
        .whereDoesntHave('events', (q) => {
          q.where('userId', userId).where('type', 'mute').where('muted', true)
        })
        .limit(5)

      const countRow = await ErrorLog.query()
        .whereDoesntHave('events', (q) => {
          q.where('userId', userId).where('type', 'mute').where('muted', true)
        })
        .count('* as total')

      const unmutedCount = Number(countRow?.[0]?.$extras?.total || 0)

      const normalized = items.map((e) => ({
        id: e.id,
        severity: e.severity,
        message: e.message,
        occurredAt: e.occurredAt?.toISO() ?? null,
        status: e.status,
        code: e.code,
        migrationId: e.migrationId,
        migrationRunId: e.migrationRunId,
        read: false,
        muted: false,
      }))

      return ctx.inertia.always(() => ({ items: normalized, unmutedCount }))
    },
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
