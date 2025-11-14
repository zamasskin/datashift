import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { jsonColumn } from '../helpers/json_column.js'
import Migration from './migration.js'
import MigrationRun from './migration_run.js'
import Event from '#models/event'

export default class ErrorLog extends BaseModel {
  public static table = 'errors'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare migrationRunId: number | null

  @belongsTo(() => MigrationRun, {
    foreignKey: 'migrationRunId',
  })
  declare migrationRun: BelongsTo<typeof MigrationRun>

  @column()
  declare migrationId: number | null

  @belongsTo(() => Migration, {
    foreignKey: 'migrationId',
  })
  declare migration: BelongsTo<typeof Migration>

  @column()
  declare trigger: 'manual' | 'cron' | 'api' | null

  @column()
  declare severity: 'error' | 'warning' | 'info'

  @column()
  declare code: string | null

  @column()
  declare message: string | null

  @column(jsonColumn())
  declare context: Record<string, any>

  @column()
  declare stack: string | null

  @column()
  declare stackHash: string | null

  @column()
  declare source: 'runner' | 'scheduler' | 'system' | null

  @column()
  declare status: 'open' | 'resolved'

  @column.dateTime()
  declare occurredAt: DateTime | null

  @column()
  declare environment: string | null

  @column()
  declare hostname: string | null

  @hasMany(() => Event, {
    foreignKey: 'errorId',
  })
  declare events: HasMany<typeof Event>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
