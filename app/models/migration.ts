import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { jsonColumn } from '../helpers/json_column.js'
import { FetchConfig } from '#interfaces/fetchсonfigs'
import { SaveMapping } from '#interfaces/save_mapping'
import { Param } from '#interfaces/params'
import { CronConfig } from '#interfaces/cron_config'

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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
