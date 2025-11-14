import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('message').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('message')
    })
  }
}
