import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, computed } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class DataSource extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare type: string

  @column({
    prepare: (value: any) => {
      if (value === null || value === undefined) return null
      // Для MySQL/SQLite храним JSON как строку
      try {
        return typeof value === 'string' ? value : JSON.stringify(value)
      } catch {
        return value
      }
    },
    consume: (value: any) => {
      if (value === null || value === undefined) return null
      // Преобразуем строку JSON обратно в объект
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return value
        }
      }
      return value
    },
  })
  declare config: Record<string, any>

  @column()
  declare userId: number

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @computed()
  public get createdAtFormatted() {
    const dt = this.createdAt
    return dt ? dt.toUTC().toFormat('dd.MM.yyyy HH:mm:ss') : null
  }

  @computed()
  public get updatedAtFormatted() {
    const dt = this.updatedAt
    return dt ? dt.toUTC().toFormat('dd.MM.yyyy HH:mm:ss') : null
  }
}
