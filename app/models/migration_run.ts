import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Migration from '#models/migration'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class MigrationRun extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare migrationId: number

  @belongsTo(() => Migration, {
    foreignKey: 'migrationId',
  })
  declare migration: BelongsTo<typeof Migration>

  @column()
  declare status: 'pending' | 'running' | 'success' | 'failed' | 'canceled'

  @column()
  declare progress: number[]

  @column()
  declare trigger: 'manual' | 'cron' | 'api'

  @column()
  declare error: string | null

  @column()
  declare metadata: any

  @column()
  declare pid: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime()
  declare finishedAt: DateTime | null

  isCanceled() {
    return this.status === 'canceled'
  }
}
