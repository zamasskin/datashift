import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Migration extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare isActive: boolean

  @column({
    prepare: (value: any) => {
      if (value === null || value === undefined) return null
      try {
        return typeof value === 'string' ? value : JSON.stringify(value)
      } catch {
        return value
      }
    },
    consume: (value: any) => {
      if (value === null || value === undefined) return null
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
  declare fetchConfigs: any[]

  @column({
    prepare: (value: any) => {
      if (value === null || value === undefined) return null
      try {
        return typeof value === 'string' ? value : JSON.stringify(value)
      } catch {
        return value
      }
    },
    consume: (value: any) => {
      if (value === null || value === undefined) return null
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
  declare saveMappings: any[]

  @column({
    prepare: (value: any) => {
      if (value === null || value === undefined) return null
      try {
        return typeof value === 'string' ? value : JSON.stringify(value)
      } catch {
        return value
      }
    },
    consume: (value: any) => {
      if (value === null || value === undefined) return null
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
  declare params: any[]

  @column()
  declare cronExpression: string | null

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
