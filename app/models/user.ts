import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import DataSource from './data_source.js'
import File from './file.js'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import Migration from './migration.js'
import Event from './event.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: 'user' | 'admin'

  @column()
  declare fileId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @hasMany(() => DataSource, {
    foreignKey: 'userId',
  })
  declare dataSources: HasMany<typeof DataSource>

  @hasMany(() => Migration, {
    foreignKey: 'userId',
  })
  declare migrations: HasMany<typeof Migration>

  @hasMany(() => Event, {
    foreignKey: 'userId',
  })
  declare events: HasMany<typeof Event>

  @belongsTo(() => File, {
    foreignKey: 'fileId',
  })
  declare avatarFile: BelongsTo<typeof File>

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
