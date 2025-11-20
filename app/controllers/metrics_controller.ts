import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

type DayPoint = { date: string; value: number }

function makeDateRangeDays(days: number): string[] {
  const out: string[] = []
  const start = DateTime.now()
    .toUTC()
    .minus({ days: days - 1 })
    .startOf('day')
  for (let i = 0; i < days; i++) {
    out.push(start.plus({ days: i }).toISODate())
  }
  return out
}

function toIsoDay(input: unknown): string {
  if (input === null || input === undefined) return ''
  if (input instanceof Date) return input.toISOString().slice(0, 10)
  const str = String(input)
  // Try to match YYYY-MM-DD at the start
  const m = str.match(/^\d{4}-\d{2}-\d{2}/)
  if (m) return m[0]
  const d = new Date(str)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return str.slice(0, 10)
}

function normalizeSeries(rows: Array<{ day: unknown; count: unknown }>, days: number): DayPoint[] {
  const map = new Map<string, number>()
  for (const r of rows) {
    const key = toIsoDay((r as any).day)
    if (!key) continue
    const count = Number((r as any).count) || 0
    map.set(key, count)
  }
  return makeDateRangeDays(days).map((d) => ({ date: d, value: map.get(d) || 0 }))
}

export default class MetricsController {
  /**
   * GET /metrics/dashboard
   * Returns simple daily aggregates for last N days.
   */
  async dashboard({ request }: HttpContext) {
    const days = Math.max(7, Math.min(Number(request.input('days') || 30), 90))
    const from = DateTime.now()
      .toUTC()
      .minus({ days: days - 1 })
      .startOf('day')
      .toJSDate()

    // MigrationRuns per day (created_at)
    const runsRaw = await db
      .from('migration_runs')
      .where('created_at', '>=', from)
      .select(db.raw('DATE(created_at) as day'), db.raw('COUNT(*) as count'))
      .groupBy('day')
      .orderBy('day', 'asc')

    // Successful runs per day
    const runsSuccessRaw = await db
      .from('migration_runs')
      .where('created_at', '>=', from)
      .where('status', 'success')
      .select(db.raw('DATE(created_at) as day'), db.raw('COUNT(*) as count'))
      .groupBy('day')
      .orderBy('day', 'asc')

    // Canceled runs per day
    const runsCanceledRaw = await db
      .from('migration_runs')
      .where('created_at', '>=', from)
      .where('status', 'canceled')
      .select(db.raw('DATE(created_at) as day'), db.raw('COUNT(*) as count'))
      .groupBy('day')
      .orderBy('day', 'asc')

    // Errors per day (occurred_at if present, else created_at)
    const errorsRaw = await db
      .from('errors')
      .whereRaw('COALESCE(occurred_at, created_at) >= ?', [from])
      .select(db.raw('DATE(COALESCE(occurred_at, created_at)) as day'), db.raw('COUNT(*) as count'))
      .groupBy('day')
      .orderBy('day', 'asc')

    return {
      range: {
        from: DateTime.fromJSDate(from).toISODate(),
        to: DateTime.now().toUTC().toISODate(),
        days,
      },
      series: {
        migrationRuns: normalizeSeries(runsRaw as any, days),
        errors: normalizeSeries(errorsRaw as any, days),
        runsSuccess: normalizeSeries(runsSuccessRaw as any, days),
        runsCanceled: normalizeSeries(runsCanceledRaw as any, days),
      },
    }
  }

  /**
   * GET /metrics/migration/:id
   * Returns daily aggregates for a specific migration for last N days.
   */
  async migration({ request, params }: HttpContext) {
    const id = Number(params.id)
    const days = Math.max(7, Math.min(Number(request.input('days') || 30), 90))
    const from = DateTime.now()
      .toUTC()
      .minus({ days: days - 1 })
      .startOf('day')
      .toJSDate()

    if (!Number.isFinite(id) || id <= 0) {
      return {
        range: {
          from: DateTime.fromJSDate(from).toISODate(),
          to: DateTime.now().toUTC().toISODate(),
          days,
        },
        series: { migrationRuns: {}, errors: {}, runsSuccess: {}, runsCanceled: {} },
      }
    }

    // MigrationRuns per day (created_at)
    const runsRaw = await db
      .from('migration_runs')
      .where('migration_id', id)
      .where('created_at', '>=', from)
      .select(db.raw('DATE(created_at) as day'), db.raw('COUNT(*) as count'))
      .groupBy('day')
      .orderBy('day', 'asc')

    // Successful runs per day
    const runsSuccessRaw = await db
      .from('migration_runs')
      .where('migration_id', id)
      .where('created_at', '>=', from)
      .where('status', 'success')
      .select(db.raw('DATE(created_at) as day'), db.raw('COUNT(*) as count'))
      .groupBy('day')
      .orderBy('day', 'asc')

    // Canceled runs per day
    const runsCanceledRaw = await db
      .from('migration_runs')
      .where('migration_id', id)
      .where('created_at', '>=', from)
      .where('status', 'canceled')
      .select(db.raw('DATE(created_at) as day'), db.raw('COUNT(*) as count'))
      .groupBy('day')
      .orderBy('day', 'asc')

    // Errors per day (occurred_at if present, else created_at)
    const errorsRaw = await db
      .from('errors')
      .where('migration_id', id)
      .whereRaw('COALESCE(occurred_at, created_at) >= ?', [from])
      .select(db.raw('DATE(COALESCE(occurred_at, created_at)) as day'), db.raw('COUNT(*) as count'))
      .groupBy('day')
      .orderBy('day', 'asc')

    return {
      range: {
        from: DateTime.fromJSDate(from).toISODate(),
        to: DateTime.now().toUTC().toISODate(),
        days,
      },
      series: {
        migrationRuns: normalizeSeries(runsRaw as any, days),
        errors: normalizeSeries(errorsRaw as any, days),
        runsSuccess: normalizeSeries(runsSuccessRaw as any, days),
        runsCanceled: normalizeSeries(runsCanceledRaw as any, days),
      },
    }
  }
}
