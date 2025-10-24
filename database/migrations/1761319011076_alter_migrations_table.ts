import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'migrations'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('params').defaultTo([])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('params')
    })
  }
}
