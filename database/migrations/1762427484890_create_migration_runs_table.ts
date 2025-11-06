import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'migration_runs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('migration_id').unsigned().references('migrations.id').onDelete('CASCADE')
      table.string('status').defaultTo('running')
      table.json('progress').defaultTo([])
      table.string('trigger').nullable()
      table.string('error').nullable()
      table.json('metadata').defaultTo({})

      table.timestamp('created_at')
      table.timestamp('finished_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
