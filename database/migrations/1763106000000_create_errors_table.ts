import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'errors'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.uuid('uuid').notNullable().unique()

      table
        .integer('migration_run_id')
        .unsigned()
        .references('migration_runs.id')
        .onDelete('SET NULL')
        .nullable()

      table
        .integer('migration_id')
        .unsigned()
        .references('migrations.id')
        .onDelete('SET NULL')
        .nullable()

      table.string('trigger').nullable() // manual | cron | api
      table.string('severity').notNullable().defaultTo('error') // error | warning | info
      table.string('code').nullable()
      table.text('message').nullable()
      table.json('context').defaultTo({})
      table.text('stack').nullable()
      table.string('stack_hash').nullable()
      table.string('source').nullable() // runner | scheduler | system
      table.string('status').notNullable().defaultTo('open') // open | resolved

      table.timestamp('occurred_at')
      table.string('environment').nullable()
      table.string('hostname').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['status', 'occurred_at'], 'errors_status_occurred_at_idx')
      table.index(['migration_id'], 'errors_migration_id_idx')
      table.index(['migration_run_id'], 'errors_migration_run_id_idx')
      table.index(['code'], 'errors_code_idx')
      table.index(['stack_hash'], 'errors_stack_hash_idx')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
