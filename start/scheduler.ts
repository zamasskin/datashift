import logger from '@adonisjs/core/services/logger'
import CronSchedulerService from '#services/cron_scheduler_service'

// Ensure singleton across HMR reloads
const globalAny = globalThis as any
if (!globalAny.DATASHIFT_CRON_SCHEDULER) {
  globalAny.DATASHIFT_CRON_SCHEDULER = new CronSchedulerService()
  logger.info('[cron] scheduler instance created')
}
const scheduler: CronSchedulerService = globalAny.DATASHIFT_CRON_SCHEDULER

// Start scheduler when application boots (idempotent)
await scheduler.start()

// Expose stop on process exit (optional)
process.on('SIGTERM', () => {
  scheduler.stop().catch(() => {})
})
//
