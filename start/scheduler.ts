import logger from '@adonisjs/core/services/logger'
import CronSchedulerService from '#services/cron_scheduler_service'

declare global {
  var DATASHIFT_CRON_SCHEDULER: CronSchedulerService | undefined
}

if (globalThis.DATASHIFT_CRON_SCHEDULER) {
  logger.info('[cron] scheduler already running, skip re-init')
} else {
  const scheduler = new CronSchedulerService()
  globalThis.DATASHIFT_CRON_SCHEDULER = scheduler
  logger.info('[cron] scheduler started')
  await scheduler.start()

  // Expose stop on process exit (optional)
  process.on('SIGTERM', () => {
    scheduler.stop().catch(() => {})
  })
}
//
