import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import DataSource from './data_source.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Migration from './migration.js'
import ErrorUserState from './error_user_state.js'

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
  declare avatarUrl: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

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

  @hasMany(() => ErrorUserState, {
    foreignKey: 'userId',
  })
  declare errorStates: HasMany<typeof ErrorUserState>

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
