import logger from '@adonisjs/core/services/logger'
import CronSchedulerService from '#services/cron_scheduler_service'
import { randomUUID } from 'node:crypto'
import MigrationRun from '#models/migration_run'
import MigrationRunnerService from '#services/migration_runner_service'
import { DateTime } from 'luxon'

// Ensure singleton across HMR reloads
const globalAny = globalThis as any
// Create a unique instance ID per application boot (persisted across HMR)
if (!globalAny.DATASHIFT_INSTANCE_ID) {
  globalAny.DATASHIFT_INSTANCE_ID = randomUUID()
  logger.info(`[core] instanceId=${globalAny.DATASHIFT_INSTANCE_ID}`)
}
if (!globalAny.DATASHIFT_CRON_SCHEDULER) {
  globalAny.DATASHIFT_CRON_SCHEDULER = new CronSchedulerService()
  logger.info('[cron] scheduler instance created')
}
const scheduler: CronSchedulerService = globalAny.DATASHIFT_CRON_SCHEDULER

// On boot, recover orphaned running migrations from previous instance
async function recoverOrphanedRuns() {
  const instanceId = globalAny.DATASHIFT_INSTANCE_ID
  const runs = await MigrationRun.query().where('status', 'running')
  const orphaned = runs.filter((r) => {
    const runInstance = (r.metadata && r.metadata.instanceId) || null
    return runInstance && runInstance !== instanceId
  })
  if (orphaned.length > 0) {
    logger.info(`[recovery] orphaned running migrations: ${orphaned.length}`)
  }
  for (const r of orphaned) {
    try {
      r.status = 'failed'
      r.finishedAt = DateTime.now()
      r.error = 'Orphaned by app restart; marked as failed'
      await r.save()
      // Auto-resume: start a new run for the same migration
      const runner = new MigrationRunnerService()
      // Use trigger 'resume' to distinguish these runs
      await runner.runById(r.migrationId, 'resume')
      logger.info(`[recovery][${r.migrationId}] resumed after orphan detection`)
    } catch (e) {
      logger.error(`[recovery][${r.migrationId}] failed to resume`, e)
    }
  }
}

// Run recovery in background to avoid blocking boot
recoverOrphanedRuns().catch((e) => logger.error('[recovery] background failed', e))

// Start scheduler when application boots (idempotent)
await scheduler.start()

// Expose stop on process exit (optional)
process.on('SIGTERM', () => {
  scheduler.stop().catch(() => {})
})
//
