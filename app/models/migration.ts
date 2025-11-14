import { DateTime } from 'luxon'
import {
  afterCreate,
  afterDelete,
  afterUpdate,
  BaseModel,
  belongsTo,
  column,
  hasMany,
} from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { jsonColumn } from '../helpers/json_column.js'
import { FetchConfig } from '#interfaces/fetchсonfigs'
import { SaveMapping } from '#interfaces/save_mapping'
import { Param } from '#interfaces/params'
import { CronConfig } from '#interfaces/cron_config'
import MigrationRun from './migration_run.js'
import ErrorLog from './error_log.js'
import { MigrationCreate, MigrationRemove, MigrationUpdate } from '#events/migration'

export default class Migration extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare isActive: boolean

  @column(jsonColumn())
  declare fetchConfigs: FetchConfig[]

  @column(jsonColumn())
  declare saveMappings: SaveMapping[]

  @column(jsonColumn())
  declare params: Param[]

  @column(jsonColumn())
  declare cronExpression: CronConfig | null

  @column()
  declare createdBy: number

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare user: BelongsTo<typeof User>

  @hasMany(() => MigrationRun, {
    foreignKey: 'migrationId',
  })
  declare migrationRuns: HasMany<typeof MigrationRun>

  @hasMany(() => ErrorLog, {
    foreignKey: 'migrationId',
  })
  declare errorLogs: HasMany<typeof ErrorLog>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @afterCreate()
  static emitCreate(migration: Migration) {
    MigrationCreate.dispatch(migration)
  }

  @afterUpdate()
  static emitUpdate(migration: Migration) {
    MigrationUpdate.dispatch(migration)
  }

  @afterDelete()
  static emitRemove(migration: Migration) {
    MigrationRemove.dispatch(migration)
  }
}
