import logger from '@adonisjs/core/services/logger'
import CronSchedulerService from '#services/cron_scheduler_service'

const scheduler = new CronSchedulerService()
logger.info('[cron] scheduler started')

// Start scheduler when application boots
await scheduler.start()

// Expose stop on process exit (optional)
process.on('SIGTERM', () => {
  scheduler.stop().catch(() => {})
})
//
