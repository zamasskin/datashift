import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import ErrorLog from '#models/error_log'

export default class ErrorUserState extends BaseModel {
  public static table = 'error_user_states'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare errorId: number

  @belongsTo(() => ErrorLog, {
    foreignKey: 'errorId',
  })
  declare error: BelongsTo<typeof ErrorLog>

  @column()
  declare userId: number

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @column.dateTime()
  declare readAt: DateTime | null

  @column.dateTime()
  declare mutedUntil: DateTime | null

  @column()
  declare muted: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
