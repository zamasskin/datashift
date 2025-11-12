import Migration from '#models/migration'
import type { CronConfig } from '#interfaces/cron_config'
import MigrationRunnerService from '#services/migration_runner_service'
import { DateTime } from 'luxon'
import MigrationRun from '#models/migration_run'
import emitter from '@adonisjs/core/services/emitter'
import logger from '@adonisjs/core/services/logger'
import { MigrationCreate, MigrationRemove, MigrationUpdate } from '#events/migration'

type TimerHandle = ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>

const dayMap: Record<string, number> = {
  mo: 1,
  tu: 2,
  we: 3,
  th: 4,
  fr: 5,
  sa: 6,
  su: 7,
}

// Node.js/libuv max delay for timers: ~2^31-1 ms (~24.8 days)
const MAX_DELAY_MS = 2_147_483_647

function toMs(count: number, units: 's' | 'm' | 'h'): number {
  if (units === 's') return count * 1000
  if (units === 'm') return count * 60_000
  return count * 3_600_000
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map((x) => Number(x))
  return h * 60 + m
}

function isDayAllowed(days: string[], dt: DateTime): boolean {
  if (!Array.isArray(days) || days.length === 0) return true
  const set = new Set(days.map((d) => dayMap[d]))
  return set.has(dt.weekday)
}

function isWithinWindow(days: string[], start: string, end: string, dt: DateTime): boolean {
  if (!isDayAllowed(days, dt)) return false
  const nowMin = dt.hour * 60 + dt.minute
  const startMin = timeToMinutes(start)
  const endMin = timeToMinutes(end)
  if (startMin <= endMin) {
    return nowMin >= startMin && nowMin <= endMin
  }
  // overnight window (e.g., 23:00-02:00)
  return nowMin >= startMin || nowMin <= endMin
}

function nextOccurrence(days: string[], time: string, from: DateTime): DateTime {
  const allowed = new Set(days.map((d) => dayMap[d]))
  const [hour, minute] = time.split(':').map((x) => Number(x))
  let candidate = from.set({ hour, minute, second: 0, millisecond: 0 })

  // If today allowed and time is still ahead
  if ((allowed.size === 0 || allowed.has(candidate.weekday)) && candidate > from) {
    return candidate
  }

  // Find the next allowed day
  for (let i = 1; i <= 7; i++) {
    const nextDay = candidate.plus({ days: 1 })
    candidate = nextDay
    if (allowed.size === 0 || allowed.has(candidate.weekday)) {
      return candidate
    }
  }
  return candidate
}

export default class CronSchedulerService {
  private timers = new Map<number, TimerHandle>()
  private runner = new MigrationRunnerService()
  private refreshHandle: TimerHandle | null = null
  private started = false
  private configs = new Map<number, string>()
  private onCreateHandler = this.updateMigrationSchedule.bind(this)
  private onUpdateHandler = this.updateMigrationSchedule.bind(this)
  private onRemoveHandler = this.removeMigrationSchedule.bind(this)

  async start() {
    if (this.started) {
      logger.info('[cron] scheduler already started, skipping')
      return
    }
    logger.info('[cron] starting scheduler')
    await this.loadAndScheduleAll()

    emitter.on(MigrationCreate, this.onCreateHandler)
    emitter.on(MigrationUpdate, this.onUpdateHandler)
    emitter.on(MigrationRemove, this.onRemoveHandler)
    this.started = true
  }

  async stop() {
    if (!this.started) return
    emitter.off(MigrationCreate, this.onCreateHandler)
    emitter.off(MigrationUpdate, this.onUpdateHandler)
    emitter.off(MigrationRemove, this.onRemoveHandler)

    // Mark all currently running migrations as 'cancelled'
    logger.info('[cron] canceling all existing timers')

    await MigrationRun.query()
      .where('status', 'running')
      .where('trigger', 'cron')
      .update({ status: 'canceled', finishedAt: DateTime.now() })

    for (const t of this.timers.values()) {
      clearInterval(t as any)
      clearTimeout(t as any)
    }
    this.timers.clear()
    this.configs.clear()
    if (this.refreshHandle) {
      clearInterval(this.refreshHandle as any)
      this.refreshHandle = null
    }
    this.started = false
  }

  private updateMigrationSchedule(event: MigrationCreate | MigrationUpdate) {
    const migration = event.migration
    logger.info(`[cron] update schedule for migration ${migration.id}`)
    const cfg = migration.cronExpression as CronConfig | null
    const hasTimer = this.timers.has(migration.id)

    // Если миграция выключена — отменяем и выходим
    if (!migration.isActive) {
      if (hasTimer) this.cancel(migration.id)
      this.configs.delete(migration.id)
      logger.info(`[cron][${migration.id}] inactive, schedule canceled`)
      return
    }

    // Нет конфигурации — отменяем при необходимости
    if (!cfg) {
      if (hasTimer) this.cancel(migration.id)
      this.configs.delete(migration.id)
      logger.info(`[cron][${migration.id}] no cronExpression, schedule canceled`)
      return
    }

    // Сравнение конфигов, чтобы не пересоздавать таймер без изменений
    const nextCfgStr = JSON.stringify(cfg)
    const prevCfgStr = this.configs.get(migration.id)
    if (hasTimer && prevCfgStr === nextCfgStr) {
      logger.info(`[cron][${migration.id}] config unchanged, keep existing timer`)
      return
    }

    if (hasTimer) this.cancel(migration.id)
    logger.info(`[cron][${migration.id}] schedule`, cfg)
    this.schedule(migration.id, cfg)
    this.configs.set(migration.id, nextCfgStr)
  }

  private removeMigrationSchedule(event: MigrationRemove) {
    const migration = event.migration
    logger.info(`[cron] remove schedule for migration ${migration.id}`)
    this.cancel(migration.id)
    this.configs.delete(migration.id)
  }

  private async loadAndScheduleAll() {
    const migrations = await Migration.query().where('isActive', true)
    logger.info(`[cron] active migrations: ${migrations.length}`)
    for (const m of migrations) {
      const cfg = m.cronExpression as CronConfig | null
      const hasTimer = this.timers.has(m.id)
      if (!cfg) {
        if (hasTimer) this.cancel(m.id)
        logger.info(`[cron][${m.id}] no cronExpression, skipping`)
        this.configs.delete(m.id)
        continue
      }
      // Пересоздаём таймер только если конфиг изменился или таймер отсутствует
      const nextCfgStr = JSON.stringify(cfg)
      const prevCfgStr = this.configs.get(m.id)
      if (!hasTimer || prevCfgStr !== nextCfgStr) {
        if (hasTimer) this.cancel(m.id)
        logger.info(`[cron][${m.id}] schedule`, cfg)
        this.schedule(m.id, cfg)
        this.configs.set(m.id, nextCfgStr)
      } else {
        logger.info(`[cron][${m.id}] config unchanged, skip reschedule`)
      }
    }
  }

  private cancel(id: number) {
    const t = this.timers.get(id)
    if (t) {
      clearInterval(t as any)
      clearTimeout(t as any)
      this.timers.delete(id)
      console.log(`[cron][${id}] cancel existing timer`)
    }
  }

  // Добавлено: проверка, что миграция уже запущена c триггером 'cron'
  private async isRunning(id: number): Promise<boolean> {
    const lastRun = await MigrationRun.query()
      .where('migrationId', id)
      .where('status', 'running')
      .where('trigger', 'cron')
      .orderBy('createdAt', 'desc')
      .first()
    return !!lastRun
  }

  private schedule(id: number, cfg: CronConfig) {
    switch (cfg.type) {
      case 'interval': {
        const ms = toMs(cfg.count, cfg.units)
        logger.info(`[cron][${id}] interval period: ${ms}ms`)
        this.scheduleSafeInterval(id, ms, async () => {
          logger.debug(`[cron][${id}] interval tick`)
          try {
            if (await this.isRunning(id)) return
            await this.runner.runById(id, 'cron')
          } catch (e: any) {
            logger.warn(`[cron][${id}] run skipped/error: ${e?.message || e}`)
          }
        })
        break
      }
      case 'interval-time': {
        const periodMs = cfg.timeUnits * 60_000
        logger.info(
          `[cron][${id}] interval-time period: ${periodMs}ms window ${cfg.timeStart}-${cfg.timeEnd}`
        )
        this.scheduleSafeInterval(id, periodMs, async () => {
          try {
            const now = DateTime.local()
            if (!isWithinWindow(cfg.days || [], cfg.timeStart, cfg.timeEnd, now)) return
            if (await this.isRunning(id)) return
            await this.runner.runById(id, 'cron')
          } catch (e: any) {
            logger.warn(`[cron][${id}] run skipped/error: ${e?.message || e}`)
          }
        })
        break
      }
      case 'time': {
        const scheduleNext = () => {
          const from = DateTime.local()
          const next = nextOccurrence(cfg.days || [], cfg.time, from)
          const diffMs = Math.max(0, next.toMillis() - from.toMillis())
          const t = setTimeout(async () => {
            try {
              if (await this.isRunning(id)) {
                // Пропускаем запуск и просто планируем следующий
                scheduleNext()
                return
              }
              await this.runner.runById(id, 'cron')
            } catch (e: any) {
              console.warn(`[cron][${id}] run skipped/error:`, e?.message || e)
            } finally {
              scheduleNext()
            }
          }, diffMs)
          this.timers.set(id, t)
        }
        scheduleNext()
        break
      }
      default:
        console.warn(`[cron][${id}] unknown config type`)
    }
  }

  /**
   * Schedule a safe repeating task. If periodMs <= MAX_DELAY_MS uses setInterval.
   * Otherwise, chains setTimeout chunks to cover very large delays reliably.
   */
  private scheduleSafeInterval(id: number, periodMs: number, tick: () => Promise<void>) {
    if (periodMs <= MAX_DELAY_MS) {
      const h = setInterval(async () => {
        await tick()
      }, periodMs)
      this.timers.set(id, h)
      return
    }

    logger.info(
      `[cron][${id}] period exceeds max delay (${MAX_DELAY_MS}ms), using chunked timeouts`
    )
    const scheduleChunk = (remaining: number) => {
      const chunk = Math.min(remaining, MAX_DELAY_MS)
      const h = setTimeout(async () => {
        const next = remaining - chunk
        if (next > 0) {
          // keep counting down
          scheduleChunk(next)
        } else {
          try {
            await tick()
          } finally {
            // repeat full period
            scheduleChunk(periodMs)
          }
        }
      }, chunk)
      this.timers.set(id, h)
    }
    scheduleChunk(periodMs)
  }
}
