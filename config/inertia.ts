import MigrationRun from '#models/migration_run'
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
    csrfToken: (ctx: HttpContext) => ctx.request.csrfToken,
    runningMigrations: async (ctx) => {
      const running = await MigrationRun.query()
        .preload('migration', (q) => q.select(['id', 'name']))
        .where('status', 'running')
      return ctx.inertia.always(() => running)
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
