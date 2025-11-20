import MigrationRun from '#models/migration_run'
import Migration from '#models/migration'
import { ParamsService } from '#services/params_service'
import FetchConfigService from '#services/fetchсonfigs'
import SqlService from '#services/sql_service'
import type { FetchConfig, FetchConfigResult } from '#interfaces/fetchсonfigs'
import type { SaveMapping } from '#interfaces/save_mapping'
import type { Param } from '#interfaces/params'
import { DateTime } from 'luxon'
import ErrorLog from '#models/error_log'
import { randomUUID, createHash } from 'node:crypto'
import logger from '@adonisjs/core/services/logger'
import EventLog from '#models/event'
import { EventCreate } from '#events/event'

type TriggerType = 'manual' | 'cron' | 'api' | 'resume'

export type RunPayload = {
  id: number
  fetchConfigs: FetchConfig[]
  saveMappings: SaveMapping[]
  params: Param[]
  trigger: TriggerType
}

/**
 * MigrationRunnerService
 * Programmatic runner for migrations, mirroring controller's private migrate()
 */
export default class MigrationRunnerService {
  /**
   * Run migration by ID with trigger label
   */
  async runById(id: number, trigger: TriggerType = 'cron') {
    const migration = await Migration.find(id)
    if (!migration) throw new Error(`Migration not found: ${id}`)
    return this.run({
      id: migration.id,
      fetchConfigs: Array.isArray(migration.fetchConfigs) ? migration.fetchConfigs : [],
      saveMappings: Array.isArray(migration.saveMappings) ? migration.saveMappings : [],
      params: Array.isArray(migration.params) ? migration.params : [],
      trigger,
    })
  }

  /**
   * Core execution flow
   */
  async run({ id, params, fetchConfigs, saveMappings, trigger }: RunPayload) {
    const lastRun = await MigrationRun.query()
      .where('migrationId', id)
      .where('status', 'running')
      .where('trigger', trigger)
      .orderBy('createdAt', 'desc')
      .first()

    if (lastRun) {
      throw new Error('Migration is already running')
    }

    const migrationRun = await MigrationRun.create({
      migrationId: id,
      status: 'running',
      progress: [],
      trigger,
      metadata: {},
    })

    // Attach runtime identity for orphan detection and recovery after restart
    try {
      const instanceId = (globalThis as any).DATASHIFT_INSTANCE_ID
      migrationRun.metadata = {
        ...migrationRun.metadata,
        instanceId: instanceId ?? 'unknown',
      }
      migrationRun.pid = process.pid
      await migrationRun.save()
    } catch {}

    // SIGINT cancel handling removed: canceled status is not used for restarts

    try {
      const paramsService = new ParamsService()
      const fetchConfigService = new FetchConfigService()
      const sqlService = new SqlService()

      const paramsSource = paramsService.getSource(params)
      const initialResults: FetchConfigResult[] = [{ dataType: 'params', data: paramsSource }]
      if (!Array.isArray(fetchConfigs) || fetchConfigs.length === 0) {
        throw new Error('Нет конфигураций для выполнения')
      }

      const saveSummary: Record<string, number> = {}

      for await (const { data, meta } of fetchConfigService.execute(fetchConfigs, initialResults)) {
        await migrationRun.refresh()
        if (migrationRun.status !== 'running') {
          return { ok: false, cancelled: true, summary: saveSummary }
        }

        migrationRun.progress = meta.progressList
        migrationRun.save()

        if (data.dataType !== 'array_columns') continue

        const mappings: any[] = Array.isArray(saveMappings) ? saveMappings : []
        const rows: Record<string, any>[] = Array.isArray(data.data) ? data.data : []

        for (const mapping of mappings) {
          await migrationRun.refresh()
          if (migrationRun.status !== 'running') {
            return { ok: false, cancelled: true, summary: saveSummary }
          }
          const count = await sqlService.applySaveMappingToRows(mapping, rows)
          if (mapping && mapping.id) {
            saveSummary[mapping.id] = (saveSummary[mapping.id] || 0) + count
          }
        }
      }

      await migrationRun.refresh()
      if (migrationRun.status !== 'running') {
        return { ok: false, cancelled: true, summary: saveSummary }
      }

      migrationRun.status = 'success'
      migrationRun.finishedAt = DateTime.now()
      await migrationRun.save()

      return { ok: true, summary: saveSummary }
    } catch (error) {
      migrationRun.status = 'failed'
      migrationRun.finishedAt = DateTime.now()
      // Short summary for fast UI reads
      const message = String(error)
      migrationRun.error = message
      await migrationRun.save()
      // Persist detailed error to errors table
      try {
        const stack = (error as any)?.stack ?? null
        const code = (error as any)?.code ?? null
        const stackHash = stack ? createHash('sha1').update(stack).digest('hex') : null
        const errorLog = await ErrorLog.create({
          uuid: randomUUID(),
          migrationRunId: migrationRun.id,
          migrationId: migrationRun.migrationId,
          trigger,
          severity: 'error',
          code: code ?? null,
          message,
          context: {
            params,
            progress: migrationRun.progress,
          },
          stack,
          stackHash,
          source: 'runner',
          status: 'open',
          occurredAt: DateTime.now(),
          environment: process.env.NODE_ENV || null,
          hostname: process.env.HOSTNAME || null,
        })

        const migration = await migrationRun.related('migration').query().first()
        if (!migration) {
          logger.warn(
            '[migration_runner_service] Migration record not found for error notification',
            { migrationId: migrationRun.migrationId }
          )
          return
        }

        // TODO: Нужно подписывать остальных пользователей на событие
        const ownerId = migration.createdBy
        const event = await EventLog.create({
          errorId: errorLog.id,
          userId: ownerId,
          type: 'error',
          message,
          muted: false,
        })
        // Уведомим слушателей о новом уведомлении
        try {
          EventCreate.dispatch(event)
        } catch {}
        // }
      } catch (e) {
        logger.error('[migration_runner_service] Failed to log error to errors table', e)
      }
      throw error
    }
  }
}
//
