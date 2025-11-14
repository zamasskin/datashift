import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('avatar_url')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('avatar_url', 2048).nullable()
    })
  }
}
