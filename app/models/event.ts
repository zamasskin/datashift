import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import ErrorLog from '#models/error_log'

export default class EventLog extends BaseModel {
  public static table = 'events'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @column()
  declare errorId: number

  @belongsTo(() => ErrorLog, { foreignKey: 'errorId' })
  declare error: BelongsTo<typeof ErrorLog>

  @column()
  declare type: 'error' | 'notify'

  @column()
  declare value: boolean | null

  @column()
  declare muted: boolean | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
