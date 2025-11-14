import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  public async up() {
    // Drop legacy table if exists
    try {
      const hasOld = await this.schema.hasTable('error_user_states')
      if (hasOld) {
        this.schema.dropTable('error_user_states')
      }
    } catch {}

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('error_id').unsigned().references('id').inTable('errors').onDelete('CASCADE')
      table.string('type', 32).notNullable() // 'read' | 'mute' | ...
      table.boolean('value').nullable() // для mute: true/false; для read можно null
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      table.index(['user_id', 'error_id', 'type'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
    // Восстановление legacy таблицы не требуется
  }
}
